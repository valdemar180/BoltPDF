import React, { useState, useMemo } from 'react';

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
  // Otimização de performance: Uso de Set para garantir complexidade O(1) nas buscas de itens
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const togglePageSelection = (pageNumber: number) => {
    if (isProcessing) return;
    setSelectedPages(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(pageNumber)) {
        nextSet.delete(pageNumber);
      } else {
        nextSet.add(pageNumber);
      }
      return nextSet;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageNumber: number) => {
    if (isProcessing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Previne o comportamento padrão de rolagem de tela da tecla de Espaço
      togglePageSelection(pageNumber);
    }
  };

  const handleSelectAll = () => {
    if (isProcessing) return;
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map(p => p.pageNumber)));
    }
  };

  const handleSubmit = () => {
    if (selectedPages.size === 0 || isProcessing) return;
    // Converte de volta para array ordenado apenas no momento do envio final
    const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
    onProcessDivision(sortedPages);
  };

  const allSelected = selectedPages.size === pages.length;
  const totalSelected = selectedPages.size;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 animate-fadeIn">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#151D30] border border-gray-800 p-4 rounded-xl mb-6 shadow-lg">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-white tracking-wide">Selecione as páginas para divisão</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            {totalSelected} de {pages.length} páginas selecionadas
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={isProcessing}
            className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-surface/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Grade de Páginas Renderizadas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-[500px] overflow-y-auto p-2 bg-background/50 border border-gray-900 rounded-2xl mb-8 custom-scrollbar">
        {pages.map((page) => {
          // Busca O(1) instantânea eliminando o gargalo do .includes() linear
          const isChecked = selectedPages.has(page.pageNumber);
          
          return (
            <div
              key={page.pageNumber}
              onClick={() => togglePageSelection(page.pageNumber)}
              onKeyDown={(e) => handleKeyDown(e, page.pageNumber)}
              role="checkbox"
              aria-checked={isChecked}
              aria-disabled={isProcessing}
              tabIndex={isProcessing ? -1 : 0}
              className={`relative bg-[#151D30]/60 border rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-neonCyan select-none
                ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}
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
                    // URI consertada de acordo com as especificações oficiais do W3C
                    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Imagem da Miniatura gerada pelo Canvas */}
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-gray-900 bg-[#0B0F19] flex items-center justify-center relative mb-3">
                <img
                  src={page.dataUrl}
                  alt={`Miniatura da Página ${page.pageNumber}`}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                  width={150} // Dimensões explícitas adicionadas para mitigar reflows na viewport
                  height={200}
                />
              </div>

              {/* Tag com o número da página */}
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors
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
          type="button"
          onClick={handleSubmit}
          disabled={totalSelected === 0 || isProcessing}
          className={`w-full max-w-md py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest border transition-all duration-300 shadow-lg
            ${totalSelected > 0 && !isProcessing
              ? 'bg-neonCyan border-neonCyan text-[#0B0F19] shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.01] cursor-pointer'
              : 'bg-gray-900 border-gray-800 text-gray-600 pointer-events-none'}`}
        >
          {isProcessing ? 'Processando Divisão Local...' : `Dividir e Baixar (${totalSelected}) Páginas`}
        </button>
      </div>
    </div>
  );
};
