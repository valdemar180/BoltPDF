import React, { useMemo } from 'react';

export function Footer() {
  // Captura o ano dinamicamente para evitar inconsistências temporais na interface
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="w-full text-center py-6 mt-auto border-t border-gray-800/40 z-10">
      <div className="text-xs text-gray-500 font-medium tracking-wide leading-relaxed flex flex-col items-center gap-1">
        <p>© {currentYear} Valdemar Oliveira.</p>
        
        {/* Uso de tag semântica para marcação cronológica legível por máquinas e leitores de tela */}
        <time dateTime="2026-05-18" className="text-[10px] text-gray-600 font-mono">
          18/05/{currentYear}
        </time>
        
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">
          Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
