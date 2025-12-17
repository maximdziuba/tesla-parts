import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Plus, Pencil, Trash2, Check, X, FileText, Eye, EyeOff } from 'lucide-react';

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
    const [newPage, setNewPage] = useState<Partial<Page>>({
        slug: '',
        title: '',
        content: '',
        is_published: true,
        location: 'footer'
    });

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

    const handleCreate = async () => {
        if (!newPage.slug || !newPage.title || !newPage.content) {
            alert('Заповніть всі обов\'язкові поля');
            return;
        }
        try {
            await ApiService.createPage({
                slug: newPage.slug,
                title: newPage.title,
                content: newPage.content,
                is_published: newPage.is_published,
                location: newPage.location
            });
            setNewPage({ slug: '', title: '', content: '', is_published: true, location: 'footer' });
            setIsCreating(false);
            loadPages();
        } catch (e) {
            alert('Не вдалося створити сторінку');
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

    const handleDelete = async (id: number) => {
        if (!window.confirm('Ви впевнені, що хочете видалити цю сторінку?')) return;
        try {
            await ApiService.deletePage(id);
            loadPages();
        } catch (e) {
            alert('Не вдалося видалити сторінку');
        }
    };

    const togglePublished = async (page: Page) => {
        try {
            await ApiService.updatePage(page.id, { is_published: !page.is_published });
            loadPages();
        } catch (e) {
            alert('Не вдалося змінити статус публікації');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Завантаження...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Сторінки</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                    <Plus size={20} />
                    Нова сторінка
                </button>
            </div>

            {isCreating && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">Нова сторінка</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                value={newPage.slug}
                                onChange={e => setNewPage({ ...newPage, slug: e.target.value })}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="about-us"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                            <input
                                type="text"
                                value={newPage.title}
                                onChange={e => setNewPage({ ...newPage, title: e.target.value })}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="Про нас"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Контент</label>
                        <textarea
                            value={newPage.content}
                            onChange={e => setNewPage({ ...newPage, content: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 h-32"
                            placeholder="Вміст сторінки..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            Створити
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {pages.map(page => (
                    <div key={page.id} className="border border-gray-200 rounded-lg p-4">
                        {editingPage?.id === page.id ? (
                            <div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                        <input
                                            type="text"
                                            value={editingPage.slug}
                                            onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                                            className="w-full border rounded-md px-3 py-2"
                                        />
                                    </div>
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Розташування</label>
                                        <select
                                            value={editingPage.location}
                                            onChange={e => setEditingPage({ ...editingPage, location: e.target.value })}
                                            className="w-full border rounded-md px-3 py-2"
                                        >
                                            <option value="header">Хедер</option>
                                            <option value="footer">Футер</option>
                                            <option value="both">Обидва</option>
                                            <option value="none">Немає</option>
                                        </select>
                                    </div>
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
                                        <p className="text-sm text-gray-500">/{page.slug} • {page.location}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {page.is_published ? 'Опубліковано' : 'Чернетка'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePublished(page)}
                                        className={`p-2 rounded hover:bg-gray-100 ${page.is_published ? 'text-green-600' : 'text-gray-400'}`}
                                        title={page.is_published ? 'Сховати' : 'Опублікувати'}
                                    >
                                        {page.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => setEditingPage(page)}
                                        className="text-gray-400 hover:text-blue-500 p-2 rounded"
                                        title="Редагувати"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(page.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                        title="Видалити"
                                    >
                                        <Trash2 size={18} />
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
