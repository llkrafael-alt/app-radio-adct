import React, { useEffect, useState } from 'react';

interface PodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PodcastModal: React.FC<PodcastModalProps> = ({ isOpen, onClose }) => {
  // Key state força o React a destruir e recriar a div do player
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setKey(prev => prev + 1);

      // Timeout para garantir que o DOM (a div .cstrEmbed) já existe
      const timer = setTimeout(() => {
        // 1. Remove qualquer script antigo do Caster.fm para evitar conflitos
        const existingScript = document.querySelector('script[src*="caster.fm/widgets/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // 2. Cria e injeta o script novamente
        const script = document.createElement('script');
        // Corrigido URL (removido barra dupla extra se houver e forçado HTTPS)
        script.src = "https://cdn.cloud.caster.fm/widgets/embed.js"; 
        script.async = true;
        document.body.appendChild(script);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Caster.fm Player</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600 hover:text-red-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Widget Container */}
        <div className="p-4 bg-gray-50 flex justify-center items-center min-h-[400px]">
             
             {/* O player será injetado aqui pelo script. Mantendo estrutura exata. */}
             <div 
               key={key}
               data-type="newStreamPlayer" 
               data-publicToken="14acde51-7663-42e2-b46b-2a0a55f871bb" 
               data-theme="light" 
               data-color="e81e4d" 
               data-channelId="" 
               data-rendered="false" 
               className="cstrEmbed"
               style={{ width: '100%', minHeight: '350px' }}
             >
                {/* Links de fallback que o script usa/substitui */}
                <a href="https://www.caster.fm">Shoutcast Hosting</a> 
                <a href="https://www.caster.fm">Stream Hosting</a> 
                <a href="https://www.caster.fm">Radio Server Hosting</a>
             </div>

        </div>

      </div>
    </div>
  );
};

export default PodcastModal;