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

  // Verifica se existe uma URL válida
  const hasStream = streamUrl && streamUrl.trim() !== '';

  // Configuração da Media Session (Controles na tela de bloqueio/Android)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Rádio Ao Vivo",
        artist: churchName,
        album: "Web Rádio",
        artwork: [
          { src: 'https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/main/icon.png', sizes: '512x512', type: 'image/png' }
        ]
      });

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
  }, [churchName, retryKey]); // Atualiza actions quando retryKey muda

  // Atualiza estado de reprodução na Media Session
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Efeito principal de Áudio - Recria o objeto Audio quando streamUrl ou retryKey mudam
  useEffect(() => {
    if (!hasStream) {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Configuração de rádio pendente.");
      return;
    }

    // Limpa instância anterior
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
      audio.crossOrigin = "anonymous"; // Ajuda em alguns casos de CORS
      
      // Atributos para mobile e persistência
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      audioRef.current = audio;
      
      // Hack para impedir que o Android mate o processo de áudio
      (window as any).radioInstance = audio;

      audio.preload = 'none';

      const onPlay = () => {
        console.log("[AudioPlayer] Event: Play");
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
      };

      const onPause = () => {
        console.log("[AudioPlayer] Event: Pause");
        // Só define como pausado se não estivermos carregando (buffer)
        // Isso evita piscar o botão quando o audio trava por buffer
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
      }

      const onError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        let errorMessage = "Rádio indisponível.";
        
        if (target.error) {
            switch (target.error.code) {
                case 1: errorMessage = "Reprodução abortada."; break;
                case 2: errorMessage = "Erro de rede. Tentando reconectar..."; break;
                case 3: errorMessage = "Erro de decodificação."; break;
                case 4: errorMessage = "Formato não suportado."; break;
                default: errorMessage = `Erro desconhecido (${target.error.code})`;
            }
            console.error(`[AudioPlayer] Error Code: ${target.error.code} - ${target.error.message}`);
        } else {
            console.error("[AudioPlayer] Unknown Error Event", e);
        }

        setIsPlaying(false);
        setIsLoading(false);
        setError(errorMessage);
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('error', onError);

      return () => {
        console.log("[AudioPlayer] Cleanup");
        audio.pause();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('error', onError);
        audioRef.current = null;
        // Limpa referência global
        if ((window as any).radioInstance === audio) {
            (window as any).radioInstance = null;
        }
      };
    } catch (e) {
      console.error("Erro crítico ao criar Audio:", e);
      setError("Erro interno no player.");
    }
  }, [streamUrl, hasStream, retryKey]); // Dependência retryKey força recriação

  const handlePlay = async () => {
    if (!hasStream) return;

    // Se estiver tocando, pausa
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }

    // Se tiver erro ou não tiver audioRef (player morreu), recria tudo
    if (error || !audioRef.current) {
        console.log("[AudioPlayer] Tentando reconexão forçada...");
        setIsLoading(true);
        setError(null);
        setRetryKey(prev => prev + 1); // Isso dispara o useEffect acima
        // O useEffect vai criar o audio e precisamos dar play nele assim que estiver pronto.
        // Como o useEffect é assíncrono no React, fazemos um pequeno "auto-play" na próxima renderização via ref ou logicamente o usuário clica de novo se falhar.
        // Melhor abordagem: Forçar o play no novo audio instance dentro do useEffect? Não, browsers bloqueiam.
        // Vamos deixar o useEffect criar e esperamos o usuario clicar ou tentamos play imediato se for retry?
        // Vamos tentar dar play na nova instância via setTimeout é arriscado.
        // Melhor UX: Ao clicar em play com erro, setRetryKey reseta o player. 
        // O usuário pode precisar clicar novamente ou podemos tentar automação.
        
        // Estratégia simples: Se tem erro, o clique reseta o player.
        // Precisamos dar um pequeno tempo para o player ser recriado antes de dar play, 
        // mas no React isso é complexo.
        // Vamos fazer o seguinte: Ao mudar o retryKey, o player nasce "pausado". 
        // O usuário clica e ele toca.
        // Para melhorar: vamos tentar dar play na proxima renderização? Não.
        // Vamos apenas limpar o erro e tentar dar play no player ATUAL se ele existir, se não existir (null), o retryKey resolve.
        return; 
    }

    // Fluxo normal (sem erro, player existe)
    setError(null);
    setIsLoading(true);
    try {
      const p = audioRef.current.play();
      if (p !== undefined) {
          p.catch(err => {
              console.error("Playback promise failed", err);
              setIsLoading(false);
              setError("Falha ao iniciar. Tente novamente.");
              // Se falhar o play (ex: rede), força recriação no próximo clique
              if (err.name === 'NotSupportedError' || err.message.includes('source')) {
                  // Marca erro para o próximo clique recriar
                  setError("Sinal perdido. Clique para reconectar.");
              }
          });
      }
    } catch (err) {
      console.error("Playback sync failed", err);
      setIsLoading(false);
    }
  };

  // Helper para clique no botão (encapsula lógica de retry se necessário)
  const onToggleClick = () => {
      if (error) {
          // Se tem erro, forçamos recriação imediata E tentamos tocar após breve delay
          setRetryKey(prev => prev + 1);
          setTimeout(() => {
              // Tenta capturar a nova referencia
              const newAudio = (window as any).radioInstance;
              if (newAudio) newAudio.play().catch(() => {});
          }, 100);
      } else {
          handlePlay();
      }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800/95 backdrop-blur-md border-t border-gray-700 p-4 pb-6 md:pb-4 z-50 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Status Info */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
            {hasStream ? "Ao Vivo Agora" : "Status"}
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-white">
              {!hasStream ? "Sem Sinal" : isLoading ? "Conectando..." : (isPlaying ? "No Ar" : "Toque para ouvir")}
            </span>
          </div>
          {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
        </div>

        {/* Main Control */}
        <button
          onClick={onToggleClick}
          disabled={!hasStream}
          className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${
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
            /* Stop Icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            /* Play Icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Visualizer (Decorative) */}
        <div className="hidden md:flex items-end gap-1 h-8 w-24">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-full bg-gray-500 rounded-t-sm ${isPlaying ? 'visualizer-bar' : 'h-1'}`}
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