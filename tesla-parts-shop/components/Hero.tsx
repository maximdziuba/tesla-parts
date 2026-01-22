import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Category } from '../types';

interface HeroProps {
  onSelectCategory: (category: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="mb-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-tesla-dark">Оберіть модель вашого Tesla</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category.name)}
            className="group relative h-64 md:h-96 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all z-10" />
            <img
              src={category.image || 'https://via.placeholder.com/800'}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 text-white w-full">
              <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
              {/* <p className="text-gray-200 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"> */}
                {/* {category.subcategories?.length || 0} підкатегорій */}
              {/* </p> */}
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                Переглянути каталог <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {categories.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          Завантаження категорій...
        </div>
      )}
    </div>
  );
};

export default Hero;