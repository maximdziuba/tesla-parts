import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Pencil, Check, X, FileText } from 'lucide-react';

interface Page {
    id: number;
    slug: string;
    title: string;
    content: string;
    is_published: boolean;
    location: string;
}

export const PagesManager: React.FC = () => {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getPages();
            setPages(data);
        } catch (e) {
            console.error('Failed to load pages', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingPage) return;
        try {
            await ApiService.updatePage(editingPage.id, {
                slug: editingPage.slug,
                title: editingPage.title,
                content: editingPage.content,
                is_published: editingPage.is_published,
                location: editingPage.location
            });
            setEditingPage(null);
            loadPages();
        } catch (e) {
            alert('Не вдалося оновити сторінку');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Завантаження...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Сторінки</h2>
            </div>

            <div className="space-y-4">
                {pages.map(page => (
                    <div key={page.id} className="border border-gray-200 rounded-lg p-4">
                        {editingPage?.id === page.id ? (
                            <div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                                        <input
                                            type="text"
                                            value={editingPage.title}
                                            onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                                            className="w-full border rounded-md px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editingPage.is_published}
                                                onChange={e => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                                                className="h-4 w-4"
                                            />
                                            <span className="text-sm text-gray-700">Опубліковано</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Контент</label>
                                    <textarea
                                        value={editingPage.content}
                                        onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                                        className="w-full border rounded-md px-3 py-2 h-32"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdate}
                                        className="text-green-600 hover:bg-green-50 p-2 rounded"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button
                                        onClick={() => setEditingPage(null)}
                                        className="text-gray-400 hover:bg-gray-100 p-2 rounded"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-gray-400" size={24} />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{page.title}</h3>
                                        <p className="text-sm text-gray-500">/{page.slug}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {page.is_published ? 'Опубліковано' : 'Чернетка'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingPage(page)}
                                        className="text-gray-400 hover:text-blue-500 p-2 rounded"
                                        title="Редагувати"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {pages.length === 0 && !isCreating && (
                    <p className="text-center text-gray-500 py-8">Немає сторінок. Створіть першу!</p>
                )}
            </div>
        </div>
    );
};
