
import React, { useEffect, useRef } from 'react';

const CasterPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para parar qualquer áudio interno do Caster
  const stopCasterAudio = () => {
    if (containerRef.current) {
      const audios = containerRef.current.querySelectorAll('audio');
      audios.forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
    }
  };

  useEffect(() => {
    const handleStopExternal = () => {
      stopCasterAudio();
    };

    window.addEventListener('stop-external-audio', handleStopExternal);
    return () => window.removeEventListener('stop-external-audio', handleStopExternal);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    
    const existingScripts = document.querySelectorAll('script[src*="caster.fm/widgets/embed.js"]');
    existingScripts.forEach(s => s.remove());

    const embedDiv = document.createElement('div');
    embedDiv.className = 'cstrEmbed';
    embedDiv.setAttribute('data-type', 'newStreamPlayer');
    embedDiv.setAttribute('data-publicToken', '14acde51-7663-42e2-b46b-2a0a55f871bb');
    embedDiv.setAttribute('data-theme', 'dark');
    embedDiv.setAttribute('data-color', '020078');
    embedDiv.setAttribute('data-channelId', '');
    embedDiv.setAttribute('data-rendered', 'false');
    
    embedDiv.innerHTML = `
      <a href="https://www.caster.fm">Shoutcast Hosting</a> 
      <a href="https://www.caster.fm">Stream Hosting</a> 
      <a href="https://www.caster.fm">Radio Server Hosting</a>
    `;

    container.appendChild(embedDiv);

    const script = document.createElement('script');
    script.src = "https://cdn.cloud.caster.fm/widgets/embed.js";
    script.async = true;
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, []);

  // Ao clicar na área do Caster, paramos o player nativo (se existir)
  const handleInteraction = () => {
    window.dispatchEvent(new CustomEvent('stop-native-audio'));
  };

  return (
    <div 
      className="w-full bg-black/40 py-2 flex flex-col items-center border-b border-white/5 shadow-lg relative z-20"
      onClick={handleInteraction}
    >
      <div className="w-full max-w-xl px-4">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Player Oficial</span>
        </div>
        <div 
          ref={containerRef} 
          className="w-full min-h-[120px] rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner" 
        />
      </div>
    </div>
  );
};

export default CasterPlayer;
