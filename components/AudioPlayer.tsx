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
          { src: 'https://cdn-icons-png.flaticon.com/512/3083/3083417.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.error("Remote play failed", e));
        }
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
  }, [churchName]);

  // Atualiza estado de reprodução na Media Session
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!hasStream) {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Configuração de rádio pendente.");
      return;
    }

    // Limpa instância anterior se houver
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    try {
      // Criar o áudio e anexar ao window para evitar Garbage Collection em background
      const audio = new Audio(streamUrl);
      
      // Atributos importantes para mobile
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      audioRef.current = audio;
      
      // Hack para impedir que o Android mate o processo de áudio
      (window as any).radioInstance = audio;

      audio.preload = 'none';

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

      const onError = (e: Event) => {
        console.error("Erro de reprodução:", e);
        setIsPlaying(false);
        setIsLoading(false);
        setError("Rádio indisponível no momento.");
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('error', onError);

      return () => {
        audio.pause();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlay);
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
      console.error("Erro ao inicializar áudio:", e);
      setError("Erro na URL da rádio.");
    }
  }, [streamUrl, hasStream]);

  const togglePlay = async () => {
    if (!hasStream) return;
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setError(null);
      setIsLoading(true);
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error("Playback failed", err);
        setIsLoading(false);
        setError("Clique play novamente.");
      }
    }
  };

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
          onClick={togglePlay}
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