import { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerURL;

interface PdfPageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

export const usePdfRenderer = () => {
  const [pages, setPages] = useState<PdfPageThumbnail[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  const renderInstanceIdRef = useRef<number>(0);

  const renderPdfPages = useCallback(async (file: File) => {
    const currentInstanceId = ++renderInstanceIdRef.current;
    
    setIsRendering(true);
    setRenderError(null);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Validação de concorrência antes de iniciar o processamento pesado de cada página
        if (currentInstanceId !== renderInstanceIdRef.current) break;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.35 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext as any).promise;
          
          if (currentInstanceId !== renderInstanceIdRef.current) {
            // Limpeza explícita se o processo foi cancelado durante o render assíncrono
            canvas.width = 0;
            canvas.height = 0;
            break;
          }

          const dataUrl = canvas.toDataURL('image/png');
          
          // Renderização Progressiva: Alimenta a interface página por página
          setPages((prev) => [...prev, { pageNumber: pageNum, dataUrl }]);

          // Desalocação e desvinculação completa do contexto gráfico contra estouro de RAM/GPU
          context.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    } catch (err) {
      if (currentInstanceId === renderInstanceIdRef.current) {
        setRenderError('Falha ao processar e extrair as páginas do PDF localmente.');
      }
      console.error(err);
    } finally {
      // O bloco finally agora executa com segurança mesmo em cenários de quebra de loop ou cancelamentos
      if (currentInstanceId === renderInstanceIdRef.current) {
        setIsRendering(false);
      }
    }
  }, []);

  const clearRenderedPages = useCallback(() => {
    renderInstanceIdRef.current++;
    setPages([]);
    setRenderError(null);
    setIsRendering(false); // Garante o destravamento completo do estado de loading
  }, []);

  return { pages, isRendering, renderError, renderPdfPages, clearRenderedPages };
};
