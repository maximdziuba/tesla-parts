import React, { useState } from 'react';
import { PagesManager } from '../components/PagesManager';
import { FileText } from 'lucide-react';

export const CMSPage: React.FC = () => {
    const [activeTab] = useState<'pages'>('pages');

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління контентом</h1>

            <div className="flex gap-4 mb-6">
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition bg-red-600 text-white"
                >
                    <FileText size={20} />
                    Сторінки
                </button>
            </div>

            {activeTab === 'pages' && <PagesManager />}
        </div>
    );
};

export default CMSPage;
