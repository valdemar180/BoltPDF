import { useState, useCallback } from 'react';
import { convertImageToPdf } from '../utils/conversionEngine';

export const useImageConverter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [converterError, setConverterError] = useState<string | null>(null);

  const executeImageToPdf = useCallback(async (currentFile: File) => {
    setIsProcessing(true);
    setConverterError(null);

    let url: string | null = null;

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const pdfBytes = await convertImageToPdf(arrayBuffer, currentFile.type);
      
      // Correção de tipagem definitiva e segura livre de casts mágicos
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
      link.download = `${baseName}_bolt.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
    } catch (err) {
      setConverterError('Falha ao processar a conversão da imagem localmente.');
      console.error(err);
    } finally {
      // Bloco finally garante a liberação imediata de RAM independente de sucessos ou exceções
      if (url) {
        URL.revokeObjectURL(url);
      }
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    converterError,
    executeImageToPdf,
    setConverterError
  };
};
