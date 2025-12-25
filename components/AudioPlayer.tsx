
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

  const hasStream = streamUrl && streamUrl.trim() !== '';

  useEffect(() => {
    if (!hasStream) return;

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }

    const audio = new Audio(streamUrl);
    audio.crossOrigin = "anonymous";
    audio.setAttribute('playsinline', 'true');
    audioRef.current = audio;

    const onPlay = () => { setIsPlaying(true); setIsLoading(false); };
    const onPause = () => { setIsPlaying(false); };
    const onError = () => { setIsPlaying(false); setIsLoading(false); setError("Erro no sinal"); };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [streamUrl]);

  const handlePlay = () => {
    if (!hasStream || isLoading) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      return;
    }
    setError(null);
    setIsLoading(true);
    audioRef.current?.play().catch(() => {
      setError("Reconectando...");
      setIsLoading(false);
    });
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-2xl">
        <div className="flex items-center gap-4">
          
          <button
            onClick={handlePlay}
            className={`flex shrink-0 items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 shadow-lg ${
              isPlaying ? 'bg-white text-gray-900' : 'bg-blue-600 text-white'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em]">Streaming Nativo</span>
            <h3 className="text-white font-bold text-sm truncate uppercase tracking-tight">{churchName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">
                 {isPlaying ? "No Ar" : "Offline"}
               </span>
            </div>
          </div>

          <div className="flex items-end gap-1 h-4 px-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full ${isPlaying ? 'visualizer-bar bg-white' : 'h-1 bg-white/10'}`}
                style={{ animationDuration: `${0.4 + i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
        {error && <p className="text-[8px] text-red-500 mt-2 text-center font-bold uppercase tracking-widest">{error}</p>}
      </div>
    </div>
  );
};

export default AudioPlayer;
