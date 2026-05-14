import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ToolsGrid } from './components/ToolsGrid';
import { PdfPageSelector } from './components/PdfPageSelector';
import { useImageConverter } from './hooks/useImageConverter';
import { usePdfRenderer } from './hooks/usePdfRenderer';
import { PDFDocument } from 'pdf-lib';

function App() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  
  // Rastreia qual ação o usuário escolheu executar no momento
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Instanciação das engines lógicas isoladas
  const { executeImageToPdf, isProcessing: isConverting, converterError } = useImageConverter();
  const { pages, isRendering, renderError, renderPdfPages, clearRenderedPages } = usePdfRenderer();

  // Tratamento defensivo preparado para receber File ou null (remoção)
  const handleFileLoaded = useCallback((file: File | null) => {
    if (!file) {
      setCurrentFile(null);
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
    setActiveTool(null); // Reseta o estado da ferramenta ativa ao subir novo arquivo
    clearRenderedPages();
    setCurrentFile(file);
  }, [clearRenderedPages]);

  // Gatilho disparado pelo botão Converter Agora
  const handleConvertTrigger = useCallback(async () => {
    if (!currentFile) return;
    await executeImageToPdf(currentFile);
    setCurrentFile(null);
    setActiveTool(null);
  }, [currentFile, executeImageToPdf]);

  // Gatilho disparado pelo botão Dividir Arquivos: Inicia a renderização assíncrona sob demanda
  const handleSplitSetupTrigger = useCallback(async () => {
    if (!currentFile) return;
    setActiveTool('dividir');
    await renderPdfPages(currentFile);
  }, [currentFile, renderPdfPages]);

  // Motor utilitário client-side para extrair páginas usando pdf-lib na RAM
  const handleProcessDivision = useCallback(async (selectedPageNumbers: number[]) => {
    if (!currentFile) return;
    
    // Captura estática do nome antes de entrar na stack assíncrona para evitar race conditions
    const safeFileName = currentFile.name; 
    setIsSplitting(true);
    setAppError(null);

    let url: string | null = null;

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Copia as páginas selecionadas (índice baseado em 0 na pdf-lib)
      const zeroBasedIndices = selectedPageNumbers.map(num => num - 1);
      const copiedPages = await newPdf.copyPages(sourcePdf, zeroBasedIndices);
      
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      
      // SOLUÇÃO DE COMPILAÇÃO DEFINITIVA: Instanciação limpa compatível com as tipagens de ecossistemas DOM
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const baseName = safeFileName.substring(0, safeFileName.lastIndexOf('.')) || safeFileName;
      link.download = `${baseName}_dividido.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      
      // Limpeza completa de estado após a conclusão do download
      setCurrentFile(null);
      setActiveTool(null);
      clearRenderedPages();
    } catch (err) {
      setAppError('Falha crítica de engenharia ao fatiar as páginas do PDF.');
      console.error(err);
    } finally {
      // Garantia de Liberação de Memória no encerramento (sucesso ou falha)
      if (url) {
        URL.revokeObjectURL(url);
      }
      setIsSplitting(false);
    }
  }, [currentFile, clearRenderedPages]);

  const handleCancelAction = useCallback(() => {
    setCurrentFile(null);
    setAppError(null);
    setActiveTool(null);
    clearRenderedPages();
  }, [clearRenderedPages]);

  // Junção das travas de processamento em uma flag global de carregamento
  const globalProcessing = isConverting || isRendering || isSplitting;
  
  // Só exibe a tela de escolha se o modo ativo for dividir e as miniaturas estiverem carregadas na RAM
  const showSelector = activeTool === 'dividir' && pages.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] relative flex flex-col items-center justify-start py-24 px-4 overflow-y-auto">
      {/* Luzes de fundo (Glow Neon) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00F0FF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9437FF]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Cabeçalho Fixo */}
      <Header />

      {/* Conteúdo Principal Semanticamente Envelopado */}
      <main className="w-full flex flex-col items-center justify-start z-10">
        <h1 className="text-2xl font-black text-white mt-12 mb-6 tracking-wider uppercase text-center">
          {showSelector ? 'Divisor de Páginas' : 'Arrastar e Soltar'}
        </h1>

        {/* Chaveamento Dinâmico Controlado por Estado */}
        {showSelector ? (
          <PdfPageSelector
            pages={pages}
            onProcessDivision={handleProcessDivision}
            onCancel={handleCancelAction}
            isProcessing={isSplitting}
          />
        ) : (
          <DropZone 
            onFileAccepted={handleFileLoaded} 
            currentFile={currentFile} 
            error={appError || converterError || renderError}
            isProcessing={globalProcessing}
          />
        )}

        {/* Grade de Ferramentas fixa na base com escuta de gatilhos */}
        <ToolsGrid 
          currentFile={currentFile} 
          onConvert={handleConvertTrigger}
          onSplit={handleSplitSetupTrigger}
          isProcessing={globalProcessing}
        />
      </main>
    </div>
  );
}

export default App;
