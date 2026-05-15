import { useState, useCallback } from 'react';

// O tipo foi simplificado localmente para uso interno exclusivo do estado deste hook
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

  return {
    editorStyle,
    updateFontSize,
    updateFontFamily,
    toggleBold,
    toggleItalic
  };
}
