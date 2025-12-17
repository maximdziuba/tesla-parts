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
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group overflow-hidden flex items-center p-6"
        >
            <div className="w-48 h-[108px] bg-gray-100 flex-shrink-0 overflow-hidden mr-6 flex items-center justify-center">
                {subcategory.image ? (
                    <img 
                        src={subcategory.image} 
                        alt={subcategory.name} 
                        // Keeping object-cover to fill the space
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {/* Increased icon size slightly to match larger container */}
                        <Folder size={40} />
                    </div>
                )}
            </div>

            <div className="flex-grow">
                {/* Increased font size slightly for better hierarchy with larger image */}
                <h3 className="font-bold text-2xl text-gray-900 group-hover:text-tesla-red transition-colors">{subcategory.name}</h3>
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