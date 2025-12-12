import React, { useEffect, useState } from 'react';
import HeroCarousel from './components/HeroCarousel';
import CasterPlayer from './components/CasterPlayer';
import HarpaCrista from './components/HarpaCrista';
import { RadioConfig } from './types';
import { getRadioConfig } from './services/configService';

interface ConfigWithDebug extends RadioConfig {
    error?: string;
}

const App: React.FC = () => {
  const [config, setConfig] = useState<ConfigWithDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHarpa, setShowHarpa] = useState(false);

  useEffect(() => {
    getRadioConfig().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!config) return null;

  return (
    // Layout FLEX VERTICAL (h-screen)
    <div className="flex flex-col h-screen w-full bg-gray-900 font-sans text-white overflow-hidden">
      
      {/* PARTE 1: Player (Agora no Topo) */}
      <div className="w-full bg-gray-900 z-30 shrink-0 shadow-lg relative">
         <CasterPlayer 
            primaryColor={config.primaryColor}
            theme="dark" 
         />
      </div>

      {/* PARTE 2: Carrossel (flex-1 faz ele ocupar todo o espaço abaixo do player) */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* Botão da Harpa (Agora relativo ao carrossel, para não cobrir o player) */}
        <button
          onClick={() => setShowHarpa(true)}
          className="absolute top-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 shadow-lg hover:bg-black/50 transition-all active:scale-95 group"
          aria-label="Abrir Harpa Cristã"
          title="Harpa Cristã"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>

        <HeroCarousel images={config.images} />
      </div>

      {/* Modal da Harpa Cristã (Sobrepõe tudo) */}
      <HarpaCrista isOpen={showHarpa} onClose={() => setShowHarpa(false)} />

    </div>
  );
};

export default App;