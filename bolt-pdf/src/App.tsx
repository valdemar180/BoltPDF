import React from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ToolsGrid } from './components/ToolsGrid';

function App() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-start py-24 px-4 overflow-y-auto">
      {/* Luzes de fundo (Glow Neon) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neonCyan/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neonViolet/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Cabeçalho Fixo */}
      <Header />

      {/* Conteúdo Principal Semanticamente Envelopado */}
      <main className="w-full flex flex-col items-center justify-start z-10">
        {/* Título Principal Corrigido para H1 */}
        <h1 className="text-2xl font-black text-white mt-12 mb-6 tracking-wider uppercase text-center">
          Arrastar e Soltar
        </h1>

        {/* Área Dropzone */}
        <DropZone />

        {/* Grade de Ferramentas */}
        <ToolsGrid />
      </main>
    </div>
  );
}

export default App;
