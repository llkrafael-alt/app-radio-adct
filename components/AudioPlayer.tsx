import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  streamUrl: string;
  churchName: string;
  color: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ streamUrl, churchName, color }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // retryKey serve para forçar o useEffect a rodar de novo e recriar o áudio do zero
  const [retryKey, setRetryKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Verifica se existe uma URL válida
  const hasStream = streamUrl && streamUrl.trim() !== '';

  // Configuração da Media Session (Controles na tela de bloqueio/Android)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      // Verifica se MediaMetadata é suportado antes de instanciar
      if (typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Rádio Ao Vivo",
          artist: churchName,
          album: "Web Rádio",
          artwork: [
            { src: 'https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/main/icon.png', sizes: '512x512', type: 'image/png' }
          ]
        });
      }

      navigator.mediaSession.setActionHandler('play', () => {
        handlePlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      });
      
      navigator.mediaSession.setActionHandler('stop', () => {
         if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
         }
      });
    }
  }, [churchName, retryKey]);

  // Atualiza estado de reprodução na Media Session
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Listener global de rede (Online/Offline) e VISIBILIDADE (Acordar o app)
  useEffect(() => {
    const handleOnline = () => {
      console.log("[AudioPlayer] Rede detectada (Online). Verificando conexão...");
      if (error || isPlaying) {
         setRetryKey(prev => prev + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[AudioPlayer] App acordou (Visible).");
        // Se estava tocando e parou misteriosamente (sistema matou o áudio), ou se tem erro, tenta reconectar.
        // Não forçamos o play se estava pausado intencionalmente, mas preparamos o terreno.
        if (audioRef.current && isPlaying && audioRef.current.paused) {
           console.log("[AudioPlayer] Áudio estava pausado pelo sistema. Tentando retomar...");
           setRetryKey(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [error, isPlaying]);

  // Efeito principal de Áudio - Recria o objeto Audio quando streamUrl ou retryKey mudam
  useEffect(() => {
    if (!hasStream) {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Configuração de rádio pendente.");
      return;
    }

    // Limpa timeout de reconexão anterior se existir
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    // Limpa instância anterior de áudio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
    }

    try {
      // Adiciona timestamp para evitar cache de conexões mortas/stale
      const separator = streamUrl.includes('?') ? '&' : '?';
      const freshUrl = `${streamUrl}${separator}nocache=${Date.now()}`;
      
      console.log(`[AudioPlayer] Inicializando stream: ${freshUrl}`);

      const audio = new Audio(freshUrl);
      audio.crossOrigin = "anonymous";
      
      // Atributos para mobile e persistência
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.preload = 'auto'; // Força o carregamento para tentar o play imediato
      
      audioRef.current = audio;
      
      // Hack para impedir que o Android mate o processo de áudio
      (window as any).radioInstance = audio;

      // Se for uma reconexão (retryKey > 0), tenta dar play automático
      if (retryKey > 0) {
        // Pequeno delay para garantir que o objeto está pronto
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn("Autoplay na reconexão bloqueado ou interrompido:", e);
                // Se falhar o autoplay, reseta o estado para o usuário clicar de novo
                setIsLoading(false);
                setIsPlaying(false);
            });
        }
      }

      const onPlay = () => {
        console.log("[AudioPlayer] Event: Play");
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
      };

      const onPause = () => {
        console.log("[AudioPlayer] Event: Pause");
        // Só define como pausado se não estivermos carregando (buffer) ou tentando reconectar intencionalmente
        if (audio.readyState >= 3 || audio.paused) {
           setIsPlaying(false);
        }
      };

      const onWaiting = () => {
        console.log("[AudioPlayer] Event: Waiting (Buffering)");
        if (isPlaying) setIsLoading(true);
      };

      const onPlaying = () => {
        console.log("[AudioPlayer] Event: Playing");
        setIsPlaying(true);
        setIsLoading(false);
      };

      const onError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        let errorMessage = "Rádio indisponível.";
        let shouldRetry = false;
        
        if (target.error) {
            switch (target.error.code) {
                case 1: 
                    errorMessage = "Reprodução abortada."; 
                    break;
                case 2: 
                    errorMessage = "Erro de rede. Reconectando..."; 
                    shouldRetry = true; 
                    break;
                case 3: 
                    errorMessage = "Erro de decodificação. Reconectando..."; 
                    shouldRetry = true; 
                    break;
                case 4: 
                    errorMessage = "Formato não suportado."; 
                    break;
                default: 
                    errorMessage = `Erro de conexão. Reconectando...`;
                    shouldRetry = true;
            }
            console.error(`[AudioPlayer] Error Code: ${target.error.code}`);
        } else {
            // Em HTML5 Audio, erro genérico geralmente é rede
            shouldRetry = true;
            errorMessage = "Queda de sinal. Reconectando...";
        }

        setIsPlaying(false);
        setIsLoading(false);
        setError(errorMessage);

        if (shouldRetry) {
            console.log("[AudioPlayer] Agendando reconexão em 3s...");
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
                setRetryKey(prev => prev + 1);
            }, 3000);
        }
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('error', onError);

      return () => {
        console.log("[AudioPlayer] Cleanup");
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        audio.pause();
        audio.removeAttribute('src'); // Garante que o buffer pare de baixar
        audio.load(); // Reseta o elemento
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('error', onError);
        audioRef.current = null;
        if ((window as any).radioInstance === audio) {
            (window as any).radioInstance = null;
        }
      };
    } catch (e) {
      console.error("Erro crítico ao criar Audio:", e);
      setError("Erro interno no player.");
    }
  }, [streamUrl, hasStream, retryKey]);

  const handlePlay = async () => {
    if (!hasStream) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    console.log("[AudioPlayer] Botão Play: Sincronizando com Ao Vivo...");
    setIsLoading(true);
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  return (
    // Design Atualizado: Glassmorphism (Vidro Escuro) e Blur Intenso
    <div className="fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 pb-6 md:pb-4 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Status Info */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
            {hasStream ? "Ao Vivo Agora" : "Status"}
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-white shadow-black drop-shadow-md">
              {!hasStream ? "Sem Sinal" : isLoading ? "Conectando..." : (isPlaying ? "No Ar" : "Toque para ouvir")}
            </span>
          </div>
          {error && <span className="text-xs text-red-400 mt-1 animate-pulse">{error}</span>}
        </div>

        {/* Main Control */}
        <button
          onClick={handlePlay}
          disabled={!hasStream}
          className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
            !hasStream ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-white text-gray-900'
          }`}
          style={{ color: isPlaying ? '#1f2937' : (!hasStream ? '#9ca3af' : color) }}
        >
          {isLoading ? (
             <svg className="animate-spin h-8 w-8 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Visualizer (Decorative) */}
        <div className="flex w-16 md:w-24 items-end gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-full rounded-t-sm ${isPlaying ? 'visualizer-bar' : 'h-1'}`}
              style={{ 
                animationDuration: `${0.6 + i * 0.1}s`,
                animationPlayState: isPlaying ? 'running' : 'paused',
                backgroundColor: isPlaying ? 'white' : '#4b5563'
              }}
            ></div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AudioPlayer;