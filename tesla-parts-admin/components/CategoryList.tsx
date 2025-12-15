import React, { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';
import { Category, Subcategory } from '../types';
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    FolderPlus,
    Folder,
    Image as ImageIcon,
    CornerDownRight,
    Pencil,
    Check,
    X,
    ArrowLeftRight,
} from 'lucide-react';

interface SubcategoryItemProps {
    subcategory: Subcategory;
    categoryId: number;
    categories: Category[];
    level?: number;
    onDelete: (id: number) => void;
    onCreate: (categoryId: number, name: string, image: string, code: string, parentId: number, file?: File) => void;
    onEdit: (id: number, name: string, image: string, code: string, parentId?: number, file?: File) => void;
    onTransfer: (id: number, targetCategoryId: number, targetParentId: number | undefined, mode: 'move' | 'copy') => Promise<void>;
}

const collectDescendantIds = (sub: Subcategory): number[] => {
    if (!sub.subcategories || sub.subcategories.length === 0) return [];
    const ids: number[] = [];
    sub.subcategories.forEach(child => {
        ids.push(child.id, ...collectDescendantIds(child));
    });
    return ids;
};

const flattenSubcategoriesForSelect = (
    subs: Subcategory[] | undefined,
    excludeIds: Set<number>,
    depth = 0
): { id: number; label: string }[] => {
    if (!subs) return [];
    const result: { id: number; label: string }[] = [];
    subs.forEach(item => {
        if (excludeIds.has(item.id)) {
            return;
        }
        const prefix = depth > 0 ? `${'--'.repeat(depth)} ` : '';
        result.push({ id: item.id, label: `${prefix}${item.name}` });
        if (item.subcategories && item.subcategories.length > 0) {
            result.push(...flattenSubcategoriesForSelect(item.subcategories, excludeIds, depth + 1));
        }
    });
    return result;
};

