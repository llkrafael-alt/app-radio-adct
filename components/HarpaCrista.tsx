
import React, { useState, useEffect, useMemo } from 'react';
import { getHarpaHymns, Hymn } from '../services/harpaData';

interface HarpaCristaProps {
  isOpen: boolean;
  onClose: () => void;
}

const HarpaCrista: React.FC<HarpaCristaProps> = ({ isOpen, onClose }) => {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);

  // Carrega os dados ao montar ou abrir
  useEffect(() => {
    if (isOpen && hymns.length === 0) {
      setLoading(true);
      getHarpaHymns().then(data => {
        setHymns(data);
        setLoading(false);
      });
    }
  }, [isOpen, hymns.length]);

  // Filtra os hinos pelo número ou título
  const filteredHymns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return hymns.filter(h => 
      h.number.toString().includes(term) || 
      h.title.toLowerCase().includes(term) ||
      h.lyrics.toLowerCase().includes(term)
    );
  }, [searchTerm, hymns]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-gray-900 text-white flex flex-col animate-fade-in">
      
      {/* Header da Harpa */}
      <div className="bg-gray-800 p-4 pt-12 md:pt-4 shadow-md flex items-center justify-between z-50 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          {selectedHymn && (
            <button 
              onClick={() => setSelectedHymn(null)}
              className="p-2 rounded-full hover:bg-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-bold font-serif text-yellow-500 truncate max-w-[200px]">
            {selectedHymn ? `Hino ${selectedHymn.number}` : 'Harpa Cristã'}
          </h2>
        </div>
        
        <button 
          onClick={onClose}
          className="p-2 bg-gray-700/50 rounded-full hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Conteúdo Principal (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-gray-900 scroll-smooth">
        
        {loading ? (
           <div className="flex flex-col items-center justify-center h-full space-y-4">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
             <p className="text-gray-400 text-sm">Carregando hinário...</p>
           </div>
        ) : selectedHymn ? (
          // VISUALIZAÇÃO DO HINO (TELA CHEIA COM ROLAGEM)
          <div className="max-w-2xl mx-auto p-6 pb-32 animate-slide-up min-h-full">
            <div className="text-center mb-8 mt-2">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 leading-tight">
                {selectedHymn.title}
              </h3>
              <div className="w-16 h-1 bg-yellow-500/30 mx-auto rounded-full"></div>
            </div>
            
            <div className="prose prose-invert mx-auto">
              <p className="whitespace-pre-line text-lg md:text-xl leading-loose text-gray-200 font-serif text-center">
                {selectedHymn.lyrics}
              </p>
            </div>

            <div className="mt-12 text-center">
               <button 
                 onClick={() => setSelectedHymn(null)}
                 className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-400 transition"
               >
                 Voltar para a lista
               </button>
            </div>
          </div>
        ) : (
          // LISTA DE HINOS
          <div className="max-w-2xl mx-auto p-4 pb-32">
            
            {/* Barra de Pesquisa */}
            <div className="sticky top-0 bg-gray-900 pt-2 pb-4 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Busque por número, título ou letra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:border-yellow-500 transition shadow-lg placeholder-gray-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Lista */}
            <div className="space-y-2">
              {filteredHymns.length > 0 ? (
                filteredHymns.map((hymn) => (
                  <button
                    key={hymn.number}
                    onClick={() => setSelectedHymn(hymn)}
                    className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg p-4 flex items-center gap-4 text-left transition active:scale-[0.98]"
                  >
                    <span className="font-bold text-yellow-500 text-lg min-w-[2.5rem]">
                      {hymn.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-lg truncate">{hymn.title}</h4>
                      <p className="text-gray-500 text-xs truncate">
                        {hymn.lyrics.split('\n')[0]}...
                      </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum hino encontrado.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-600">
               Total de {hymns.length} hinos disponíveis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarpaCrista;
