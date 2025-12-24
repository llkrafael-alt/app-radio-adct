import React, { useEffect, useState } from 'react';
import HeroCarousel from './components/HeroCarousel';
import AudioPlayer from './components/AudioPlayer';
import HarpaCrista from './components/HarpaCrista';
import { RadioConfig } from './types';
import { getRadioConfig, DEFAULT_CONFIG } from './services/configService';

const App: React.FC = () => {
  const [config, setConfig] = useState<RadioConfig>(DEFAULT_CONFIG);
  const [showHarpa, setShowHarpa] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getRadioConfig();
        if (data) {
          setConfig(data);
        }
      } catch (err) {
        console.error("Erro ao atualizar configurações:", err);
      }
    };
    loadConfig();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 font-sans text-white overflow-hidden">
      
      {/* Header Fixo e Semitransparente */}
      <header className="absolute top-0 left-0 w-full bg-black/40 backdrop-blur-md border-b border-white/5 py-4 px-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/main/icon.png" 
            alt="Logo" 
            className="w-10 h-10 rounded-full border border-white/20 shadow-xl object-cover"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white leading-tight tracking-tight drop-shadow-md">
              {config.churchName}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span className="text-[9px] text-white/80 uppercase font-black tracking-[0.2em]">Ao Vivo</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowHarpa(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-yellow-500/20 border border-white/20 transition-all active:scale-95 group"
          title="Harpa Cristã"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </header>

      {/* Conteúdo Principal: Carrossel Tela Cheia */}
      <main className="relative flex-1 w-full bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={config.images} />
        </div>

        {/* Overlay de gradiente inferior para destacar o player */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
        
        {/* Mensagem de boas-vindas flutuante sutil */}
        <div className="absolute inset-x-0 bottom-32 flex justify-center z-20 px-6 pointer-events-none">
           <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] text-center drop-shadow-lg">
             {config.churchName} • Transmitindo as Boas Novas
           </p>
        </div>
      </main>

      {/* Player de Áudio Persistentemente no fundo */}
      <AudioPlayer 
        streamUrl={config.streamUrl} 
        churchName={config.churchName} 
        color={config.primaryColor} 
      />

      <HarpaCrista isOpen={showHarpa} onClose={() => setShowHarpa(false)} />

    </div>
  );
};

export default App;