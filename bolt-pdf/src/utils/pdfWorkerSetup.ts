import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker client-side injetando a URL buildada diretamente da dependência instalada
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cloudflare.com{pdfjsLib.version}/pdf.worker.min.js`;

export { pdfjsLib };
