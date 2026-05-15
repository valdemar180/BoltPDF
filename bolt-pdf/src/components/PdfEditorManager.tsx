import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { usePdfEditorStyle } from '../hooks/usePdfEditorStyle';
import { TextToolbar } from './TextToolbar';

interface TextAnnotation {
  text: string;
  xPercentage: number; 
  yPercentage: number;
  pageIndex: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

interface PdfEditorManagerProps {
  currentFile: File;
  pages: string[]; 
  onCancel: () => void;
  onError: (msg: string) => void;
}

export function PdfEditorManager({ currentFile, pages, onCancel, onError }: PdfEditorManagerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [activeAnnotationIdx, setActiveAnnotationIdx] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);

  const { editorStyle, updateFontSize, updateFontFamily, toggleBold, toggleItalic } = usePdfEditorStyle();

  const [isDragging, setIsDragging] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartPercent = useRef({ x: 0, y: 0 });

  const containerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    if (!currentFile) return;

    const renderSharpPages = async () => {
      try {
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'] || (window as any).pdfjsLib;
        if (!pdfjsLib) return;

        const arrayBuffer = await currentFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        for (let idx = 0; idx < pdf.numPages; idx++) {
          const page = await pdf.getPage(idx + 1);
          const canvas = canvasRefs.current[idx];
          if (!canvas) continue;

          const context = canvas.getContext('2d');
          if (!context) continue;

          const baseScale = 1.5;
          const currentScale = baseScale * (zoomScale / 100);
          const viewport = page.getViewport({ scale: currentScale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = { canvasContext: context, viewport: viewport };
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.warn("Utilizando renderização alternativa por fallback de memória.");
      }
    };

    renderSharpPages();
  }, [currentFile, zoomScale]);

  // FUNÇÃO DO NOVO BOTÃO: Cria o texto centralizado na página ativa
  const handleAddTextClick = () => {
    const newAnnotation: TextAnnotation = {
      text: '',
      xPercentage: 35, // Posiciona centralizado horizontalmente no início
      yPercentage: 20, // Posiciona um pouco abaixo do topo
      pageIndex: 0,    // Adiciona na primeira página padrão
      fontSize: editorStyle.fontSize,
      fontFamily: editorStyle.fontFamily,
      isBold: editorStyle.isBold,
      isItalic: editorStyle.isItalic
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setActiveAnnotationIdx(annotations.length); 
  };

  const handleDragStart = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedIdx(idx);
    setActiveAnnotationIdx(idx);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartPercent.current = { x: annotations[idx].xPercentage, y: annotations[idx].yPercentage };
  };

  const handlePageMove = (e: React.MouseEvent, pageIndex: number) => {
    if (!isDragging || draggedIdx === null || annotations[draggedIdx].pageIndex !== pageIndex) return;

    const container = containerRefs.current[pageIndex];
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, dragStartPercent.current.x + deltaXPercent));
    const newY = Math.max(0, Math.min(100, dragStartPercent.current.y + deltaYPercent));

