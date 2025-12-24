import React from 'react';
import { Subcategory } from '../types';
import { ChevronRight, Folder } from 'lucide-react';

interface SubcategoryCardProps {
    subcategory: Subcategory;
    onClick: () => void;
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ subcategory, onClick }) => {
    return (
        <div
            onClick={onClick}
            // ЗМІНА 1: p-3 на мобільних, p-6 на десктопі (sm:)
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group overflow-hidden flex items-center p-3 sm:p-6"
        >
            {/* ЗМІНА 2: Адаптивні розміри блоку картинки */}
            {/* Мобільний: w-24 h-16 mr-3 */}
            {/* Десктоп (sm+): w-48 h-[108px] mr-6 */}
            <div className="w-24 h-16 sm:w-48 sm:h-[108px] bg-gray-100 flex-shrink-0 overflow-hidden mr-3 sm:mr-6 flex items-center justify-center">
                {subcategory.image ? (
                    <img 
                        src={subcategory.image} 
                        alt={subcategory.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {/* Іконка теж адаптивна через класи */}
                        <Folder className="w-6 h-6 sm:w-10 sm:h-10" />
                    </div>
                )}
            </div>

            <div className="flex-grow min-w-0">
                {/* ЗМІНА 3: text-sm на мобільних, text-lg на десктопі */}
                {/* leading-tight допомагає тексту займати менше висоти при переносі */}
                <h3 className="font-bold text-sm sm:text-lg text-gray-900 group-hover:text-tesla-red transition-colors break-words pr-2 leading-tight">
                    {subcategory.name}
                </h3>
                {subcategory.code && (
                    <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1 sm:mt-2">
                        {subcategory.code}
                    </span>
                )}
            </div>

            <div className="text-gray-400 group-hover:text-tesla-red transition-colors flex-shrink-0 ml-2">
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
        </div>
    );
};

export default SubcategoryCard;