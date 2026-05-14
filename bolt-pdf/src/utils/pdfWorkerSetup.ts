import * as pdfjsLib from 'pdfjs-dist';

// Estratégia nativa estável para o Vite acoplar o worker diretamente nos assets locais (100% offline)
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerURL;

export { pdfjsLib };
