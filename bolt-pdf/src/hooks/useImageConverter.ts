import { useState, useCallback } from 'react';
import { convertImageToPdf } from '../utils/conversionEngine';

export const useImageConverter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [converterError, setConverterError] = useState<string | null>(null);

  const executeImageToPdf = useCallback(async (currentFile: File) => {
    // Guarda de concorrência: Impede reentrância se já estiver processando um arquivo
    if (isProcessing) return;

    setIsProcessing(true);
    setConverterError(null);

    let url: string | null = null;

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const pdfBytes = await convertImageToPdf(arrayBuffer, currentFile.type);
      
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      const lastDotIndex = currentFile.name.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 
        ? currentFile.name.substring(0, lastDotIndex) 
        : currentFile.name;
        
      link.download = `${baseName}_bolt.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Captura inteligente da mensagem de erro real para enriquecer a telemetria do sistema
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido.';
      setConverterError(`Falha ao processar a conversão da imagem localmente. Detalhes: ${errorMessage}`);
      console.error('Conversion Failure:', err);
    } finally {
      setIsProcessing(false);
      
      // Correção estrutural: Adiciona um atraso assíncrono controlado (10 segundos) 
      // para dar tempo do navegador concluir o download antes de desalocar a memória RAM
      if (url) {
        const urlToRevoke = url;
        setTimeout(() => {
          URL.revokeObjectURL(urlToRevoke);
        }, 10000);
      }
    }
  }, [isProcessing]);

  // Função encapsulada e exposta de forma segura para permitir o reset externo controlado de erros
  const clearConverterError = useCallback(() => {
    setConverterError(null);
  }, []);

  return {
    isProcessing,
    converterError,
    executeImageToPdf,
    clearConverterError
  };
};
