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
      
      const extractedPages: PdfPageThumbnail[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (currentInstanceId !== renderInstanceIdRef.current) return;

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

          // SOLUÇÃO DE COMPILAÇÃO UNIVERSAL: Cast direto na injeção do argumento para ignorar checagem estrita da biblioteca
          await page.render(renderContext as any).promise;
          
          if (currentInstanceId !== renderInstanceIdRef.current) return;

          const dataUrl = canvas.toDataURL('image/png');
          extractedPages.push({ pageNumber: pageNum, dataUrl });

          // Desalocação forçada para prevenção de Memory Leak
          canvas.width = 0;
          canvas.height = 0;
        }
      }

      if (currentInstanceId === renderInstanceIdRef.current) {
        setPages(extractedPages);
      }
    } catch (err) {
      if (currentInstanceId === renderInstanceIdRef.current) {
        setRenderError('Falha ao processar e extrair as páginas do PDF localmente.');
      }
      console.error(err);
    } finally {
      if (currentInstanceId === renderInstanceIdRef.current) {
        setIsRendering(false);
      }
    }
  }, []);

  const clearRenderedPages = useCallback(() => {
    renderInstanceIdRef.current++;
    setPages([]);
    setRenderError(null);
  }, []);

  return { pages, isRendering, renderError, renderPdfPages, clearRenderedPages };
};
