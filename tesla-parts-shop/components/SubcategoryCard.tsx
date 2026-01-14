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
            // ЗМІНА 1: hover:shadow-md -> xl:hover:shadow-md (тінь тільки на ПК)
            // ЗМІНА 2: додано select-none (щоб текст не виділявся при скролі)
            className="bg-white rounded-xl shadow-sm border border-gray-100 xl:hover:shadow-md transition-all cursor-pointer group overflow-hidden flex items-center p-3 sm:p-6 select-none"
            // ЗМІНА 3: прибирає стандартну сіру підсвітку браузера на мобільному
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            <div className="w-24 h-16 sm:w-48 sm:h-[108px] bg-gray-100 flex-shrink-0 overflow-hidden mr-3 sm:mr-6 flex items-center justify-center">
                {subcategory.image ? (
                    <img 
                        src={subcategory.image} 
                        alt={subcategory.name} 
                        // ЗМІНА 4: group-hover -> xl:group-hover (зум картинки тільки на ПК)
                        className="w-full h-full object-cover xl:group-hover:scale-105 transition-transform" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Folder className="w-6 h-6 sm:w-10 sm:h-10" />
                    </div>
                )}
            </div>

            <div className="flex-grow min-w-0">
                {/* ЗМІНА 5: 
                    - xl:group-hover:text-tesla-red (червоний при наведенні ТІЛЬКИ на ПК)
                    - active:text-tesla-red (червоний при натисканні на мобільному)
                */}
                <h3 className="font-bold text-sm sm:text-lg text-gray-900 active:text-tesla-red xl:group-hover:text-tesla-red transition-colors break-words pr-2 leading-tight">
                    {subcategory.name}
                </h3>
                {subcategory.code && (
                    <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1 sm:mt-2">
                        {subcategory.code}
                    </span>
                )}
            </div>

            {/* ЗМІНА 6: Те саме для стрілочки - тільки active та xl:hover */}
            <div className="text-gray-400 active:text-tesla-red xl:group-hover:text-tesla-red transition-colors flex-shrink-0 ml-2">
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
        </div>
    );
};

export default SubcategoryCard;