import React, { useRef } from 'react';
import { useFileHandler } from '../hooks/useFileHandler';

export const DropZone: React.FC = () => {
  const { file, isDragging, error, handleDragOver, handleDragLeave, handleDrop, handleFileChange, setFile } = useFileHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileSelect();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Zona de upload de arquivo PDF"
        className={`w-full h-80 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-neonCyan
          ${isDragging 
            ? 'border-neonCyan bg-neonCyan/5 shadow-neon-hover scale-[1.01]' 
            : 'border-gray-700 bg-surface/30 hover:border-gray-500 hover:shadow-neon-cyan'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf" 
          className="hidden" 
          data-testid="file-input"
        />

        {!file ? (
          <>
            <div className="p-4 bg-gray-900/50 rounded-full mb-4 border border-gray-800 flex items-center justify-center">
              <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Arrastar e soltar seu arquivo PDF aqui</h3>
            <p className="text-sm text-gray-500 max-w-xs">ou clique para navegar nos seus arquivos locais</p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-neonCyan/10 rounded-full mb-4 border border-neonCyan/30 shadow-neon-cyan flex items-center justify-center">
              <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-neonCyan">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-md font-medium text-white mb-1 truncate max-w-md">{file.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-4">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
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
