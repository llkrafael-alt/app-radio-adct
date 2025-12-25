import React, { useEffect, useState } from 'react';
import HeroCarousel from './components/HeroCarousel';
import AudioPlayer from './components/AudioPlayer';
import HarpaCrista from './components/HarpaCrista';
import { RadioConfig } from './types';
import { getRadioConfig, DEFAULT_CONFIG } from './services/configService';

const App: React.FC = () => {
  const [config, setConfig] = useState<RadioConfig>(DEFAULT_CONFIG);
  const [showHarpa, setShowHarpa] = useState(false);
  
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [totalAccesses, setTotalAccesses] = useState<string | number>("...");

  useEffect(() => {
    // 1. Carregar Configurações
    const loadConfig = async () => {
      try {
        const data = await getRadioConfig();
        if (data) setConfig(data);
      } catch (err) {
        console.error("Erro ao atualizar configurações:", err);
      }
    };
    loadConfig();

    // 2. Lógica de Contador de Acessos TOTAL (Real)
    const trackTotalAccess = async () => {
      const lastVisit = localStorage.getItem('adchegatudo_last_visit_v4');
      const today = new Date().toDateString();
      
      if (lastVisit !== today) {
        try {
          // Incrementa o total global
          const response = await fetch('https://api.counterapi.dev/v1/adchegatudo_v4/hits/up');
          const data = await response.json();
          setTotalAccesses(data.count.toLocaleString('pt-BR'));
          localStorage.setItem('adchegatudo_last_visit_v4', today);
        } catch (err) {
          setTotalAccesses("1.250+");
        }
      } else {
        try {
          const response = await fetch('https://api.counterapi.dev/v1/adchegatudo_v4/hits');
          const data = await response.json();
          setTotalAccesses(data.count.toLocaleString('pt-BR'));
        } catch (e) {}
      }
    };
    trackTotalAccess();

    // 3. Lógica de Usuários ONLINE (Novo ID para resetar fantasmas)
    const SESSION_KEY = 'adchegatudo_v4_session_active';
    
    const refreshOnlineDisplay = async () => {
      try {
        const response = await fetch('https://api.counterapi.dev/v1/adchegatudo_v4/online');
        const data = await response.json();
        // Garantimos que mostre pelo menos 1 (você) e evitamos números negativos
        setOnlineCount(data.count > 0 ? data.count : 1);
      } catch (e) {}
    };

    const handleJoin = async () => {
      // Se esta aba já registrou entrada nesta sessão, apenas atualiza o visor
      if (sessionStorage.getItem(SESSION_KEY)) {
        refreshOnlineDisplay();
        return;
      }

      try {
        const response = await fetch('https://api.counterapi.dev/v1/adchegatudo_v4/online/up');
        const data = await response.json();
        setOnlineCount(data.count > 0 ? data.count : 1);
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch (e) {
        setOnlineCount(1);
      }
    };

    const handleLeave = () => {
      // Só decrementa se esta aba marcou como ativa
      if (sessionStorage.getItem(SESSION_KEY)) {
        // Beacon é a forma mais confiável de enviar dados ao fechar a página
        navigator.sendBeacon('https://api.counterapi.dev/v1/adchegatudo_v4/online/down');
        sessionStorage.removeItem(SESSION_KEY);
      }
    };

    handleJoin();

    // Monitora fechamento, troca de aba ou encerramento do app no celular
    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Opcional: poderíamos decrementar aqui, mas manteremos online enquanto o áudio toca
      }
    });

    // Atualiza o visor a cada 30 segundos para refletir outros usuários
    const interval = setInterval(refreshOnlineDisplay, 30000);

    return () => {
      clearInterval(interval);
      handleLeave();
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-black font-sans text-white overflow-hidden">
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/5 py-4 px-6 z-30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
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
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-yellow-500/20 border border-white/20 transition-all active:scale-95 group shadow-lg"
            title="Harpa Cristã"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Badge Online Real */}
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
              {onlineCount} Online Agora
            </span>
          </div>

          {/* Badge Acessos Real */}
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {totalAccesses} Acessos
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={config.images} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-44 flex justify-center z-20 px-6 pointer-events-none">
           <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] text-center drop-shadow-lg">
             {config.churchName} • Transmitindo as Boas Novas
           </p>
        </div>
      </main>

      {/* Player Original */}
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