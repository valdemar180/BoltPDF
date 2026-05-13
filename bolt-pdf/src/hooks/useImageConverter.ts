import { useState, useCallback } from 'react';
import { convertImageToPdf } from '../utils/conversionEngine';

const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useImageConverter = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isConverterDragging, setIsConverterDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [converterError, setConverterError] = useState<string | null>(null);

  const handleConverterDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsConverterDragging(true);
  }, []);

  const handleConverterDragLeave = useCallback(() => {
    setIsConverterDragging(false);
  }, []);

  const validateAndSetImage = useCallback((selectedFile: File) => {
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    
    if (!allowedImageTypes.includes(selectedFile.type)) {
      setConverterError('Por favor, selecione apenas imagens no formato PNG ou JPG/JPEG.');
      setImageFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setConverterError(`A imagem é muito grande. O limite máximo permitido é ${MAX_FILE_SIZE_MB} MB.`);
      setImageFile(null);
      return;
    }

    setConverterError(null);
    setImageFile(selectedFile);
  }, []);

  const handleConverterDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsConverterDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  }, [validateAndSetImage]);

  const handleConverterFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetImage(e.target.files[0]);
    }
  }, [validateAndSetImage]);

  const executeImageToPdf = useCallback(async (currentFile: File) => {
    setIsProcessing(true);
    setConverterError(null);

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const pdfBytes = await convertImageToPdf(arrayBuffer, currentFile.type);
      
      // Ajuste de tipagem estrito para compatibilidade global no TypeScript 6
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
      link.download = `${baseName}_bolt.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImageFile(null); 
    } catch (err) {
      setConverterError('Falha ao processar a conversão da imagem localmente.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    imageFile,
    isConverterDragging,
    isProcessing,
    converterError,
    handleConverterDragOver,
    handleConverterDragLeave,
    handleConverterDrop,
    handleConverterFileChange,
    executeImageToPdf,
    setImageFile
  };
};
