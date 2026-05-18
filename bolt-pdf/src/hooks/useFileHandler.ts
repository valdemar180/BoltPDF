import { useState, useCallback, useRef } from 'react';

export const useFileHandler = () => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Utilização de um contador de profundidade para blindar o estado contra oscilações (flickering) em elementos filhos
  const dragCounterRef = useRef<number>(0);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    // Garante a ativação de salvaguarda do estado caso o dragEnter falte
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDropReset = useCallback(() => {
    // Reseta atomicamente o rastreio físico ao consolidar o drop ou cancelar a ação
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  return { 
    isDragging, 
    handleDragEnter,
    handleDragOver, 
    handleDragLeave,
    handleDropReset
  };
};
