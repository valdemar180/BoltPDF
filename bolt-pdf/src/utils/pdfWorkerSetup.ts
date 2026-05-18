import * as pdfjsLib from 'pdfjs-dist';

// Estratégia estável para o Vite acoplar o worker diretamente nos assets locais
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.mjs?url';

let isWorkerInitialized = false;

/**
 * Inicializa e blinda a configuração do Worker global do PDF.js.
 * Garante que a atribuição ocorra de forma segura antes de qualquer processamento de buffer.
 */
export function initializePdfWorker(): typeof pdfjsLib {
  if (!isWorkerInitialized) {
    if (!pdfWorkerURL) {
      console.error("Mecanismo de QA: URL do Worker do PDF.js está inválida ou inacessível.");
    }
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerURL;
    isWorkerInitialized = true;
  }
  return pdfjsLib;
}

// Exportação seletiva da instância para retrocompatibilidade mantendo o controle de inicialização
export { pdfjsLib };
