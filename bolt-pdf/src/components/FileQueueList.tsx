import React from 'react';

interface FileQueueListProps {
  mergeFiles: File[];
  onRemoveFile: (index: number) => void;
  onClearQueue: () => void;
}

export function FileQueueList({ mergeFiles, onRemoveFile, onClearQueue }: FileQueueListProps) {
  if (mergeFiles.length === 0) return null;

  return (
    <div className="w-full max-w-xl mt-4 p-4 bg-[#111827]/40 border border-gray-800 rounded-2xl backdrop-blur-sm animate-fade-in">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
        <h4 className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
          Arquivos na Fila de Mesclagem ({mergeFiles.length})
        </h4>
        <button
          onClick={onClearQueue}
          className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer font-medium"
        >
          Limpar Fila
        </button>
      </div>

      <ul className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
        {mergeFiles.map((file, index) => (
          <li
            key={`${file.name}-${index}`}
            className="flex items-center justify-between p-2.5 bg-[#0B0F19]/60 rounded-xl border border-gray-800/60 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {/* Ícone de PDF simplificado */}
              <span className="text-xs font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                PDF
              </span>
              <span className="text-xs text-gray-300 truncate font-medium">
                {file.name}
              </span>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              onClick={() => onRemoveFile(index)}
              className="text-gray-500 hover:text-red-400 p-1 transition-colors rounded-lg hover:bg-red-500/5 cursor-pointer"
              title="Remover arquivo"
            >
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