    setAnnotations((prev) => prev.map((item, i) => i === draggedIdx ? { ...item, xPercentage: newX, yPercentage: newY } : item));
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      setIsDragging(false);
      setDraggedIdx(null);
    }, 50);
  };

  const updateAnnotationText = (idx: number, text: string) => {
    setAnnotations((prev) => prev.map((item, i) => i === idx ? { ...item, text } : item));
  };

  const removeAnnotation = (idx: number) => {
    setAnnotations((prev) => prev.filter((_, i) => i !== idx));
    if (activeAnnotationIdx === idx) {
      setActiveAnnotationIdx(null);
    }
  };

  const handleSaveEdition = async () => {
    if (!currentFile) return;
    setIsSaving(true);

    let url: string | null = null;
    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pdfPages = pdfDoc.getPages();

      for (const ann of annotations) {
        if (ann.text.trim() === '') continue;

        const page = pdfPages[ann.pageIndex];
        if (!page) continue;

        const { width, height } = page.getSize();
        const targetX = (ann.xPercentage / 100) * width;
        const targetY = height - ((ann.yPercentage / 100) * height) - (ann.fontSize / 1.5); 

        let fontName = StandardFonts.Helvetica;
        if (ann.fontFamily === 'Helvetica') {
          if (ann.isBold && ann.isItalic) fontName = StandardFonts.HelveticaBoldOblique;
          else if (ann.isBold) fontName = StandardFonts.HelveticaBold;
          else if (ann.isItalic) fontName = StandardFonts.HelveticaOblique;
        } else if (ann.fontFamily === 'TimesRoman') {
          if (ann.isBold && ann.isItalic) fontName = StandardFonts.TimesRomanBoldItalic;
          else if (ann.isBold) fontName = StandardFonts.TimesRomanBold;
          else if (ann.isItalic) fontName = StandardFonts.TimesRomanItalic;
          else fontName = StandardFonts.TimesRoman;
        } else if (ann.fontFamily === 'Courier') {
          if (ann.isBold && ann.isItalic) fontName = StandardFonts.CourierBoldOblique;
          else if (ann.isBold) fontName = StandardFonts.CourierBold;
          else if (ann.isItalic) fontName = StandardFonts.CourierOblique;
        }

        const embeddedFont = await pdfDoc.embedFont(fontName);

        page.drawText(ann.text, {
          x: targetX,
          y: targetY,
          size: ann.fontSize, 
          font: embeddedFont,
          color: rgb(0, 0, 0), 
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
      link.download = `${baseName}_preenchido.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onCancel();
    } catch (err) {
      console.error(err);
      onError('Falha técnica ao exportar o documento preenchido com estilos.');
    } finally {
      setIsSaving(false);
      if (url) URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full max-w-7xl bg-[#111827]/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center animate-fade-in">
      {/* Barra de Ações Superior */}
      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Preenchimento de Formulário</h2>
          <p className="text-xs text-[#00F0FF] font-medium">💡 Clique em "+ Adicionar Texto" na lateral para colocar novas palavras no PDF.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-center lg:self-auto">
          <TextToolbar 
            editorStyle={editorStyle}
            onFontSizeChange={updateFontSize}
            onFontFamilyChange={updateFontFamily}
            onToggleBold={toggleBold}
            onToggleItalic={toggleItalic}
          />

          {/* Controles de Zoom */}
          <div className="flex items-center space-x-2 bg-[#0B0F19]/80 border border-gray-800 rounded-xl px-3 py-1.5 select-none text-white">
            <button 
              type="button"
              onClick={() => setZoomScale(prev => Math.max(60, prev - 20))}
              className="text-gray-400 hover:text-white font-bold text-sm px-2 cursor-pointer transition-colors"
            >
              ➖
            </button>
            <span className="text-xs font-mono text-gray-300 w-12 text-center">
              {zoomScale}%
            </span>
            <button 
              type="button"
              onClick={() => setZoomScale(prev => Math.min(200, prev + 20))}
              className="text-gray-400 hover:text-white font-bold text-sm px-2 cursor-pointer transition-colors"
            >
              ➕
            </button>
          </div>
        </div>

        <div className="flex space-x-3 self-end lg:self-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveEdition}
            disabled={isSaving || annotations.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#9437FF] text-[#0B0F19] rounded-xl font-bold transition-opacity hover:opacity-90 disabled:opacity-40 text-xs cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            {isSaving ? 'Processando...' : 'Concluir e Baixar'}
          </button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Painel Lateral */}
        <div className="bg-[#0B0F19]/60 border border-gray-800 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto flex flex-col gap-4">
          {/* NOVO BOTÃO DE INSERÇÃO CONTROLADA */}
          <button
            type="button"
            onClick={handleAddTextClick}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00F0FF]/20 to-[#9437FF]/20 border border-[#00F0FF]/40 text-white rounded-xl font-bold hover:from-[#00F0FF]/30 hover:to-[#9437FF]/30 transition-all text-xs cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.1)] text-center"
          >
            ➕ Adicionar Texto
          </button>

          <div className="h-px bg-gray-800 w-full" />

          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campos Preenchidos</h3>
          {annotations.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nenhum campo inserido. Use o botão acima.</p>
          ) : (
            <div className="space-y-2">
              {annotations.map((ann, i) => (
                <div key={i} className={`p-2 rounded-lg border text-xs flex items-center justify-between ${activeAnnotationIdx === i ? 'border-[#00F0FF] bg-[#00F0FF]/5' : 'border-gray-800 bg-[#0B0F19]'}`}>
                  <span className="text-gray-300 truncate max-w-[140px]" style={{ fontFamily: ann.fontFamily === 'TimesRoman' ? 'Times New Roman' : ann.fontFamily === 'Courier' ? 'Courier New' : 'Helvetica', fontWeight: ann.isBold ? 'bold' : 'normal', fontStyle: ann.isItalic ? 'italic' : 'normal' }}>
                    {ann.text || <span className="text-gray-600 italic">Digitando...</span>}
                  </span>
                  <button type="button" onClick={() => removeAnnotation(i)} className="text-red-400 hover:text-red-300 ml-2 font-bold">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace de Visualização */}
        <div className="lg:col-span-3 bg-[#090D16] border border-gray-800 rounded-xl p-6 min-h-[550px] max-h-[750px] overflow-auto flex flex-col items-center gap-6 custom-scrollbar shadow-inner">
          {pages.map((pageSrc, idx) => (
            <div 
              key={idx} 
              ref={el => { containerRefs.current[idx] = el; }} 
              onMouseMove={(e) => handlePageMove(e, idx)}
              onMouseLeave={handleDragEnd}
              onMouseUp={handleDragEnd}
              className="relative bg-white shadow-2xl rounded border border-gray-300 select-none transition-all duration-200"
              style={{ width: `${(650 * zoomScale) / 100}px` }}
            >
              <span className="absolute top-3 left-3 bg-[#0B0F19]/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-20">
                Página {idx + 1}
              </span>

              <canvas 
                ref={el => { canvasRefs.current[idx] = el; }}
                className="w-full h-auto rounded block"
              />

              {/* Mapeamento de Textos Dinâmicos */}
              {annotations.filter(ann => ann.pageIndex === idx).map((ann, globalIdx) => {
                const actualIndex = annotations.findIndex(item => item === ann);
                const isFocused = activeAnnotationIdx === actualIndex;

                return (
                  <div
                    key={globalIdx}
                    className={`absolute z-30 flex items-center rounded pl-1 pr-1 py-0.5 transition-all duration-150
                      ${isFocused ? 'bg-blue-50/90 border border-blue-400 shadow-md' : 'bg-transparent border border-transparent'}`}
                    style={{ 
                      left: `${ann.xPercentage}%`, 
                      top: `${ann.yPercentage}%`,
                      transform: 'translateY(-50%)' 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnnotationIdx(actualIndex); 
                    }} 
                  >
                    {isFocused && (
                      <div
                        onMouseDown={(e) => handleDragStart(e, actualIndex)}
                        className="cursor-grab active:cursor-grabbing text-xs mr-1 opacity-60 hover:opacity-100 select-none"
                        title="Clique e arraste para mover"
                      >
                        🖐️
                      </div>
                    )}

                    <input
                      type="text"
                      value={ann.text}
                      autoFocus={isFocused}
                      onChange={(e) => updateAnnotationText(actualIndex, e.target.value)}
                      onBlur={() => {
                        if (!isDragging) {
                          setActiveAnnotationIdx(null);
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      placeholder={isFocused ? "Digitar..." : ""}
                      className={`bg-transparent border-none text-black focus:outline-none min-w-[100px]
                        ${!isFocused && ann.text.trim() === '' ? 'hidden' : 'block'}`}
                      style={{
                        fontSize: `${(ann.fontSize * zoomScale) / 100}px`,
                        fontFamily: ann.fontFamily === 'TimesRoman' ? 'Times New Roman' : ann.fontFamily === 'Courier' ? 'Courier New' : 'Helvetica',
                        fontWeight: ann.isBold ? 'bold' : 'normal',
                        fontStyle: ann.isItalic ? 'italic' : 'normal'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
