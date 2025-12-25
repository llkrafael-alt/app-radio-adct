
import React, { useEffect, useRef } from 'react';

const CasterPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="w-full bg-black/20 py-3 flex flex-col items-center">
      <div className="w-full max-w-xl px-4">
        <div className="flex items-center gap-1.5 mb-1.5 px-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Player Digital</span>
        </div>
        <div ref={containerRef} className="w-full min-h-[100px] rounded-lg overflow-hidden bg-black/40 border border-white/5" />
      </div>
    </div>
  );
};

export default CasterPlayer;
