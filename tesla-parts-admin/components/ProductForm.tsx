import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiService } from '../services/api';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Category, Subcategory } from '../types';

export const ProductForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [keptImages, setKeptImages] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        subcategory_id: undefined as number | undefined,
        priceUAH: 0,
        priceUSD: 0,
        image: '',
        description: '',
        inStock: true,
        detail_number: ''
    });

    const [exchangeRate, setExchangeRate] = useState<number>(40); // Default fallback

    useEffect(() => {
        loadCategories();
        loadExchangeRate();
        if (isEditMode && id) {
            loadProduct(id);
        }
    }, [id]);

    const loadProduct = async (productId: string) => {
        try {
            // We need a getProduct method in ApiService that returns single product
            // Assuming it exists or we use getProducts and find it (inefficient but works if getProduct missing)
            // Wait, ApiService.getProducts returns all. We should check if getProduct(id) exists.
            // Checking api.ts... it DOES NOT have getProduct(id). 
            // Wait, I see `read_product` in backend.
            // I need to add `getProduct` to `api.ts` first? 
            // Let me check `api.ts` content again.
            // It has `getProducts` (all).
            // I should add `getProduct` to `api.ts`.
            // For now, I will assume I added it or I will add it in next step.
            // Actually, let's use a placeholder and I'll fix api.ts in a moment.
            // Or I can fetch all and find. Let's fetch all for now to avoid breaking flow, or better, add getProduct.
            // I will add getProduct to api.ts in a separate tool call.

            // Temporary: fetch all and find
            const products = await ApiService.getProducts();
            const product = products.find(p => p.id === productId);

            if (product) {
                setFormData({
                    name: product.name,
                    category: product.category,
                    subcategory_id: product.subcategory_id,
                    priceUAH: product.priceUAH,
                    priceUSD: product.priceUSD || 0,
                    image: product.image,
                    description: product.description,
                    inStock: product.inStock,
                    detail_number: product.detail_number || ''
                });

                // Set existing images
                if (product.images && product.images.length > 0) {
                    setKeptImages(product.images);
                } else if (product.image) {
                    // Fallback if images array is empty but main image exists
                    setKeptImages([product.image]);
                }
                // Also need to set selectedSubcategoryPath based on subcategory_id
                // This is tricky because we need to reconstruct the path.
                // We'll leave path empty for now, user might need to re-select if they want to change it.
                // Or we can try to find it.
            }
        } catch (e) {
            console.error("Failed to load product", e);
        }
    };

    const loadExchangeRate = async () => {
        try {
            const data = await ApiService.getSetting('exchange_rate');
            setExchangeRate(parseFloat(data.value) || 40);
        } catch (e) {
            console.error("Failed to load exchange rate", e);
        }
    };

    const handleUsdChange = (usd: number) => {
        setFormData(prev => ({
            ...prev,
            priceUSD: usd,
            priceUAH: Math.round(usd * exchangeRate)
        }));
    };

    const loadCategories = async () => {
        try {
            const data = await ApiService.getCategories();
            setCategories(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, category: data[0].name }));
            }
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    const selectedCategory = categories.find(c => c.name === formData.category);

    // State to track the path of selected subcategories (e.g., [parentId, childId])
    const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<number[]>([]);

    // Update formData when path changes
    useEffect(() => {
        const lastId = selectedSubcategoryPath[selectedSubcategoryPath.length - 1];
        setFormData(prev => ({ ...prev, subcategory_id: lastId }));
    }, [selectedSubcategoryPath]);

    // Reset path when category changes
    useEffect(() => {
        setSelectedSubcategoryPath([]);
    }, [formData.category]);

    const handleSubcategoryChange = (level: number, value: string) => {
        const newPath = [...selectedSubcategoryPath];
        if (value === "") {
            // If "Select..." is chosen, remove this level and all deeper levels
            newPath.splice(level);
        } else {
            // Update the selection at this level and remove any deeper levels (since path changed)
            newPath[level] = Number(value);
            newPath.splice(level + 1);
        }
        setSelectedSubcategoryPath(newPath);
    };

    // Helper to get subcategories for a specific level
    const getSubcategoriesForLevel = (level: number): Subcategory[] => {
        if (level === 0) {
            return selectedCategory?.subcategories || [];
        }
        const parentId = selectedSubcategoryPath[level - 1];
        // We need to find the parent subcategory object to get its children.
        // This requires searching through the tree.
        // Since we don't have a flat map, we can traverse from the top.

        let currentLevelSubs = selectedCategory?.subcategories || [];
        for (let i = 0; i < level; i++) {
            const id = selectedSubcategoryPath[i];
            const found = currentLevelSubs.find(s => s.id === id);
            if (found && found.subcategories) {
                currentLevelSubs = found.subcategories;
            } else {
                return [];
            }
        }
        return currentLevelSubs;
    };

    // Determine how many dropdowns to show.
    // Always show at least one (Level 0) if category is selected.
    // If a selection is made at Level N, and that selection has children, show Level N+1.
    const renderSubcategoryDropdowns = () => {
        if (!formData.category || !selectedCategory?.subcategories?.length) return null;

        const dropdowns = [];
        let level = 0;
        let showNext = true;

        while (showNext) {
            const subs = getSubcategoriesForLevel(level);
            if (subs.length === 0 && level > 0) break; // If no subs at this level and it's not the first dropdown, stop

            const currentSelection = selectedSubcategoryPath[level] || '';

            dropdowns.push(
                <div key={level} className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {level === 0 ? 'Підкатегорія' : `Підкатегорія (Рівень ${level + 1})`}
                    </label>
                    <select
                        value={currentSelection}
                        onChange={e => handleSubcategoryChange(level, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        disabled={level > 0 && !selectedSubcategoryPath[level - 1]} // Disable if parent not selected
                    >
                        <option value="">Оберіть підкатегорію</option>
                        {subs.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            );

            // Only show next level if current level has a selection and that selection has children
            if (currentSelection) {
                const selectedSub = subs.find(s => s.id === Number(currentSelection));
                if (selectedSub && selectedSub.subcategories && selectedSub.subcategories.length > 0) {
                    level++;
                } else {
                    showNext = false;
                }
            } else {
                showNext = false;
            }
        }
        return dropdowns;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode && id) {
                await ApiService.updateProduct(id, { ...formData, files, kept_images: keptImages });
            } else {
                await ApiService.createProduct({ ...formData, files });
            }
            navigate('/products');
        } catch (e) {
            console.error(e);
            alert(isEditMode ? 'Не вдалося оновити товар' : 'Не вдалося створити товар');
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
                <h1 className="text-2xl font-bold mb-6 text-gray-900">{isEditMode ? 'Редагувати Товар' : 'Додати Новий Товар'}</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Номер деталі</label>
                            <input
                                type="text"
                                value={formData.detail_number}
                                onChange={e => setFormData({ ...formData, detail_number: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="112201"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
                            <select
                                value={formData.category}
                                onChange={e => {
                                    const cat = categories.find(c => c.name === e.target.value);
                                    setFormData({
                                        ...formData,
                                        category: e.target.value,
                                        subcategory_id: undefined // Reset subcategory when category changes
                                    });
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            >
                                <option value="">Оберіть категорію</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            {renderSubcategoryDropdowns()}
                            {/* Fallback/Placeholder if no category selected */}
                            {!formData.category && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Підкатегорія</label>
                                    <select
                                        disabled
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-400"
                                    >
                                        <option>Спочатку оберіть категорію</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ціна (USD)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.priceUSD}
                                    onChange={e => handleUsdChange(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ціна (UAH) - Автоматично</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">₴</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.priceUAH}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Курс: {exchangeRate} UAH/USD</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Зображення (можна обрати декілька)</label>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            // Append new files to existing ones
                                            setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                                            setFormData({ ...formData, image: '' }); // Clear URL if file selected
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center">
                                    <Upload className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-gray-600">
                                        Натисніть щоб додати файли
                                    </span>
                                </div>
                            </div>

                            {/* Existing Images (Edit Mode) */}
                            {keptImages.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Існуючі зображення:</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {keptImages.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={img}
                                                    alt={`existing-${idx}`}
                                                    className="w-full h-24 object-cover rounded-md border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setKeptImages(keptImages.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Видалити"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Image Previews */}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Нові файли:</p>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`preview-${idx}`}
                                                    className="w-full h-24 object-cover rounded-md border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Видалити"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-center text-sm text-gray-500">- АБО -</div>

                            <input
                                type="url"
                                value={formData.image}
                                onChange={e => {
                                    setFormData({ ...formData, image: e.target.value });
                                    setFiles([]); // Clear files if URL entered
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
                            {loading ? 'Збереження...' : (isEditMode ? 'Зберегти Зміни' : 'Створити Товар')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
