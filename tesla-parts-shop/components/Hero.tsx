import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface HeroProps {
  onSelectCategory: (category: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const data = await api.getLabels();
        setCategories(data);
      } catch (e) {
        console.error("Failed to fetch labels", e);
        // Fallback to default models if API fails or returns empty
        setCategories(['Model 3', 'Model S', 'Model X']);
      }
    };
    fetchLabels();
  }, []);

  const getModelImage = (model: string) => {
    switch (model) {
      case 'Model 3': return 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
      case 'Model S': return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
      case 'Model X': return 'https://images.unsplash.com/photo-1619149666087-9c9f22573210?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
      case 'Model Y': return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; // Reusing Model S image for now or find better
      default: return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
    }
  };

  return (
    <div className="mb-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-tesla-dark">Оберіть модель вашого Tesla</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category}
            onClick={() => onSelectCategory(category)}
            className="group relative h-64 md:h-96 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all z-10" />
            <img
              src={getModelImage(category)}
              alt={category}
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
              <h3 className="text-2xl font-bold mb-1">{category}</h3>
              <p className="text-gray-200 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">Запчастини та аксесуари</p>
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