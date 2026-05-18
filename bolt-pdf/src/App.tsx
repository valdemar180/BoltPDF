import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ToolsGrid } from './components/ToolsGrid';
import { PdfPageSelector } from './components/PdfPageSelector';
import { FileQueueList } from './components/FileQueueList'; 
import { PdfEditorManager } from './components/PdfEditorManager';
import { useImageConverter } from './hooks/useImageConverter';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import { useToolValidation } from './hooks/useToolValidation'; 
import { PDFDocument } from 'pdf-lib';

function Footer() {
  return (
    <footer className="w-full mt-auto pt-8 pb-6 border-t border-gray-800/20 z-10 flex flex-col items-center justify-center gap-1.5 text-center">
      <div className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
        © Valdemar Oliveira
      </div>
      <div className="text-xs text-gray-500 font-medium tracking-wide">
        20/05/2026
      </div>
      <div className="text-xs text-gray-500 font-medium tracking-wide">
        Todos os direitos reservados
      </div>
    </footer>
  );
}

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]); 
  const [appError, setAppError] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Registro de URLs criadas para limpeza centralizada contra vazamento de memória
  const activeUrlsRef = useRef<string[]>([]);

  const { executeImageToPdf, isProcessing: isConverting, converterError } = useImageConverter();
  const { pages, isRendering, renderError, renderPdfPages, clearRenderedPages } = usePdfRenderer();
  
  const { validateAction } = useToolValidation({
    currentFile,
    onError: setAppError
  });

  // Limpeza de URLs no desmonte do componente para proteção de memória RAM
  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const trackAndRevokeUrl = (url: string) => {
    activeUrlsRef.current.push(url);
    setTimeout(() => {
      URL.revokeObjectURL(url);
      activeUrlsRef.current = activeUrlsRef.current.filter(u => u !== url);
    }, 60000);
  };

  // Corrigido para lidar nativamente com a carga em lote (Array de Arquivos)
  const handleFilesLoaded = useCallback((files: File[]) => {
    if (files.length === 0) {
      setCurrentFile(null);
      setMergeFiles([]);
      setAppError(null);
      setActiveTool(null);
      clearRenderedPages();
      return;
    }

    const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;
    const validFiles: File[] = [];
    let hasOversizedFile = false;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        hasOversizedFile = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasOversizedFile) {
      setAppError("Um ou mais arquivos excederam o limite máximo permitido de 30 MB e foram ignorados.");
    } else {
      setAppError(null);
    }

    if (validFiles.length > 0) {
      clearRenderedPages();
      setActiveTool(null);
      // Define o último arquivo válido selecionado como o principal em exibição
      setCurrentFile(validFiles[validFiles.length - 1]);
      // Atualiza o estado da fila de uma única vez (atômico)
      setMergeFiles((prev) => [...prev, ...validFiles]);
    }
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

  const handleEditSetupTrigger = useCallback(() => {
    validateAction("Editar PDF", async () => {
      setActiveTool('editar');
      setIsEditing(true);
      await renderPdfPages(currentFile!);
      setIsEditing(false);
    });
  }, [currentFile, renderPdfPages, validateAction]);

  const handleSignSetupTrigger = useCallback(() => {
    validateAction("Assinar Documento", async () => {
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
      } {
        setIsMerging(false);
        if (url) trackAndRevokeUrl(url);
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
      if (url) trackAndRevokeUrl(url);
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
    <div className="min-h-screen bg-[#0B0F19] relative flex flex-col items-center justify-start pt-3 pb-4 px-4 overflow-y-auto">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00F0FF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9437FF]/5 rounded-full blur-[140px] pointer-events-none" />
      
      <Header />
      
      <main className="w-full flex flex-col items-center justify-start z-10 mb-8">
        <h1 className="text-2xl font-black text-white mt-2 mb-4 tracking-wider uppercase text-center">
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
            // Substituição segura do 'as any' com fallback tipado em tempo de execução
            pages={pages.map(page => {
              if (typeof page === 'string') return page;
              if (page && typeof page === 'object') {
                return (page as { dataUrl?: string; url?: string }).dataUrl || 
                       (page as { dataUrl?: string; url?: string }).url || '';
              }
              return '';
            })}
            onCancel={handleCancelAction}
            onError={setAppError}
          />
        ) : (
          <DropZone
            onFilesAccepted={handleFilesLoaded}
            currentFiles={mergeFiles}
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
          onSign={handleSignSetupTrigger}
          isProcessing={globalProcessing}
        />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
