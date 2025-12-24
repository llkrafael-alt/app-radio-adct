import React, { useState, useEffect, useCallback } from 'react';

interface HeroCarouselProps {
  images: string[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images]);

  const prevSlide = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
          <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Conectando...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black group select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Slides */}
      {images.map((img, index) => (
        <div
          key={`${img}-${index}`}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out flex items-center justify-center ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Camada 1: Fundo Desfocado (Preenche a tela toda) */}
          <div 
            className="absolute inset-0 bg-center bg-cover scale-110 blur-2xl opacity-40 grayscale-[20%]"
            style={{ backgroundImage: `url(${img})` }}
          ></div>

          {/* Camada 2: Imagem Principal (Sem cortes, modo contain) */}
          <img
            src={img}
            alt={`Destaque ${index + 1}`}
            className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            draggable={false}
            loading={index === 0 ? "eager" : "lazy"}
          />

          {/* Overlay Gradiente para legibilidade do Header e Player */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-20 pointer-events-none"></div>
        </div>
      ))}

      {/* Controles de Navegação (Desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/20 text-white/40 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/20 text-white/40 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:block"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicadores de Progresso na base */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
            className="group py-2"
          >
            <div className={`h-1.5 rounded-full transition-all duration-700 ${
              index === currentIndex ? 'bg-white w-10 shadow-[0_0_10px_white]' : 'bg-white/20 w-3 hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;