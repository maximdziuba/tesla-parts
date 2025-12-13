import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { ArrowLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProductForm: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Model 3',
        priceUAH: 0,
        image: '',
        description: '',
        inStock: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await ApiService.createProduct({ ...formData, file });
            navigate('/products');
        } catch (e) {
            console.error(e);
            alert('Не вдалося створити товар');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link to="/products" className="inline-flex items-center text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={20} className="mr-2" />
                    Назад до списку
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">Додати Новий Товар</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Назва Товару</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Наприклад: Передній бампер"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            >
                                <option value="Model 3">Model 3</option>
                                <option value="Model S">Model S</option>
                                <option value="Model X">Model X</option>
                                <option value="Model Y">Model Y</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ціна (UAH)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.priceUAH}
                                onChange={e => setFormData({ ...formData, priceUAH: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Зображення</label>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setFile(e.target.files[0]);
                                            setFormData({ ...formData, image: '' }); // Clear URL if file selected
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center">
                                    <Upload className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-gray-600">
                                        {file ? file.name : 'Натисніть щоб завантажити файл'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-center text-sm text-gray-500">- АБО -</div>

                            <input
                                type="url"
                                value={formData.image}
                                onChange={e => {
                                    setFormData({ ...formData, image: e.target.value });
                                    setFile(null); // Clear file if URL entered
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Вставте пряме посилання на зображення"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Детальний опис товару..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="inStock"
                            checked={formData.inStock}
                            onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                            В наявності
                        </label>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Створення...' : 'Створити Товар'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
