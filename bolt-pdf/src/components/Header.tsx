import React from 'react';

export const Header: React.FC = () => {
  const handleLogoClick = () => {
    window.location.reload(); // Atualiza a página ao clicar, funcionando como um botão de "Home"
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLogoClick();
    }
  };

  return (
    <header className="w-full border-b border-gray-800 bg-background/50 backdrop-blur-md px-6 py-4 flex justify-between items-center fixed top-0 left-0 z-50">
      <div 
        onClick={handleLogoClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Ir para a página inicial do BoltPDF"
        className="flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-neonCyan rounded-xl p-1"
      >
        {/* Ícone de Raio com efeito Glow (xmlns corrigido) */}
        <div className="p-2 bg-neonCyan/10 rounded-lg border border-neonCyan/30 group-hover:border-neonCyan transition-all shadow-neon-cyan">
          <svg xmlns="w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-neonCyan animate-pulse">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-wider text-white">
          BOLT<span className="text-neonCyan">PDF</span>
        </span>
      </div>
      
      <div className="text-sm text-gray-400 bg-surface/50 px-4 py-2 rounded-full border border-gray-800 font-mono">
        ⚡ Client-Side Engine v1.0
      </div>
    </header>
  );
};
