import { useState, useCallback } from 'react';

// Constante técnica definindo o limite seguro de 30 Megabytes
const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useFileHandler = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Memorizado com useCallback para evitar re-renderizações e processar validações com segurança
  const validateAndSetFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Por favor, selecione apenas arquivos formato PDF.');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`O arquivo é muito grande. O limite máximo permitido é ${MAX_FILE_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, [validateAndSetFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  }, [validateAndSetFile]);

  return { 
    file, 
    isDragging, 
    error, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop, 
    handleFileChange, 
    setFile 
  };
};
