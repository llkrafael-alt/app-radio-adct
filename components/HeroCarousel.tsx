import React, { useState, useEffect, useCallback } from 'react';

interface HeroCarouselProps {
  images: string[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Proteção contra mudanças dinâmicas na lista de imagens
  // Se a lista atualizar e tiver menos imagens que o índice atual, volta para a primeira
  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images, currentIndex]);

  // Função para avançar
  const nextSlide = useCallback(() => {
    // Verifica se images existe e tem tamanho > 0 para evitar divisão por zero
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images]);

  // Função para voltar
  const prevSlide = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images]);

  // Efeito de Autoplay (só roda se não estiver pausado)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  if (!images || images.length === 0) {
    return <div className="w-full h-full bg-black" />;
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-black transition-all duration-500 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
    >
      
      {/* Images */}
      {images.map((img, index) => (
        <div
          key={`${img}-${index}`} // Key composta para ajudar o React a identificar mudanças
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Imagem Principal - Sem sobreposições, sem filtros */}
          <img
            src={img}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      ))}

      {/* Navigation Arrows (Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Impede que o clique pause/despause conflite com a navegação
          prevSlide();
        }}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10"
        aria-label="Imagem anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Navigation Arrows (Right) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/10"
        aria-label="Próxima imagem"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Pause Indicator */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-300 pointer-events-none ${isPaused ? 'opacity-100' : 'opacity-0'}`}>
         <div className="bg-black/40 backdrop-blur-md p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white/80">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
         </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white w-6 shadow-glow' : 'bg-white/40 w-1.5 hover:bg-white/80'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;