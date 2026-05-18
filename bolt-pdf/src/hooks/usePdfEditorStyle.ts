import { useState, useCallback } from 'react';

// Contrato de tipo local mantido para evitar dependências circulares com componentes
interface LocalEditorStyle {
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

export function usePdfEditorStyle() {
  const [editorStyle, setEditorStyle] = useState<LocalEditorStyle>({
    fontSize: 14,
    fontFamily: 'Helvetica',
    isBold: false,
    isItalic: false
  });

  const updateFontSize = useCallback((fontSize: number) => {
    setEditorStyle((prev) => ({ ...prev, fontSize }));
  }, []);

  const updateFontFamily = useCallback((fontFamily: string) => {
    setEditorStyle((prev) => ({ ...prev, fontFamily }));
  }, []);

  const toggleBold = useCallback(() => {
    setEditorStyle((prev) => ({ ...prev, isBold: !prev.isBold }));
  }, []);

  const toggleItalic = useCallback(() => {
    setEditorStyle((prev) => ({ ...prev, isItalic: !prev.isItalic }));
  }, []);

  // Otimização: Permite atualizar várias propriedades de estilo de uma só vez de forma atômica
  const updatePartialStyle = useCallback((partial: Partial<LocalEditorStyle>) => {
    setEditorStyle((prev) => ({ ...prev, ...partial }));
  }, []);

  return {
    editorStyle,
    updateFontSize,
    updateFontFamily,
    toggleBold,
    toggleItalic,
    updatePartialStyle
  };
}
