import React from 'react';

export interface PdfEditorStyle {
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

interface TextToolbarProps {
  editorStyle: PdfEditorStyle;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (font: string) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
}

// Configurações estáticas extraídas do escopo do componente para evitar alocação repetida na memória RAM
const FONT_OPTIONS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'TimesRoman', label: 'Times New Roman' },
  { value: 'Courier', label: 'Courier (Mono)' }
];

const SIZE_OPTIONS = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export function TextToolbar({
  editorStyle,
  onFontSizeChange,
  onFontFamilyChange,
  onToggleBold,
  onToggleItalic
}: TextToolbarProps) {
  return (
    <div className="flex items-center space-x-3 bg-[#0B0F19]/80 border border-gray-800 rounded-xl px-3 py-1.5 select-none text-white">
      {/* Seletor de Tipo de Fonte */}
      <div className="flex items-center space-x-1">
        <select
          value={editorStyle.fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          aria-label="Selecionar família da fonte do texto"
          className="bg-[#111827] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-gray-800" />

      {/* Seletor de Tamanho */}
      <div className="flex items-center space-x-1">
        <select
          value={editorStyle.fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          aria-label="Selecionar tamanho da fonte em pixels"
          className="bg-[#111827] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
        >
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-gray-800" />

      {/* Botão Negrito */}
      <button
        type="button"
        onClick={onToggleBold}
        aria-label="Alternar formatação em negrito"
        aria-pressed={editorStyle.isBold}
        className={`p-1 w-7 h-7 rounded-lg text-xs font-bold transition-all border ${
          editorStyle.isBold 
            ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]' 
            : 'bg-[#111827] border-gray-700 hover:border-gray-500'
        }`}
      >
        B
      </button>

      {/* Botão Itálico */}
      <button
        type="button"
        onClick={onToggleItalic}
        aria-label="Alternar formatação em itálico"
        aria-pressed={editorStyle.isItalic}
        className={`p-1 w-7 h-7 rounded-lg text-xs italic transition-all border ${
          editorStyle.isItalic 
            ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]' 
            : 'bg-[#111827] border-gray-700 hover:border-gray-500'
        }`}
      >
        I
      </button>
    </div>
  );
}
