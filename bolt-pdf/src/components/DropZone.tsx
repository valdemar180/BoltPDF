import React, { useRef } from 'react';
import { useFileHandler } from '../hooks/useFileHandler';

interface DropZoneProps {
  onFileAccepted: (file: File | null) => void; // Tipagem segura corrigida
  currentFile: File | null;
  error: string | null;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileAccepted,
  currentFile,
  error,
  isProcessing
}) => {
  const { isDragging, handleDragOver, handleDragLeave } = useFileHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileSelect();
    }
  };

  const processFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFileAccepted(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleDragLeave();
    if (isProcessing) return;
    processFiles(e.dataTransfer.files);
  };

  const handleDragOverInterception = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Garante o comportamento nativo de drop ativo
    handleDragOver(e);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div
        onDragOver={handleDragOverInterception}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-disabled={isProcessing}
        aria-label="Zona de upload de arquivos para processamento"
        className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-neonCyan
          ${isProcessing ? 'cursor-not-allowed opacity-80' : ''}
          ${isDragging 
            ? 'border-neonCyan bg-neonCyan/5 shadow-neon-hover scale-[1.01]' 
            : 'border-gray-700 bg-surface/30 hover:border-gray-500 hover:shadow-neon-cyan'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => processFiles(e.target.files)} 
          accept=".pdf, image/png, image/jpeg, image/jpg" 
          className="hidden" 
          data-testid="file-input"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-neonCyan border-t-transparent rounded-full animate-spin mb-4 shadow-neon-cyan" />
            <h3 className="text-md font-semibold text-neonCyan tracking-wide animate-pulse">PROCESSANDO CONVERSÃO...</h3>
            <p className="text-xs text-gray-500 mt-1">Gerando seu arquivo PDF puramente no navegador</p>
          </div>
        ) : !currentFile ? (
          <>
            <div className="p-4 bg-gray-900/50 rounded-full mb-4 border border-gray-800 flex items-center justify-center">
              <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Arrastar e soltar seu arquivo PDF ou imagem aqui</h3>
            <p className="text-sm text-gray-500 max-w-xs">ou clique para navegar nos seus arquivos locais (PNG, JPG, PDF)</p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-neonCyan/10 rounded-full mb-4 border border-neonCyan/30 shadow-neon-cyan flex items-center justify-center">
              <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-neonCyan">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-md font-medium text-white mb-1 truncate max-w-md">{currentFile.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-4">{(currentFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileAccepted(null); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors underline focus:outline-none"
            >
              Remover arquivo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-center" role="alert">
          <span className="text-sm text-red-400 font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};
