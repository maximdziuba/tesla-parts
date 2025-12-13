import React from 'react';
import { Subcategory } from '../types';
import { ChevronRight, Folder, Image as ImageIcon } from 'lucide-react';

interface SubcategoryCardProps {
    subcategory: Subcategory;
    onClick: () => void;
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ subcategory, onClick }) => {
    const hasChildren = subcategory.subcategories && subcategory.subcategories.length > 0;
    // We might not have products count easily available if not loaded, but we can check subcategories

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group overflow-hidden flex items-center p-6"
        >
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden mr-6">
                {subcategory.image ? (
                    <img src={subcategory.image} alt={subcategory.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Folder size={32} />
                    </div>
                )}
            </div>

            <div className="flex-grow">
                <h3 className="font-bold text-xl text-gray-900 group-hover:text-tesla-red transition-colors">{subcategory.name}</h3>
                {subcategory.code && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-2">
                        {subcategory.code}
                    </span>
                )}
            </div>

            <div className="text-gray-400 group-hover:text-tesla-red transition-colors">
                <ChevronRight size={24} />
            </div>
        </div>
    );
};

export default SubcategoryCard;
