import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ToolsGrid } from './components/ToolsGrid';
import { PdfPageSelector } from './components/PdfPageSelector';
import { FileQueueList } from './components/FileQueueList'; 
import { PdfEditorManager } from './components/PdfEditorManager'; // Importação do arquivo separado
import { useImageConverter } from './hooks/useImageConverter';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import { useToolValidation } from './hooks/useToolValidation'; 
import { PDFDocument } from 'pdf-lib';

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]); 
  const [appError, setAppError] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); // Estado para travar botões em carregamento do editor
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const { executeImageToPdf, isProcessing: isConverting, converterError } = useImageConverter();
  const { pages, isRendering, renderError, renderPdfPages, clearRenderedPages } = usePdfRenderer();

  const { validateAction } = useToolValidation({
    currentFile,
    onError: setAppError
  });

  const handleFileLoaded = useCallback((file: File | null) => {
    if (!file) {
      setCurrentFile(null);
      setMergeFiles([]);
      setAppError(null);
      setActiveTool(null);
      clearRenderedPages();
      return;
    }

    const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAppError("O arquivo excede o limite máximo permitido de 30 MB.");
      setCurrentFile(null);
      return;
    }

    setAppError(null);
    setActiveTool(null);
    clearRenderedPages();
    setCurrentFile(file);
    setMergeFiles((prev) => [...prev, file]); 
  }, [clearRenderedPages]);

  const handleRemoveFromQueue = useCallback((indexToRemove: number) => {
    setMergeFiles((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      if (updated.length === 0) {
        setCurrentFile(null);
      } else {
        setCurrentFile(updated[updated.length - 1]);
      }
      return updated;
    });
  }, []);

  const handleClearQueue = useCallback(() => {
    setMergeFiles([]);
    setCurrentFile(null);
    setAppError(null);
  }, []);

  const handleConvertTrigger = useCallback(() => {
    validateAction("Converter PDF", async () => {
      await executeImageToPdf(currentFile!);
      setCurrentFile(null);
      setMergeFiles([]);
      setActiveTool(null);
    });
  }, [currentFile, executeImageToPdf, validateAction]);

  const handleSplitSetupTrigger = useCallback(() => {
    validateAction("Dividir PDF", async () => {
      setActiveTool('dividir');
      await renderPdfPages(currentFile!);
    });
  }, [currentFile, renderPdfPages, validateAction]);

  // GATILHO DA NOVA FEATURE: Aciona a engine de renderização e chaveia a visualização para o Editor
  const handleEditSetupTrigger = useCallback(() => {
    validateAction("Editar PDF", async () => {
      setActiveTool('editar');
      setIsEditing(true);
      await renderPdfPages(currentFile!);
      setIsEditing(false);
    });
  }, [currentFile, renderPdfPages, validateAction]);

  const handleMergeTrigger = useCallback(() => {
    validateAction("Mesclar PDF", async () => {
      if (mergeFiles.length < 2) {
        setAppError("A ferramenta de mesclagem necessita de pelo menos 2 arquivos carregados.");
        return;
      }

      setIsMerging(true);
      setAppError(null);
      let url: string | null = null;

      try {
        const mergedPdf = await PDFDocument.create();

        for (const file of mergeFiles) {
          const arrayBuffer = await file.arrayBuffer();
          const sourceDoc = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(sourceDoc, sourceDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'bolt_pdf_mesclado.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setCurrentFile(null);
        setMergeFiles([]);
        setActiveTool(null);
      } catch (err) {
        setAppError('Falha crítica de engenharia ao mesclar os arquivos PDF.');
        console.error(err);
      } finally {
        setIsMerging(false);
        if (url) {
          setTimeout(() => URL.revokeObjectURL(url!), 60000);
        }
      }
    });
  }, [mergeFiles, validateAction]);

  const handleProcessDivision = useCallback(async (selectedPageNumbers: number[]) => {
    if (!currentFile) return;
    
    const safeFileName = currentFile.name; 
    setIsSplitting(true);
    setAppError(null);
    let url: string | null = null;

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const zeroBasedIndices = selectedPageNumbers.map(num => num - 1);
      const copiedPages = await newPdf.copyPages(sourcePdf, zeroBasedIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const baseName = safeFileName.substring(0, safeFileName.lastIndexOf('.')) || safeFileName;
      link.download = `${baseName}_dividido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCurrentFile(null);
      setMergeFiles([]);
      setActiveTool(null);
      clearRenderedPages();
    } catch (err) {
      setAppError('Falha crítica de engenharia ao fatiar as páginas do PDF.');
      console.error(err);
    } finally {
      setIsSplitting(false);
      if (url) {
        setTimeout(() => URL.revokeObjectURL(url!), 60000);
      }
    }
  }, [currentFile, clearRenderedPages]);

  const handleCancelAction = useCallback(() => {
    setCurrentFile(null);
    setMergeFiles([]);
    setAppError(null);
    setActiveTool(null);
    clearRenderedPages();
  }, [clearRenderedPages]);

  const globalProcessing = isConverting || isRendering || isSplitting || isMerging || isEditing;
  const showSelector = activeTool === 'dividir' && pages.length > 0;
  const showEditor = activeTool === 'editar' && pages.length > 0;
  const activeError = appError || converterError || renderError;

  return (
    <div className="min-h-screen bg-[#0B0F19] relative flex flex-col items-center justify-start py-24 px-4 overflow-y-auto">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00F0FF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9437FF]/5 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="w-full flex flex-col items-center justify-start z-10">
        <h1 className="text-2xl font-black text-white mt-12 mb-6 tracking-wider uppercase text-center">
          {showSelector ? 'Divisor de Páginas' : showEditor ? 'Editor de PDF' : 'Arrastar e Soltar'}
        </h1>

        {showSelector ? (
          <PdfPageSelector
            pages={pages}
            onProcessDivision={handleProcessDivision}
            onCancel={handleCancelAction}
            isProcessing={isSplitting}
          />
        ) : showEditor ? (
          <PdfEditorManager 
            currentFile={currentFile!}
            pages={pages.map(page => typeof page === 'string' ? page : (page as any).dataUrl || (page as any).url || '')}
            onCancel={handleCancelAction}
            onError={setAppError}
          />
        ) : (
          <DropZone 
            onFileAccepted={handleFileLoaded} 
            currentFile={currentFile} 
            error={activeError}
            isProcessing={globalProcessing}
          />
        )}

        {!showSelector && !showEditor && (
          <FileQueueList 
            mergeFiles={mergeFiles}
            onRemoveFile={handleRemoveFromQueue}
            onClearQueue={handleClearQueue}
          />
        )}

        <ToolsGrid 
          currentFile={currentFile} 
          onConvert={handleConvertTrigger}
          onSplit={handleSplitSetupTrigger}
          onMerge={handleMergeTrigger}
          onEdit={handleEditSetupTrigger}
          isProcessing={globalProcessing}
        />
      </main>
    </div>
  );
}

export default App;
