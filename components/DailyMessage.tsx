import React, { useEffect, useState } from 'react';
import { DailyMessage as DailyMessageType } from '../types';
import { generateDailyMessage } from '../services/geminiService';

const DailyMessage: React.FC = () => {
  const [message, setMessage] = useState<DailyMessageType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchMessage = async () => {
      try {
        const data = await generateDailyMessage();
        if (mounted) {
          setMessage(data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    };

    fetchMessage();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-4 p-4 animate-pulse flex flex-col items-center">
        <div className="h-2 bg-gray-700 rounded w-16 mb-3"></div>
        <div className="h-2 bg-gray-700 rounded w-48 mb-2"></div>
        <div className="h-2 bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="max-w-lg mx-auto mt-4 mb-8 px-4 relative z-10">
      <div className="bg-gray-800/40 rounded-xl shadow-lg p-5 text-center border border-gray-700/50 backdrop-blur-md">
        
        {/* Badge Pequeno */}
        <span className="inline-block px-2 py-px bg-blue-500/10 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-widest mb-3 border border-blue-500/20">
          Palavra do Dia
        </span>

        {/* Conteúdo */}
        <div>
          <p className="font-serif text-base md:text-lg leading-snug text-gray-100 italic mb-2">
            "{message.verse}"
          </p>
          <p className="text-blue-400 font-semibold text-xs md:text-sm mb-3 tracking-wide">
            {message.reference}
          </p>
        </div>
        
        {/* Divisor Sutil */}
        <div className="w-12 h-px bg-gray-600/30 mx-auto mb-3"></div>
        
        {/* Pensamento */}
        <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed">
          {message.thought}
        </p>
      </div>
    </div>
  );
};

export default DailyMessage;