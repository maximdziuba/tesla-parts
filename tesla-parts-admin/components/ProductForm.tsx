import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiService } from '../services/api';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Category, Subcategory } from '../types';

interface CategoryAssignment {
    id: string;
    categoryId: number | null;
    subcategoryPath: number[];
}

const generateAssignmentId = () => `assignment-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const createEmptyAssignment = (): CategoryAssignment => ({
    id: generateAssignmentId(),
    categoryId: null,
    subcategoryPath: [],
});

export const ProductForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [keptImages, setKeptImages] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryAssignments, setCategoryAssignments] = useState<CategoryAssignment[]>(() => [createEmptyAssignment()]);
    const [pendingSubcategoryIds, setPendingSubcategoryIds] = useState<number[] | null>(null);

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

    useEffect(() => {
        if (!isEditMode) {
            setCategoryAssignments([createEmptyAssignment()]);
            setPendingSubcategoryIds(null);
        }
    }, [isEditMode]);

    const loadProduct = async (productId: string) => {
        try {
            const product = await ApiService.getProduct(productId);
            setFormData({
                name: product.name,
                category: product.category || '',
                subcategory_id: product.subcategory_id,
                priceUAH: product.priceUAH,
                priceUSD: product.priceUSD || 0,
                image: product.image,
                description: product.description,
                inStock: product.inStock,
                detail_number: product.detail_number || ''
            });

            if (product.images && product.images.length > 0) {
                setKeptImages(product.images);
            } else if (product.image) {
                setKeptImages([product.image]);
            } else {
                setKeptImages([]);
            }

            const productSubcategoryIds =
                (product.subcategory_ids && product.subcategory_ids.length > 0)
                    ? product.subcategory_ids
                    : product.subcategory_id
                        ? [product.subcategory_id]
                        : [];
            setPendingSubcategoryIds(productSubcategoryIds);
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
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    const subcategoryPathMap = useMemo(() => {
        const map = new Map<number, { categoryId: number; path: number[] }>();
        const traverse = (subs: Subcategory[] | undefined, path: number[], categoryId: number) => {
            if (!subs) return;
            subs.forEach(sub => {
                const currentPath = [...path, sub.id];
                map.set(sub.id, { categoryId, path: currentPath });
                if (sub.subcategories && sub.subcategories.length > 0) {
                    traverse(sub.subcategories, currentPath, categoryId);
                }
            });
        };
        categories.forEach(category => {
            traverse(category.subcategories, [], category.id);
        });
        return map;
    }, [categories]);

    const buildAssignmentsFromIds = (ids: number[]): CategoryAssignment[] => {
        const uniqueIds = Array.from(new Set(ids));
        const assignments: CategoryAssignment[] = [];
        uniqueIds.forEach(subId => {
            const info = subcategoryPathMap.get(subId);
            if (!info) return;
            assignments.push({
                id: generateAssignmentId(),
                categoryId: info.categoryId,
                subcategoryPath: [...info.path],
            });
        });
        return assignments.length ? assignments : [createEmptyAssignment()];
    };

    useEffect(() => {
        if (!pendingSubcategoryIds || pendingSubcategoryIds.length === 0 || categories.length === 0) {
            return;
        }
        const assignments = buildAssignmentsFromIds(pendingSubcategoryIds);
        if (assignments.length) {
            setCategoryAssignments(assignments);
        }
    }, [pendingSubcategoryIds, categories, subcategoryPathMap]);

    useEffect(() => {
        const names = categoryAssignments
            .map(assignment => {
                if (assignment.categoryId === null) return null;
                const cat = categories.find(c => c.id === assignment.categoryId);
                return cat?.name || null;
            })
            .filter((name): name is string => Boolean(name));
        const uniqueNames = Array.from(new Set(names));
        const combined = uniqueNames.join(', ');
        setFormData(prev => {
            if (prev.category === combined) {
                return prev;
            }
            return { ...prev, category: combined };
        });
    }, [categoryAssignments, categories]);

    const handleAssignmentCategoryChange = (assignmentId: string, value: string) => {
        const numericValue = value ? Number(value) : null;
        setCategoryAssignments(prev =>
            prev.map(assignment =>
                assignment.id === assignmentId
                    ? { ...assignment, categoryId: numericValue, subcategoryPath: [] }
                    : assignment
            )
        );
    };

    const handleAssignmentSubcategoryChange = (assignmentId: string, level: number, value: string) => {
        setCategoryAssignments(prev =>
            prev.map(assignment => {
                if (assignment.id !== assignmentId) return assignment;
                const newPath = [...assignment.subcategoryPath];
                if (!value) {
                    newPath.splice(level);
                } else {
                    newPath[level] = Number(value);
                    newPath.splice(level + 1);
                }
                return { ...assignment, subcategoryPath: newPath };
            })
        );
    };

    const getSubcategoriesForAssignmentLevel = (assignment: CategoryAssignment, level: number): Subcategory[] => {
        if (assignment.categoryId === null) return [];
        const category = categories.find(c => c.id === assignment.categoryId);
        if (!category) return [];

        let currentSubs = category.subcategories || [];
        for (let i = 0; i < level; i++) {
            const id = assignment.subcategoryPath[i];
            if (!id) return [];
            const found = currentSubs.find(sub => sub.id === id);
            if (!found || !found.subcategories) {
                return [];
            }
            currentSubs = found.subcategories;
        }
        return currentSubs || [];
    };

    const renderSubcategorySelectors = (assignment: CategoryAssignment) => {
        if (assignment.categoryId === null) {
            return <p className="text-sm text-gray-500 mt-2">Оберіть категорію, щоб вибрати підкатегорії</p>;
        }

        const dropdowns: React.ReactNode[] = [];
        let level = 0;
        let continueLoop = true;

        while (continueLoop) {
            const subs = getSubcategoriesForAssignmentLevel(assignment, level);
            if (subs.length === 0) {
                if (level === 0) {
                    dropdowns.push(
                        <p key={`${assignment.id}-empty`} className="text-sm text-gray-500 mt-2">
                            У цій категорії ще немає підкатегорій
                        </p>
                    );
                }
                break;
            }

            const currentSelection = assignment.subcategoryPath[level] ?? '';
            dropdowns.push(
                <div key={`${assignment.id}-level-${level}`} className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {level === 0 ? "Підкатегорія" : `Підкатегорія (рівень ${level + 1})`}
                    </label>
                    <select
                        value={currentSelection}
                        onChange={e => handleAssignmentSubcategoryChange(assignment.id, level, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                        <option value="">Оберіть підкатегорію</option>
                        {subs.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                </div>
            );

            if (currentSelection) {
                const selectedSub = subs.find(sub => sub.id === Number(currentSelection));
                if (selectedSub && selectedSub.subcategories && selectedSub.subcategories.length > 0) {
                    level++;
                } else {
                    continueLoop = false;
                }
            } else {
                continueLoop = false;
            }
        }

        return dropdowns;
    };

    const handleAddAssignment = () => {
        setCategoryAssignments(prev => [...prev, createEmptyAssignment()]);
    };

    const handleRemoveAssignment = (assignmentId: string) => {
        setCategoryAssignments(prev => {
            if (prev.length <= 1) {
                return prev;
            }
            return prev.filter(assignment => assignment.id !== assignmentId);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const hasInvalidAssignment = categoryAssignments.some(
                assignment => assignment.categoryId === null || assignment.subcategoryPath.length === 0
            );
            if (hasInvalidAssignment) {
                alert('Заповніть категорію та підкатегорію для кожного блоку або видаліть зайві');
                setLoading(false);
                return;
            }

            const selectedSubcategoryIds = categoryAssignments
                .map(assignment => assignment.subcategoryPath[assignment.subcategoryPath.length - 1])
                .filter((id): id is number => typeof id === 'number');
            const uniqueSubcategoryIds = Array.from(new Set(selectedSubcategoryIds));

            if (uniqueSubcategoryIds.length === 0) {
                alert('Оберіть хоча б одну підкатегорію');
                setLoading(false);
                return;
            }

            const categoryNames = Array.from(
                new Set(
                    categoryAssignments
                        .map(assignment => {
                            if (assignment.categoryId === null) return null;
                            const cat = categories.find(c => c.id === assignment.categoryId);
                            return cat?.name || null;
                        })
                        .filter((name): name is string => Boolean(name))
                )
            );
            const categoryLabel = categoryNames.join(', ');
            const primarySubcategoryId = uniqueSubcategoryIds[0];

            const basePayload = {
                ...formData,
                category: categoryLabel || formData.category,
                subcategory_id: primarySubcategoryId,
                subcategory_ids: uniqueSubcategoryIds,
                files,
            };

            if (isEditMode && id) {
                await ApiService.updateProduct(id, { ...basePayload, kept_images: keptImages });
            } else {
                await ApiService.createProduct(basePayload);
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

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Категорії</label>
                                <p className="text-xs text-gray-500 mt-1">Додайте одну або декілька категорій та відповідні підкатегорії</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddAssignment}
                                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                <Plus size={16} />
                                Додати
                            </button>
                        </div>
                        <div className="space-y-4">
                            {categoryAssignments.map((assignment, index) => (
                                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Категорія #{index + 1}
                                        </span>
                                        {categoryAssignments.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAssignment(assignment.id)}
                                                className="text-gray-400 hover:text-red-500 transition"
                                                title="Видалити категорію"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
                                    <select
                                        value={assignment.categoryId ?? ''}
                                        onChange={e => handleAssignmentCategoryChange(assignment.id, e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                    >
                                        <option value="">Оберіть категорію</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {renderSubcategorySelectors(assignment)}
                                </div>
                            ))}
                            {categoryAssignments.length === 0 && (
                                <div className="text-sm text-gray-500">Додайте принаймні одну категорію</div>
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
