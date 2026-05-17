import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { usePdfEditorStyle } from '../hooks/usePdfEditorStyle';
import { TextToolbar } from './TextToolbar';
import { SignatureModal } from './SignatureModal'; 

interface BaseAnnotation {
  id: string;
  xPercentage: number;
  yPercentage: number;
  pageIndex: number;
  widthPercentage?: number; 
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  base64Png: string;
  rotation?: number; 
}

type Annotation = TextAnnotation | ImageAnnotation;

interface PdfEditorManagerProps {
  currentFile: File;
  pages: string[];
  onCancel: () => void;
  onError: (msg: string) => void;
}

export function PdfEditorManager({ currentFile, pages, onCancel, onError }: PdfEditorManagerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationIdx, setActiveAnnotationIdx] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const { editorStyle } = usePdfEditorStyle();

  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartPercent = useRef({ x: 0, y: 0 });
  const rotationStartAngle = useRef<number>(0);
  const rotationInitialBaseAngle = useRef<number>(0);

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

  const handleAddTextClick = () => {
    const newAnnotation: TextAnnotation = {
      id: `text_${Date.now()}`,
      type: 'text',
      text: '',
      xPercentage: 35,
      yPercentage: 20,
      pageIndex: 0,
      fontSize: editorStyle.fontSize,
      fontFamily: editorStyle.fontFamily,
      isBold: editorStyle.isBold,
      isItalic: editorStyle.isItalic
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setActiveAnnotationIdx(annotations.length);
  };

  const handleSignatureExtracted = (base64Png: string) => {
    const newSignature: ImageAnnotation = {
      id: `img_${Date.now()}`,
      type: 'image',
      base64Png,
      xPercentage: 40,
      yPercentage: 45,
      pageIndex: 0,
      widthPercentage: 20, 
      rotation: 0         
    };

    setAnnotations((prev) => [...prev, newSignature]);
    setActiveAnnotationIdx(annotations.length);
  };

  const handleDragStart = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setIsDragging(true);
    setActiveIdx(idx);
    setActiveAnnotationIdx(idx);
    
    const container = containerRefs.current[annotations[idx].pageIndex];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = zoomScale / 100;

    dragStartPos.current = { 
      x: (e.clientX - rect.left) / currentScale, 
      y: (e.clientY - rect.top) / currentScale 
    };
    dragStartPercent.current = { 
      x: annotations[idx].xPercentage, 
      y: annotations[idx].yPercentage 
    };
  };

  const handleRotationStart = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    setActiveIdx(idx);
    setActiveAnnotationIdx(idx);

    const container = containerRefs.current[annotations[idx].pageIndex];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScale = zoomScale / 100;

    const ann = annotations[idx];
    const actualWidth = rect.width / currentScale;
    const actualHeight = rect.height / currentScale;
    
    const centerX = (ann.xPercentage / 100) * actualWidth;
    const centerY = (ann.yPercentage / 100) * actualHeight;

    const mouseX = (e.clientX - rect.left) / currentScale;
    const mouseY = (e.clientY - rect.top) / currentScale;

    rotationStartAngle.current = Math.atan2(mouseY - centerY, mouseX - centerX);
    rotationInitialBaseAngle.current = ann.type === 'image' ? (ann.rotation || 0) : 0;
  };

  const handlePageMove = (e: React.MouseEvent, pageIndex: number) => {
    if (activeIdx === null || annotations[activeIdx].pageIndex !== pageIndex) return;

    const container = containerRefs.current[pageIndex];
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentScale = zoomScale / 100;

    const actualWidth = rect.width / currentScale;
    const actualHeight = rect.height / currentScale;

    if (isDragging) {
      const relativeX = (e.clientX - rect.left) / currentScale;
      const relativeY = (e.clientY - rect.top) / currentScale;

      const deltaX = relativeX - dragStartPos.current.x;
      const deltaY = relativeY - dragStartPos.current.y;

      const deltaXPercent = (deltaX / actualWidth) * 100;
      const deltaYPercent = (deltaY / actualHeight) * 100;

      const newX = Math.max(0, Math.min(100, dragStartPercent.current.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100, dragStartPercent.current.y + deltaYPercent));

      setAnnotations((prev) => prev.map((item, i) => i === activeIdx ? { ...item, xPercentage: newX, yPercentage: newY } : item));
    } 
    else if (isRotating) {
      const ann = annotations[activeIdx];
      const centerX = (ann.xPercentage / 100) * actualWidth;
      const centerY = (ann.yPercentage / 100) * actualHeight;

      const mouseX = (e.clientX - rect.left) / currentScale;
      const mouseY = (e.clientY - rect.top) / currentScale;

      const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
      
      const angleDiff = ((currentAngle - rotationStartAngle.current) * 180) / Math.PI;
      let finalAngle = Math.round(rotationInitialBaseAngle.current + angleDiff);

      if (finalAngle > 180) finalAngle -= 360;
      if (finalAngle < -180) finalAngle += 360;

      setAnnotations((prev) => prev.map((item, i) => i === activeIdx && item.type === 'image' ? { ...item, rotation: finalAngle } : item));
    }
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
    setIsRotating(false);
    setActiveIdx(null);
  };

  const updateAnnotationText = (idx: number, text: string) => {
    setAnnotations((prev) => prev.map((item, i) => i === idx && item.type === 'text' ? { ...item, text } : item));
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
        const page = pdfPages[ann.pageIndex];
        if (!page) continue;

        const { width, height } = page.getSize();
        const targetXRaw = (ann.xPercentage / 100) * width;
        
        if (ann.type === 'text') {
          if (ann.text.trim() === '') continue;
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
            x: targetXRaw,
            y: targetY,
            size: ann.fontSize,
            font: embeddedFont,
            color: rgb(0, 0, 0),
          });
        } 
        else if (ann.type === 'image') {
          const embeddedImage = await pdfDoc.embedPng(ann.base64Png);
          
          const imgWidth = ((ann.widthPercentage || 20) / 100) * width;
          const imgHeight = (imgWidth / embeddedImage.width) * embeddedImage.height;
          
          let targetX = targetXRaw;
          
          // COMPENSAÇÃO DEFINITIVA DO PIXEL HUNTING: 
          // Ajustado multiplicando e somando uma fração controlada da altura (+ 14 pixels brutos)
          // Isso anula a folga visual invisível que o CSS injetava e puxa a assinatura para cima da linha pontilhada.
          let targetY = height - ((ann.yPercentage / 100) * height) - imgHeight + 18;

          const rotDegrees = ann.rotation ? -ann.rotation : 0;
          const rad = (rotDegrees * Math.PI) / 180;

          if (rotDegrees !== 0) {
            const cx = targetX + imgWidth / 2;
            const cy = targetY + imgHeight / 2;

            targetX = cx - (imgWidth / 2) * Math.cos(rad) + (imgHeight / 2) * Math.sin(rad);
            targetY = cy - (imgWidth / 2) * Math.sin(rad) - (imgHeight / 2) * Math.cos(rad);
          }

          page.drawImage(embeddedImage, {
            x: targetX,
            y: targetY,
            width: imgWidth,
            height: imgHeight,
            rotate: degrees(rotDegrees) 
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || currentFile.name;
      link.download = `${baseName}_assinado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onCancel();
    } catch (err) {
      console.error(err);
      onError('Falha técnica ao embutir elementos visuais e assinaturas no PDF.');
    } finally {
      setIsSaving(false);
      if (url) URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full max-w-7xl bg-[#111827]/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center animate-fade-in">
      {/* Barra de Ações Superior */}
      <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full lg:w-auto">
          <div>
            <h2 className="text-lg font-bold text-white">Preenchimento e Assinatura de Formulário</h2>
            <div className="flex gap-3 mt-3">
              <button 
                onClick={handleAddTextClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                + Adicionar Texto
              </button>
              <button 
                onClick={() => setIsSignatureModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
              >
                ✍️ Importar Assinatura Física
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1f2937]/50 border border-gray-700 px-4 py-2 rounded-xl mt-2 sm:mt-8">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">🔍 Zoom: {zoomScale}%</span>
            <input 
              type="range" min="50" max="175" step="5" value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              className="w-28 h-1 accent-cyan-400 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <button
          onClick={handleSaveEdition}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-sm shadow-lg hover:brightness-110 transition disabled:opacity-50 lg:mt-8"
        >
          {isSaving ? 'Salvando Documento...' : 'Salvar e Baixar PDF'}
        </button>
      </div>

      {/* Área de Visualização */}
      <div className="w-full flex flex-col gap-8 items-center overflow-auto max-h-[70vh] p-8 bg-[#0f172a]/30 border border-gray-800/60 rounded-xl">
        {pages.map((_, idx) => (
          <div
            key={idx}
            ref={(el) => { containerRefs.current[idx] = el; }}
            onMouseMove={(e) => handlePageMove(e, idx)}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            className="relative border border-gray-700 shadow-2xl bg-white select-none max-w-full"
            style={{ 
              transform: `scale(${zoomScale / 100})`,
              marginBottom: zoomScale > 100 ? `${(zoomScale - 100) * 6.5}px` : '0px', 
              width: '100%',
              maxWidth: '800px'
            }}
          >
            <canvas ref={(el) => { canvasRefs.current[idx] = el; }} className="w-full h-auto block" />

            {annotations
              .map((ann, originalIdx) => ({ ann, originalIdx }))
              .filter(({ ann }) => ann.pageIndex === idx)
              .map(({ ann, originalIdx }) => {
                const isSelected = activeAnnotationIdx === originalIdx;
                
                return (
                  <div
                    key={ann.id}
                    onMouseDown={(e) => handleDragStart(e, originalIdx)}
                    className={`absolute cursor-move rounded flex flex-col items-center group transition-shadow ${
                      isSelected 
                        ? 'border-2 border-dashed border-cyan-400 bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.25)]' 
                        : 'border border-transparent hover:border-gray-400'
                    }`}
                    style={{
                      left: `${ann.xPercentage}%`,
                      top: `${ann.yPercentage}%`,
                      transform: 'translate(-5px, -5px)',
                      padding: '0px', 
                      zIndex: isSelected ? 50 : 10,
                    }}
                  >
                    {/* Alça de Rotação */}
                    {ann.type === 'image' && isSelected && (
                      <div className="absolute -top-10 flex flex-col items-center justify-center w-full pointer-events-none animate-fade-in">
                        <div 
                          onMouseDown={(e) => handleRotationStart(e, originalIdx)}
                          className="w-5 h-5 bg-cyan-500 border-2 border-white rounded-full cursor-alias pointer-events-auto flex items-center justify-center shadow-lg hover:scale-110 active:bg-cyan-600 transition"
                        >
                          <span className="text-[9px] text-white font-bold select-none">↻</span>
                        </div>
                        <div className="w-[2px] h-4 bg-cyan-400" />
                      </div>
                    )}

                    {ann.type === 'text' ? (
                      <input
                        type="text"
                        value={ann.text}
                        placeholder="Digite aqui..."
                        onChange={(e) => updateAnnotationText(originalIdx, e.target.value)}
                        className="bg-transparent border-none outline-none text-black placeholder-gray-400 text-sm min-w-[120px] p-1"
                        style={{
                          fontFamily: ann.fontFamily,
                          fontSize: `${ann.fontSize}px`,
                          fontWeight: ann.isBold ? 'bold' : 'normal',
                          fontStyle: ann.isItalic ? 'italic' : 'normal',
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center relative select-none">
                        <img 
                          src={ann.base64Png} 
                          alt="Assinatura" 
                          style={{ 
                            width: ann.widthPercentage ? `${ann.widthPercentage * 7}px` : '150px', 
                            height: 'auto', 
                            display: 'block',
                            transform: `rotate(${ann.rotation || 0}deg)`,
                            transition: isRotating ? 'none' : 'transform 0.05s linear',
                            transformOrigin: 'center center'
                          }}
                          draggable={false}
                        />

                        {/* Slider de Tamanho */}
                        {isSelected && !isRotating && (
                          <div 
                            className="absolute -bottom-10 bg-gray-950/95 border border-gray-800 px-2 py-1 rounded-md shadow-xl flex items-center gap-1.5 z-50 text-white select-none animate-fade-in"
                            onMouseDown={(e) => e.stopPropagation()} 
                          >
                            <span className="text-[9px] text-gray-400 font-mono">📐 Tamanho</span>
                            <input 
                              type="range" min="10" max="60" step="1" value={ann.widthPercentage || 20}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAnnotations(prev => prev.map((item, i) => i === originalIdx ? { ...item, widthPercentage: val } : item));
                              }}
                              className="w-16 h-1 accent-emerald-400 bg-gray-800 rounded appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botão de remoção rápida */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAnnotation(originalIdx); }}
                      className="absolute -top-3 -right-3 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureExtracted={handleSignatureExtracted}
      />
    </div>
  );
}
