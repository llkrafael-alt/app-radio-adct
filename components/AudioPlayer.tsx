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
  const [retryKey, setRetryKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const hasStream = streamUrl && streamUrl.trim() !== '';

  useEffect(() => {
    if ('mediaSession' in navigator) {
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

      navigator.mediaSession.setActionHandler('play', () => { handlePlay(); });
      navigator.mediaSession.setActionHandler('pause', () => { if (audioRef.current) audioRef.current.pause(); });
    }
  }, [churchName, retryKey]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!hasStream) {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Configuração pendente.");
      return;
    }

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
    }

    try {
      // IMPORTANTE: Removemos o nocache=Date.now() pois o Zeno.fm costuma dar ERRO 4 com parâmetros extras
      console.log(`[AudioPlayer] Conectando a: ${streamUrl}`);

      const audio = new Audio(streamUrl);
      audio.crossOrigin = "anonymous";
      audio.setAttribute('playsinline', 'true');
      audio.preload = 'none'; // Mudado para none para evitar consumo antes do play
      
      audioRef.current = audio;

      const onPlay = () => {
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
      };

      const onPause = () => {
        setIsPlaying(false);
      };

      const onWaiting = () => {
        if (isPlaying) setIsLoading(true);
      };

      const onPlaying = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      const onError = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        let errorMessage = "Erro de conexão.";
        
        if (target.error) {
            if (target.error.code === 4) {
                errorMessage = "Formato de áudio não suportado ou link offline.";
            } else {
                errorMessage = `Erro no sinal (Cod: ${target.error.code}).`;
            }
        }

        setIsPlaying(false);
        setIsLoading(false);
        setError(errorMessage);

        // Tentativa automática de reconexão apenas em erros de rede
        if (target.error && target.error.code !== 4) {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
                setRetryKey(prev => prev + 1);
            }, 5000);
        }
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('error', onError);

      // Autoplay na reconexão
      if (retryKey > 0) {
        audio.play().catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
      }

      return () => {
        audio.pause();
        audio.src = "";
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('error', onError);
      };
    } catch (e) {
      setError("Falha ao iniciar player.");
    }
  }, [streamUrl, hasStream, retryKey]);

  const handlePlay = () => {
    if (!hasStream || isLoading) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }

    setError(null);
    setIsLoading(true);
    
    if (audioRef.current) {
      // Força recarregamento do src para pegar o stream ao vivo atualizado
      audioRef.current.load();
      audioRef.current.play().catch(e => {
        console.error("Erro ao dar play:", e);
        setError("Toque novamente para conectar.");
        setIsLoading(false);
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/70 backdrop-blur-2xl border-t border-white/10 p-4 pb-8 md:pb-4 z-50 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rádio Ao Vivo</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-white">
              {isLoading ? "Conectando..." : (isPlaying ? "No Ar" : "Pausado")}
            </span>
          </div>
          {error && <span className="text-[10px] text-red-400 mt-0.5 leading-tight max-w-[140px]">{error}</span>}
        </div>

        <button
          onClick={handlePlay}
          disabled={!hasStream}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 ${
            !hasStream ? 'bg-gray-800 text-gray-600' : 'bg-white text-gray-900 shadow-xl'
          }`}
        >
          {isLoading ? (
             <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

        <div className="flex w-12 items-end gap-1 h-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all ${isPlaying ? 'visualizer-bar' : 'h-1 bg-gray-600'}`}
              style={{ 
                animationDuration: `${0.5 + i * 0.15}s`,
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