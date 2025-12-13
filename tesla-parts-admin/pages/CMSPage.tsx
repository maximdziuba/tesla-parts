import React, { useState } from 'react';
import { PagesManager } from '../components/PagesManager';
import { LabelsManager } from '../components/LabelsManager';
import { FileText, Tag } from 'lucide-react';

export const CMSPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pages' | 'labels'>('pages');

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління контентом</h1>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('pages')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'pages'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <FileText size={20} />
                    Сторінки
                </button>
                <button
                    onClick={() => setActiveTab('labels')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'labels'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Tag size={20} />
                    Налаштування
                </button>
            </div>

            {activeTab === 'pages' && <PagesManager />}
            {activeTab === 'labels' && <LabelsManager />}
        </div>
    );
};

export default CMSPage;
