import React from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ToolsGrid } from './components/ToolsGrid';

function App() {
  return (
    // Mudamos para h-auto e adicionamos py-24 para permitir a rolagem das ferramentas
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-start py-24 px-4 overflow-y-auto">
      {/* Luzes de fundo (Glow Neon) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neonCyan/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neonViolet/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Cabeçalho Fixo */}
      <Header />

      {/* Título Principal do seu Layout */}
      <h2 className="text-2xl font-black text-white mt-12 mb-6 tracking-wider uppercase text-center">
        Arrastar e Soltar
      </h2>

      {/* Área Dropzone */}
      <DropZone />

      {/* Grade de Ferramentas (Igual ao seu Layout) */}
      <ToolsGrid />
    </div>
  );
}

export default App;
