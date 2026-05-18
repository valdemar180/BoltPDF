// Contrato de estilo do texto
export interface PdfEditorStyle {
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

// Contratos de anotações do Editor Visual do PDF
export interface BaseAnnotation {
  id: string;
  xPercentage: number;
  yPercentage: number;
  pageIndex: number;
  widthPercentage?: number; 
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  base64Png: string;
  rotation?: number; 
}

export type Annotation = TextAnnotation | ImageAnnotation;

// Interface para as miniaturas de divisão de páginas
export interface PdfPageThumbnail {
  pageNumber: number;
  dataUrl: string;
}
