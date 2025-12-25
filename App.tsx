
import React, { useEffect, useState } from 'react';
import HeroCarousel from './components/HeroCarousel';
import AudioPlayer from './components/AudioPlayer';
import HarpaCrista from './components/HarpaCrista';
import CasterPlayer from './components/CasterPlayer';
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
    <div className="flex flex-col h-screen w-full bg-[#030712] font-sans text-white overflow-hidden relative">
      
      {/* Header Compacto */}
      <header className="shrink-0 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 py-3 px-6 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/main/icon.png" 
            alt="Logo" 
            className="w-8 h-8 rounded-full border border-white/20 shadow-xl object-cover"
          />
          <div className="flex flex-col">
            <h1 className="text-[10px] md:text-xs font-black text-white leading-tight uppercase tracking-wider">
              {config.churchName}
            </h1>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[7px] text-white/40 uppercase font-black tracking-[0.2em]">Live Stream</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowHarpa(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-yellow-500 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </header>

      {/* Conteúdo Principal em Tela Única */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* 1. PLAYER CASTER (TOPO) */}
        <section className="shrink-0">
          <CasterPlayer />
        </section>

        {/* 2. CARROSSEL (MEIO) */}
        <section className="flex-1 w-full relative min-h-0">
          <HeroCarousel images={config.images} />
        </section>

        {/* 3. PLAYER ORIGINAL (FIXO NA BASE) */}
        <section className="shrink-0 p-4 pb-8 z-30">
          <AudioPlayer 
            streamUrl={config.streamUrl} 
            churchName={config.churchName} 
            color={config.primaryColor} 
          />
          <p className="text-[7px] font-black uppercase tracking-[0.6em] text-center opacity-20 mt-4 pointer-events-none">
            {config.churchName} • Conectando Vidas
          </p>
        </section>

      </main>

      <HarpaCrista isOpen={showHarpa} onClose={() => setShowHarpa(false)} />

    </div>
  );
};

export default App;