const SubcategoryItem: React.FC<SubcategoryItemProps> = ({
    subcategory,
    categoryId,
    categories,
    level = 0,
    onDelete,
    onCreate,
    onEdit,
    onTransfer,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAddingChild, setIsAddingChild] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferCategoryId, setTransferCategoryId] = useState<number>(categoryId);
    const [transferParentId, setTransferParentId] = useState<number | ''>(subcategory.parent_id ?? '');
    const [isTransferring, setIsTransferring] = useState(false);

    // New Child State
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [newImage, setNewImage] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);

    // Edit State
    const [editName, setEditName] = useState(subcategory.name);
    const [editCode, setEditCode] = useState(subcategory.code || '');
    const [editImage, setEditImage] = useState(subcategory.image || '');
    const [editFile, setEditFile] = useState<File | null>(null);

    useEffect(() => {
        setTransferCategoryId(categoryId);
    }, [categoryId]);

    useEffect(() => {
        setTransferParentId(subcategory.parent_id ?? '');
    }, [subcategory.parent_id]);

    const descendantIds = useMemo(() => new Set([subcategory.id, ...collectDescendantIds(subcategory)]), [subcategory]);

    const parentOptions = useMemo(() => {
        const targetCategory = categories.find(cat => cat.id === transferCategoryId);
        if (!targetCategory) return [];
        return flattenSubcategoriesForSelect(targetCategory.subcategories, descendantIds);
    }, [categories, transferCategoryId, descendantIds]);

    const handleAddChild = () => {
        if (!newName.trim()) return;
        onCreate(categoryId, newName, newImage, newCode, subcategory.id, newFile || undefined);
        setNewName('');
        setNewCode('');
        setNewImage('');
        setNewFile(null);
        setIsAddingChild(false);
        setIsExpanded(true);
    };

    const handleSaveEdit = () => {
        if (!editName.trim()) return;
        onEdit(subcategory.id, editName, editImage, editCode, subcategory.parent_id, editFile || undefined);
        setIsEditing(false);
    };

    const handleTransferAction = async (mode: 'move' | 'copy') => {
        if (!transferCategoryId) return;
        const parentIdValue = transferParentId === '' ? undefined : Number(transferParentId);
        try {
            setIsTransferring(true);
            await onTransfer(subcategory.id, transferCategoryId, parentIdValue, mode);
            setShowTransfer(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTransferring(false);
        }
    };

    const hasChildren = subcategory.subcategories && subcategory.subcategories.length > 0;

    return (
        <div className="border-l border-gray-100 ml-4">
            <div className={`flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 ${level > 0 ? 'ml-4' : ''}`}>
                <div className="flex items-center gap-2 text-gray-700 flex-1">
                    {hasChildren && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-200 rounded">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                    {!hasChildren && <div className="w-6" />} {/* Spacer */}

                    {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red w-32"
                                autoFocus
                            />
                            <input
                                type="text"
                                value={editCode}
                                onChange={e => setEditCode(e.target.value)}
                                className="border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red w-20"
                                placeholder="Код"
                            />
                            <input
                                type="text"
                                value={editImage}
                                onChange={e => setEditImage(e.target.value)}
                                className="border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red w-32"
                                placeholder="URL"
                            />
                            <button onClick={handleSaveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                <Check size={16} />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {subcategory.image ? (
                                <img src={subcategory.image} alt="" className="w-6 h-6 rounded object-cover" />
                            ) : (
                                <Folder size={16} className="text-gray-400" />
                            )}
                            <span className="font-medium">{subcategory.name}</span>
                            {subcategory.code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Код: {subcategory.code}</span>}
                        </>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Редагувати"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={() => setIsAddingChild(!isAddingChild)}
                            className="text-gray-400 hover:text-tesla-red p-1"
                            title="Додати підкатегорію"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setShowTransfer(!showTransfer)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Перемістити / копіювати"
                        >
                            <ArrowLeftRight size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(subcategory.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Видалити"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Add Child Form */}
            {isAddingChild && (
                <div className={`ml-8 mt-2 mb-2 p-3 bg-gray-50 rounded border border-gray-200 flex gap-2 items-center flex-wrap`}>
                    <CornerDownRight size={16} className="text-gray-400" />
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="flex-1 min-w-[150px] border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                        placeholder="Назва..."
                        autoFocus
                    />
                    <input
                        type="text"
                        value={newCode}
                        onChange={e => setNewCode(e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                        placeholder="Код"
                    />

                    {/* Image Input Group */}
                    <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                        <input
                            type="text"
                            value={newImage}
                            onChange={e => setNewImage(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                            placeholder="URL або файл ->"
                        />
                        <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <ImageIcon size={14} />
                            <input
                                type="file"
                                className="hidden"
                                onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        setNewFile(e.target.files[0]);
                                        setNewImage(e.target.files[0].name);
                                    }
                                }}
                            />
                        </label>
                    </div>

                    <button onClick={handleAddChild} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium">
                        Додати
                    </button>
                </div>
            )}

            {/* Transfer Form */}
            {showTransfer && (
                <div className="ml-8 mt-2 mb-2 p-3 bg-indigo-50 rounded border border-indigo-200 space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row">
                        <select
                            value={transferCategoryId}
                            onChange={e => {
                                const value = Number(e.target.value);
                                setTransferCategoryId(value);
                                setTransferParentId('');
                            }}
                            className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={transferParentId}
                            onChange={e => {
                                const value = e.target.value;
                                setTransferParentId(value === '' ? '' : Number(value));
                            }}
                            className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                        >
                            <option value="">Корінь категорії</option>
                            {parentOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => handleTransferAction('move')}
                            disabled={isTransferring}
                            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                            Перемістити
                        </button>
                        <button
                            onClick={() => handleTransferAction('copy')}
                            disabled={isTransferring}
                            className="bg-white text-red-700 border border-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-50 disabled:opacity-50"
                        >
                            Копіювати
                        </button>
                        <button
                            onClick={() => setShowTransfer(false)}
                            className="text-gray-600 text-sm hover:underline"
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            )}

            {/* Children */}
            {isExpanded && hasChildren && (
                <div className="ml-2">
                    {subcategory.subcategories?.map(child => (
                        <SubcategoryItem
                            key={child.id}
                            subcategory={child}
                            categoryId={categoryId}
                            categories={categories}
                            level={level + 1}
                            onDelete={onDelete}
                            onCreate={onCreate}
                            onEdit={onEdit}
                            onTransfer={onTransfer}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

    // New Category State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [newCategoryFile, setNewCategoryFile] = useState<File | null>(null);
    const [newCategorySortOrder, setNewCategorySortOrder] = useState('');

    // Edit Category State
    const [editingCategory, setEditingCategory] = useState<number | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryImage, setEditCategoryImage] = useState('');
    const [editCategoryFile, setEditCategoryFile] = useState<File | null>(null);
    const [editCategorySortOrder, setEditCategorySortOrder] = useState<number | ''>(0);

    // New Subcategory State (Top Level)
    const [newSubcategoryNames, setNewSubcategoryNames] = useState<{ [key: number]: string }>({});
    const [newSubcategoryCodes, setNewSubcategoryCodes] = useState<{ [key: number]: string }>({});
    const [newSubcategoryImages, setNewSubcategoryImages] = useState<{ [key: number]: string }>({});
    const [newSubcategoryFiles, setNewSubcategoryFiles] = useState<{ [key: number]: File | null }>({});

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await ApiService.getCategories();
            setCategories(data);
        } catch (e) {
            console.error("Failed to load categories", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
        );
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const sortValue = newCategorySortOrder !== '' ? Number(newCategorySortOrder) : undefined;
            await ApiService.createCategory(newCategoryName, newCategoryImage, newCategoryFile || undefined, sortValue);
            setNewCategoryName('');
            setNewCategoryImage('');
            setNewCategoryFile(null);
            setNewCategorySortOrder('');
            loadCategories();
        } catch (e) {
            alert("Failed to create category");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Are you sure? This will delete all subcategories and products in this category.")) return;
        try {
            await ApiService.deleteCategory(id);
            loadCategories();
        } catch (e) {
            alert("Failed to delete category");
        }
    };

    const startEditCategory = (category: Category) => {
        setEditingCategory(category.id);
        setEditCategoryName(category.name);
        setEditCategoryImage(category.image || '');
        setEditCategoryFile(null);
        setEditCategorySortOrder(category.sort_order ?? 0);
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editCategoryName.trim()) return;
        try {
            const sortValue = editCategorySortOrder === '' ? undefined : Number(editCategorySortOrder);
            await ApiService.updateCategory(editingCategory, editCategoryName, editCategoryImage, editCategoryFile || undefined, sortValue);
            setEditingCategory(null);
            loadCategories();
        } catch (e) {
            alert("Failed to update category");
        }
    };

    const handleCreateSubcategory = async (categoryId: number, name: string, image?: string, code?: string, parentId?: number, file?: File) => {
        if (!name?.trim()) return;

        try {
            await ApiService.createSubcategory(categoryId, name, image, code, parentId, file);
            if (!parentId) {
                setNewSubcategoryNames(prev => ({ ...prev, [categoryId]: '' }));
                setNewSubcategoryCodes(prev => ({ ...prev, [categoryId]: '' }));
                setNewSubcategoryImages(prev => ({ ...prev, [categoryId]: '' }));
                setNewSubcategoryFiles(prev => ({ ...prev, [categoryId]: null }));
            }
            loadCategories();
        } catch (e) {
            alert("Failed to create subcategory");
        }
    };

    const triggerRootSubcategoryCreate = (category: Category) => {
        handleCreateSubcategory(
            category.id,
            newSubcategoryNames[category.id],
            newSubcategoryImages[category.id],
            newSubcategoryCodes[category.id],
            undefined,
            newSubcategoryFiles[category.id] || undefined
        );
    };

    const handleUpdateSubcategory = async (id: number, name: string, image: string, code: string, parentId?: number, file?: File) => {
        try {
            await ApiService.updateSubcategory(id, name, image, code, parentId, file);
            loadCategories();
        } catch (e) {
            alert("Failed to update subcategory");
        }
    };

    const handleDeleteSubcategory = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await ApiService.deleteSubcategory(id);
            loadCategories();
        } catch (e) {
            alert("Failed to delete subcategory");
        }
    };

    const handleTransferSubcategory = async (
        id: number,
        targetCategoryId: number,
        targetParentId: number | undefined,
        mode: 'move' | 'copy'
    ) => {
        try {
            if (mode === 'move') {
                await ApiService.moveSubcategory(id, targetCategoryId, targetParentId);
            } else {
                await ApiService.copySubcategory(id, targetCategoryId, targetParentId);
            }
            loadCategories();
        } catch (error) {
            alert(mode === 'move' ? "Failed to move subcategory" : "Failed to copy subcategory");
            throw error;
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const sortedCategories = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Керування категоріями</h1>

            {/* Create Category Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderPlus size={20} className="text-tesla-red" />
                    Додати нову категорію
                </h2>
                <form onSubmit={handleCreateCategory} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Назва категорії</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-tesla-red outline-none"
                            placeholder="Наприклад: Model 3"
                            required
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
                        <input
                            type="number"
                            value={newCategorySortOrder}
                            onChange={e => setNewCategorySortOrder(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-tesla-red outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL зображення (опціонально)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryImage}
                                onChange={e => setNewCategoryImage(e.target.value)}
                                className="flex-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-tesla-red outline-none"
                                placeholder="https://..."
                            />
                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center justify-center border border-gray-300">
                                <ImageIcon size={20} />
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewCategoryFile(e.target.files[0]);
                                            setNewCategoryImage(e.target.files[0].name);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
                    >
                        Додати
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {sortedCategories.map(category => (
                    <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                            {editingCategory === category.id ? (
                                    <div className="flex items-center gap-4 flex-1">
                                        <input
                                            type="text"
                                            value={editCategoryName}
                                            onChange={e => setEditCategoryName(e.target.value)}
                                            className="border rounded px-2 py-1 text-lg font-semibold outline-none focus:border-tesla-red"
                                            autoFocus
                                        />
                                        <input
                                            type="number"
                                            value={editCategorySortOrder}
                                            onChange={e => setEditCategorySortOrder(e.target.value)}
                                            className="w-24 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                                            placeholder="Порядок"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editCategoryImage}
                                            onChange={e => setEditCategoryImage(e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-tesla-red"
                                            placeholder="URL"
                                        />
                                        <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 p-1.5 rounded">
                                            <ImageIcon size={16} />
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setEditCategoryFile(e.target.files[0]);
                                                        setEditCategoryImage(e.target.files[0].name);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <button onClick={handleUpdateCategory} className="text-green-600 hover:bg-green-50 p-2 rounded">
                                        <Check size={20} />
                                    </button>
                                    <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded">
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleExpand(category.id)}>
                                    {expandedCategories.includes(category.id) ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                                    {category.image && <img src={category.image} alt="" className="w-8 h-8 rounded object-cover" />}
                                    <span className="font-semibold text-lg">{category.name}</span>
                                    <span className="text-xs text-gray-400">#{category.sort_order ?? 0}</span>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{category.subcategories.length} підкатегорій</span>
                                </div>
                            )}

                            {!editingCategory && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEditCategory(category)}
                                        className="text-gray-400 hover:text-blue-500 p-2 rounded transition"
                                        title="Редагувати категорію"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                                        title="Видалити категорію"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {expandedCategories.includes(category.id) && (
                            <div className="p-4 bg-white">
                                {/* Subcategories List */}
                                <div className="space-y-2 mb-4 pl-4">
                                    {category.subcategories.map(sub => (
                                        <SubcategoryItem
                                            key={sub.id}
                                            subcategory={sub}
                                            categoryId={category.id}
                                            categories={categories}
                                            onDelete={handleDeleteSubcategory}
                                            onCreate={handleCreateSubcategory}
                                            onEdit={handleUpdateSubcategory}
                                            onTransfer={handleTransferSubcategory}
                                        />
                                    ))}
                                    {category.subcategories.length === 0 && (
                                        <p className="text-sm text-gray-400 italic pl-4">Немає підкатегорій</p>
                                    )}
                                </div>

                                {/* Add Top-Level Subcategory */}
                                <div className="flex gap-2 pl-8 mt-4 items-center border-t border-gray-100 pt-4">
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubcategoryNames[category.id] || ''}
                                            onChange={e => setNewSubcategoryNames(prev => ({ ...prev, [category.id]: e.target.value }))}
                                            className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-tesla-red outline-none"
                                            placeholder="Нова коренева підкатегорія..."
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') triggerRootSubcategoryCreate(category);
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={newSubcategoryCodes[category.id] || ''}
                                            onChange={e => setNewSubcategoryCodes(prev => ({ ...prev, [category.id]: e.target.value }))}
                                            className="w-24 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-tesla-red outline-none"
                                            placeholder="Код (11)"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') triggerRootSubcategoryCreate(category);
                                            }}
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={newSubcategoryImages[category.id] || ''}
                                                onChange={e => setNewSubcategoryImages(prev => ({ ...prev, [category.id]: e.target.value }))}
                                                className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-tesla-red outline-none"
                                                placeholder="URL зображення..."
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') triggerRootSubcategoryCreate(category);
                                                }}
                                            />
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md flex items-center gap-1 border border-gray-300">
                                                <ImageIcon size={16} />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setNewSubcategoryFiles(prev => ({ ...prev, [category.id]: file }));
                                                        if (file) {
                                                            setNewSubcategoryImages(prev => ({ ...prev, [category.id]: file.name }));
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => triggerRootSubcategoryCreate(category)}
                                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
                                    >
                                        Додати
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Категорій ще немає. Створіть першу!
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryList;
