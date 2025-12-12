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
    
    // 2. Remove qualquer instância anterior do script global para forçar re-execução
    const existingScripts = document.querySelectorAll('script[src*="caster.fm/widgets/embed.js"]');
    existingScripts.forEach(s => s.remove());

    // 3. Monta a DIV do player exatamente conforme o snippet original
    const embedDiv = document.createElement('div');
    embedDiv.className = 'cstrEmbed';
    embedDiv.setAttribute('data-type', 'newStreamPlayer');
    embedDiv.setAttribute('data-publicToken', '14acde51-7663-42e2-b46b-2a0a55f871bb');
    embedDiv.setAttribute('data-theme', theme);
    embedDiv.setAttribute('data-color', primaryColor.replace('#', ''));
    embedDiv.setAttribute('data-channelId', '');
    embedDiv.setAttribute('data-rendered', 'false'); // Importante para o script saber que é novo
    
    // Adiciona links de fallback internos (necessário para validação do script em alguns casos)
    embedDiv.innerHTML = `
      <a href="https://www.caster.fm">Shoutcast Hosting</a> 
      <a href="https://www.caster.fm">Stream Hosting</a> 
      <a href="https://www.caster.fm">Radio Server Hosting</a>
    `;

    container.appendChild(embedDiv);

    // 4. Injeta o script
    const script = document.createElement('script');
    script.src = "https://cdn.cloud.caster.fm/widgets/embed.js";
    script.async = true;
    container.appendChild(script);

  }, [primaryColor, theme]);

  return (
    // min-h-[120px] garante que a área do player exista mesmo se o script demorar
    // border-b adicionado para separar o header do conteúdo
    <div className="w-full bg-gray-900 border-b border-gray-800 min-h-[120px] flex items-center justify-center">
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

export default CasterPlayer;