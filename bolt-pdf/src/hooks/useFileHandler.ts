import { useState, useCallback } from 'react';

export const useFileHandler = () => {
  const [isDragging, setIsDragging] = useState(false);

  // Intercepta e ativa o estado visual de arrastando
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Desativa o estado visual ao sair da zona de drop
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return { 
    isDragging, 
    handleDragOver, 
    handleDragLeave,
    setIsDragging
  };
};
