import React, { useMemo } from 'react';

type ToolType = 'converter' | 'mesclar' | 'editar' | 'dividir' | 'assinar';

interface ToolCardProps {
  type: ToolType;
  title: string;
  description: string;
  btnText: string;
  iconPath: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick?: () => void;
}

const TOOL_THEMES: Record<ToolType, { bgIcon: string; btnHover: string }> = {
  converter: {
    bgIcon: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    btnHover: 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]'
  },
  mesclar: {
    bgIcon: 'bg-neonCyan/10 border-neonCyan/20 text-neonCyan',
    btnHover: 'border-neonCyan/30 text-neonCyan hover:bg-neonCyan/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'
  },
  editar: {
    bgIcon: 'bg-green-500/10 border-green-500/20 text-green-400',
    btnHover: 'border-green-500/30 text-green-400 hover:bg-green-500/10 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)]'
  },
  dividir: {
    bgIcon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    btnHover: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]'
  },
  assinar: {
    bgIcon: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    btnHover: 'border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)]'
  }
};

const ToolCard: React.FC<ToolCardProps> = ({ 
  type,
  title, 
  description, 
  btnText, 
  iconPath,
  isActive,
  isDisabled,
  onClick
}) => {
  const theme = TOOL_THEMES[type];

  return (
    <div 
      className={`bg-surface/40 border rounded-2xl p-5 flex flex-col justify-between items-start transition-all duration-500 h-full
        ${isActive 
          ? 'border-neonCyan shadow-[0_0_25px_rgba(0,240,255,0.25)] scale-[1.02] bg-[#151D30]' 
          : isDisabled 
            ? 'border-gray-900 opacity-30 select-none' 
            : 'border-gray-800 hover:border-gray-700 hover:shadow-lg'}`}
    >
      <div className="w-full">
        <div className={`p-3 rounded-xl mb-4 w-fit flex items-center justify-center border ${theme.bgIcon}`}>
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        
        <h4 className="text-md font-bold text-white mb-2">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">{description}</p>
      </div>

      <button 
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        className={`w-full py-2 px-4 rounded-xl text-xs font-semibold border bg-transparent transition-all duration-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-neonCyan
          ${isActive 
            ? 'bg-neonCyan text-[#0B0F19] font-black border-neonCyan shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:scale-[1.02] cursor-pointer' 
            : isDisabled
              ? 'border-gray-800 text-gray-600 pointer-events-none'
              : `cursor-pointer ${theme.btnHover}`}`}
      >
        {isActive ? "Processar Ação" : btnText}
      </button>
    </div>
  );
};

interface ToolsGridProps {
  currentFile: File | null;
  onConvert: () => void;
  onSplit: () => void;
  onMerge: () => void;
  onEdit: () => void; 
  onSign: () => void; 
  isProcessing: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export const ToolsGrid: React.FC<ToolsGridProps> = ({
  currentFile,
  onConvert,
  onSplit,
  onMerge,
  onEdit,
  onSign,
  isProcessing
}) => {
  const isImage = currentFile ? ALLOWED_IMAGE_TYPES.includes(currentFile.type) : false;
  const isPdf = currentFile ? currentFile.type === 'application/pdf' : false;

  const tools = useMemo(() => [
    {
      id: "converter" as ToolType,
      title: "Converter PDF",
      description: "Converter arquivos de imagem para PDF e vice-versa de forma rápida de forma segura.",
      btnText: "Converter Agora",
      iconPath: "M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-.75m-6 3.75m-3-3l3 3m0 0l3-3m-3 3V1.5m6 7.5h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75",
      isActive: isImage && !isProcessing,
      isDisabled: (currentFile !== null && !isImage) || isProcessing,
      onClick: onConvert
    },
    {
      id: "mesclar" as ToolType,
      title: "Mesclar PDF",
      description: "Mesclar arquivos PDF na ordem que você desejar de maneira simples e muito rápida.",
      btnText: "Mesclar Arquivos",
      iconPath: "M12 4.5v15m7.5-7.5h-15",
      isActive: isPdf && !isProcessing,
      isDisabled: (currentFile !== null && !isPdf) || isProcessing,
      onClick: onMerge
    },
    {
      id: "editar" as ToolType,
      title: "Editar PDF",
      description: "Adicionar notas, textos ou organizar as páginas do seu documento diretamente no navegador.",
      btnText: "Editar Agora",
      iconPath: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125",
      isActive: isPdf && !isProcessing, 
      isDisabled: (currentFile !== null && !isPdf) || isProcessing,
      onClick: onEdit 
    },
    {
      id: "dividir" as ToolType,
      title: "Dividir PDF",
      description: "Extrair páginas selecionadas ou separar cada folha em arquivos PDF independentes.",
      btnText: "Dividir Arquivos",
      iconPath: "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75",
      isActive: isPdf && !isProcessing, 
      isDisabled: (currentFile !== null && !isPdf) || isProcessing,
      onClick: onSplit
    },
    {
      id: "assinar" as ToolType,
      title: "Assinar com Foto",
      description: "Tire uma foto da sua assinatura no papel e insira no seu documento com fundo transparente.",
      btnText: "Importar Assinatura",
      iconPath: "M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.5 13.5",
      isActive: isPdf && !isProcessing,
      isDisabled: (currentFile !== null && !isPdf) || isProcessing,
      onClick: onSign
    }
  ], [currentFile, isImage, isPdf, isProcessing, onConvert, onSplit, onMerge, onEdit, onSign]);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 mt-16 mb-20" aria-labelledby="tools-title">
      <h3 id="tools-title" className="text-center text-xl font-extrabold text-white mb-8 tracking-wide">
        Nossas Ferramentas PDF Poderosas
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} type={tool.id} {...tool} />
        ))}
      </div>
    </section>
  );
};
