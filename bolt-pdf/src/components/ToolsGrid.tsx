import React from 'react';

interface ToolCardProps {
  title: string;
  description: string;
  btnText: string;
  colorClass: string;
  bgIconClass: string;
  iconPath: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, btnText, colorClass, bgIconClass, iconPath }) => {
  return (
    <div className="bg-surface/40 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between items-start hover:border-gray-700 transition-all duration-300">
      <div className="w-full">
        {/* Ícone customizado */}
        <div className={`p-3 rounded-xl mb-4 w-fit flex items-center justify-center ${bgIconClass}`}>
          <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${colorClass}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        
        <h4 className="text-md font-bold text-white mb-2">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">{description}</p>
      </div>

      <button className={`w-full py-2 px-4 rounded-xl text-xs font-semibold border bg-transparent transition-all duration-300
        ${colorClass === 'text-neonCyan' ? 'border-neonCyan/30 text-neonCyan hover:bg-neonCyan/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]' : ''}
        ${colorClass === 'text-orange-400' ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]' : ''}
        ${colorClass === 'text-green-400' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)]' : ''}
        ${colorClass === 'text-purple-400' ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]' : ''}
        ${colorClass === 'text-pink-400' ? 'border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)]' : ''}
      `}>
        {btnText}
      </button>
    </div>
  );
};

export const ToolsGrid: React.FC = () => {
  const tools = [
    {
      title: "Converter PDF",
      description: "Converter arquivos de imagem, Word ou Excel para PDF e vice-versa de forma rápida.",
      btnText: "Converter Agora",
      colorClass: "text-orange-400",
      bgIconClass: "bg-orange-500/10 border border-orange-500/20",
      iconPath: "M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-.75m-6 3.75m-3-3l3 3m0 0l3-3m-3 3V1.5m6 7.5h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
    },
    {
      title: "Mesclar PDF",
      description: "Mesclar arquivos PDF na ordem que você desejar de maneira simples e muito rápida.",
      btnText: "Mesclar Arquivos",
      colorClass: "text-neonCyan",
      bgIconClass: "bg-neonCyan/10 border border-neonCyan/20",
      iconPath: "M12 4.5v15m7.5-7.5h-15"
    },
    {
      title: "Editar PDF",
      description: "Adicionar notas, textos ou organizar as páginas do seu documento diretamente no navegador.",
      btnText: "Editar Agora",
      colorClass: "text-green-400",
      bgIconClass: "bg-green-500/10 border border-green-500/20",
      iconPath: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
    },
    {
      title: "Dividir PDF",
      description: "Extrair páginas selecionadas ou separar cada folha em arquivos PDF independentes.",
      btnText: "Dividir Arquivos",
      colorClass: "text-purple-400",
      bgIconClass: "bg-purple-500/10 border border-purple-500/20",
      iconPath: "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
    },
    {
      title: "Assinar Documento",
      description: "Adicionar assinaturas eletrônicas seguras, válidas e vinculativas aos seus PDFs.",
      btnText: "Assinar Agora",
      colorClass: "text-pink-400",
      bgIconClass: "bg-pink-500/10 border border-pink-500/20",
      iconPath: "M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.5 13.5"
    }
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 mt-16 mb-20">
      <h3 className="text-center text-xl font-extrabold text-white mb-8 tracking-wide">
        Nossas Ferramentas PDF Poderosas
      </h3>
      
      {/* Grid responsivo: 1 coluna no mobile até 5 colunas no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tools.map((tool, index) => (
          <ToolCard key={index} {...tool} />
        ))}
      </div>
    </section>
  );
};
