import React, { useEffect, useRef } from 'react';

interface CasterPlayerProps {
  primaryColor?: string;
  theme?: 'light' | 'dark';
}

const CasterPlayer: React.FC<CasterPlayerProps> = ({ 
  primaryColor = "e81e4d", 
  theme = "dark" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Limpa o container para garantir estado limpo
    container.innerHTML = '';
    
    // 2. Remove qualquer instância anterior do script global
    const existingScripts = document.querySelectorAll('script[src*="caster.fm/widgets/embed.js"]');
    existingScripts.forEach(s => s.remove());

    // 3. Monta a DIV do player
    const embedDiv = document.createElement('div');
    embedDiv.className = 'cstrEmbed';
    embedDiv.setAttribute('data-type', 'newStreamPlayer');
    embedDiv.setAttribute('data-publicToken', '14acde51-7663-42e2-b46b-2a0a55f871bb');
    embedDiv.setAttribute('data-theme', theme);
    const cleanColor = primaryColor.startsWith('#') ? primaryColor.substring(1) : primaryColor;
    embedDiv.setAttribute('data-color', cleanColor);
    embedDiv.setAttribute('data-channelId', '');
    embedDiv.setAttribute('data-rendered', 'false');
    
    embedDiv.innerHTML = `
      <a href="https://www.caster.fm" style="display:none">Shoutcast Hosting</a> 
      <a href="https://www.caster.fm" style="display:none">Stream Hosting</a> 
      <a href="https://www.caster.fm" style="display:none">Radio Server Hosting</a>
    `;

    container.appendChild(embedDiv);

    // 4. Injeta o script
    const script = document.createElement('script');
    script.src = "https://cdn.cloud.caster.fm/widgets/embed.js";
    script.async = true;
    container.appendChild(script);

  }, [primaryColor, theme]);

  return (
    <div className="w-full flex items-center justify-center py-2 px-4 min-h-[100px]">
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
};

export default CasterPlayer;