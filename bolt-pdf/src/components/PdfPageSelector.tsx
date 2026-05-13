import React, { useState } from 'react';

interface PdfPageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

interface PdfPageSelectorProps {
  pages: PdfPageThumbnail[];
  onProcessDivision: (selectedPages: number[]) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({
  pages,
  onProcessDivision,
  onCancel,
  isProcessing
}) => {
  // Estado local para rastrear quais números de páginas estão marcados
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Alterna a seleção da página ao clicar no card ou no checkbox
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev =>
      prev.includes(pageNumber)
        ? prev.filter(num => num !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]); // Desmarca tudo
    } else {
      setSelectedPages(pages.map(p => p.pageNumber)); // Marca tudo
    }
  };

  const handleSubmit = () => {
    if (selectedPages.length === 0) return;
    onProcessDivision(selectedPages);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 animate-fadeIn">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#151D30] border border-gray-800 p-4 rounded-xl mb-6 shadow-lg">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-white tracking-wide">Selecione as páginas para divisão</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {selectedPages.length} de {pages.length} páginas selecionadas
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSelectAll}
            className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-surface/20 transition-all duration-200 cursor-pointer"
          >
            {selectedPages.length === pages.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all duration-200 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Grade de Páginas Renderizadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-[500px] overflow-y-auto p-2 bg-background/50 border border-gray-900 rounded-2xl mb-8">
        {pages.map((page) => {
          const isChecked = selectedPages.includes(page.pageNumber);
          return (
            <div
              key={page.pageNumber}
              onClick={() => togglePageSelection(page.pageNumber)}
              className={`relative bg-[#151D30]/60 border rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all duration-300 group
                ${isChecked 
                  ? 'border-neonCyan bg-[#151D30] shadow-[0_0_15px_rgba(0,240,255,0.15)] scale-[1.02]' 
                  : 'border-gray-800 hover:border-gray-600'}`}
            >
              {/* Checkbox customizado Cyberpunk */}
              <div className="absolute top-2 right-2 z-20">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                  ${isChecked 
                    ? 'bg-neonCyan border-neonCyan text-[#0B0F19]' 
                    : 'border-gray-600 bg-[#0B0F19] group-hover:border-gray-400'}`}
                >
                  {isChecked && (
                    <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Imagem da Miniatura gerada pelo Canvas */}
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-gray-900 bg-[#0B0F19] flex items-center justify-center relative mb-3">
                <img
                  src={page.dataUrl}
                  alt={`Página ${page.pageNumber}`}
                  className="w-full h-full object-contain select-none"
                  loading="lazy"
                />
              </div>

              {/* Tag com o número da página */}
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded
                ${isChecked ? 'bg-neonCyan/10 text-neonCyan' : 'bg-gray-900 text-gray-400'}`}
              >
                Pág. {page.pageNumber}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botão de Execução Final */}
      <div className="w-full flex justify-center pb-12">
        <button
          onClick={handleSubmit}
          disabled={selectedPages.length === 0 || isProcessing}
          className={`w-full max-w-md py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest border transition-all duration-300 shadow-lg cursor-pointer
            ${selectedPages.length > 0 && !isProcessing
              ? 'bg-neonCyan border-neonCyan text-[#0B0F19] shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.01]'
              : 'bg-gray-900 border-gray-800 text-gray-600 pointer-events-none'}`}
        >
          {isProcessing ? 'Processando Divisão Local...' : `Dividir e Baixar (${selectedPages.length}) Páginas`}
        </button>
      </div>
    </div>
  );
};
