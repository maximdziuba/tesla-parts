import React, { useState } from 'react';
import { PagesManager } from '../components/PagesManager';
import { FileText } from 'lucide-react';

export const CMSPage: React.FC = () => {
    const [activeTab] = useState<'pages'>('pages');

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління контентом</h1>
            {activeTab === 'pages' && <PagesManager />}
        </div>
    );
};

export default CMSPage;
