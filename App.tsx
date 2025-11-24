import React, { useEffect, useState } from 'react';
import HeroCarousel from './components/HeroCarousel';
import AudioPlayer from './components/AudioPlayer';
import HarpaCrista from './components/HarpaCrista'; // Importação da Harpa
import { RadioConfig } from './types';
import { getRadioConfig } from './services/configService';

// Estende a interface para incluir erro opcional durante debug
interface ConfigWithDebug extends RadioConfig {
    error?: string;
}

const App: React.FC = () => {
  const [config, setConfig] = useState<ConfigWithDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [showErrorBanner, setShowErrorBanner] = useState(true);
  const [showHarpa, setShowHarpa] = useState(false); // Estado para controlar a Harpa

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

  if (!config.streamUrl) {
      return (
          <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
             <div className="text-center">
               <h2 className="text-xl font-bold text-red-500">Erro Crítico</h2>
               <p>Não foi possível carregar nenhuma configuração.</p>
             </div>
          </div>
      );
  }

  return (
    <div className="h-screen bg-gray-900 relative overflow-hidden font-sans">
      
      {/* Aviso de Erro Não Bloqueante (Toast) */}
      {config.error && showErrorBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-3 shadow-lg flex items-start justify-between animate-slide-down">
          <div className="flex items-center max-w-4xl mx-auto w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm font-medium">
              <p className="font-bold">Atenção: Usando configuração padrão.</p>
              <p className="opacity-90">{config.error}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowErrorBanner(false)}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* BOTÃO DA HARPA CRISTÃ - VISÍVEL NO TOPO DIREITO */}
      <button
        onClick={() => setShowHarpa(true)}
        className="absolute top-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg hover:bg-black/60 transition-all active:scale-95"
        aria-label="Abrir Harpa Cristã"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>

      {/* Hero Section with Carousel (Full Screen Background) */}
      <div className="absolute inset-0 z-0">
         <HeroCarousel images={config.images} />
      </div>

      {/* Fixed Audio Player */}
      <AudioPlayer 
        streamUrl={config.streamUrl} 
        churchName={config.churchName}
        color={config.primaryColor} 
      />

      {/* Modal da Harpa Cristã */}
      <HarpaCrista isOpen={showHarpa} onClose={() => setShowHarpa(false)} />
    </div>
  );
};

export default App;