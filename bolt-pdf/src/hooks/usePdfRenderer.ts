import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Estratégia nativa e limpa para o Vite 8 injetar o worker local sem CDNs ou erros de CORS
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

  const renderPdfPages = useCallback(async (file: File) => {
    setIsRendering(true);
    setRenderError(null);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Passamos apenas a propriedade 'data' que é validada pelo TypeScript
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const extractedPages: PdfPageThumbnail[] = [];

      // Loop de extração síncrono e ultra-veloz
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.35 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Coerção limpa de tipo (as any) para evitar restrições do CanvasRenderingContext2D
          await page.render({ canvasContext: context as any, viewport } as any).promise;
          
          const dataUrl = canvas.toDataURL('image/png');
          extractedPages.push({ pageNumber: pageNum, dataUrl });
        }
      }

      setPages(extractedPages);
    } catch (err) {
      setRenderError('Falha ao processar e extrair as páginas do PDF localmente.');
      console.error(err);
    } finally {
      setIsRendering(false);
    }
  }, []);

  const clearRenderedPages = useCallback(() => {
    setPages([]);
    setRenderError(null);
  }, []);

  return { pages, isRendering, renderError, renderPdfPages, clearRenderedPages };
};
