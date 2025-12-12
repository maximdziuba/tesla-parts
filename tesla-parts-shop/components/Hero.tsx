import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onSelectCategory: (category: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSelectCategory }) => {
  const models = [
    { id: 'Model 3', title: 'Model 3', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', subtitle: 'Найпопулярніші запчастини' },
    { id: 'Model S', title: 'Model S', image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', subtitle: 'Преміум компоненти' },
    { id: 'Model X', title: 'Model X', image: 'https://images.unsplash.com/photo-1619149666087-9c9f22573210?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', subtitle: 'Аксесуари та деталі' },
  ];

  return (
    <div className="mb-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-tesla-dark">Оберіть модель вашого Tesla</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((model) => (
          <div 
            key={model.id}
            onClick={() => onSelectCategory(model.id)}
            className="group relative h-64 md:h-96 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all z-10" />
            <img 
              src={model.image} 
              alt={model.title} 
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
              <h3 className="text-2xl font-bold mb-1">{model.title}</h3>
              <p className="text-gray-200 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">{model.subtitle}</p>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                Переглянути каталог <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hero;