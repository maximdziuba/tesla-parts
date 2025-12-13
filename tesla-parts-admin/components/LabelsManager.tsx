import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Plus, Pencil, Check, X, Tag, Trash2 } from 'lucide-react';

interface Setting {
    key: string;
    value: string;
}

// Predefined labels that the shop might use
const PREDEFINED_LABELS = [
    { key: 'site_title', label: 'Назва сайту', description: 'Назва магазину у вкладці браузера' },
    { key: 'site_description', label: 'Опис сайту', description: 'Мета-опис для SEO' },
    { key: 'contact_phone', label: 'Телефон', description: 'Номер телефону для контактів' },
    { key: 'contact_email', label: 'Email', description: 'Email для контактів' },
    { key: 'contact_address', label: 'Адреса', description: 'Фізична адреса магазину' },
    { key: 'footer_text', label: 'Текст футера', description: 'Текст авторських прав внизу сайту' },
    { key: 'exchange_rate', label: 'Курс обміну', description: 'Курс UAH/USD для конвертації цін' },
    { key: 'working_hours', label: 'Години роботи', description: 'Робочий графік магазину' },
    { key: 'telegram_link', label: 'Telegram', description: 'Посилання на Telegram' },
    { key: 'viber_link', label: 'Viber', description: 'Посилання на Viber' },
    { key: 'instagram_link', label: 'Instagram', description: 'Посилання на Instagram' },
    { key: 'facebook_link', label: 'Facebook', description: 'Посилання на Facebook' },
];

export const LabelsManager: React.FC = () => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getSettings();
            setSettings(data);
        } catch (e) {
            console.error('Failed to load settings', e);
            // If getSettings fails, try to get individual predefined settings
            const loadedSettings: Setting[] = [];
            for (const label of PREDEFINED_LABELS) {
                try {
                    const setting = await ApiService.getSetting(label.key);
                    loadedSettings.push(setting);
                } catch {
                    // Setting doesn't exist yet, that's fine
                }
            }
            setSettings(loadedSettings);
        } finally {
            setLoading(false);
        }
    };

    const getSettingValue = (key: string): string => {
        const setting = settings.find(s => s.key === key);
        return setting?.value || '';
    };

    const startEditing = (key: string) => {
        setEditingKey(key);
        setEditValue(getSettingValue(key));
    };

    const handleSave = async () => {
        if (!editingKey) return;
        try {
            await ApiService.updateSetting(editingKey, editValue);
            setEditingKey(null);
            loadSettings();
        } catch (e) {
            alert('Не вдалося зберегти налаштування');
        }
    };

    const handleAddCustom = async () => {
        if (!newKey.trim() || !newValue.trim()) {
            alert('Заповніть ключ та значення');
            return;
        }
        try {
            await ApiService.updateSetting(newKey, newValue);
            setNewKey('');
            setNewValue('');
            setIsAddingCustom(false);
            loadSettings();
        } catch (e) {
            alert('Не вдалося створити налаштування');
        }
    };

    const handleDelete = async (key: string) => {
        // We can't really delete settings with current API, so we'll just set to empty
        if (!window.confirm('Очистити це налаштування?')) return;
        try {
            await ApiService.updateSetting(key, '');
            loadSettings();
        } catch (e) {
            alert('Не вдалося очистити налаштування');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Завантаження...</div>;
    }

    // Custom settings (those not in PREDEFINED_LABELS)
    const customSettings = settings.filter(s => !PREDEFINED_LABELS.some(p => p.key === s.key));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Налаштування та Мітки</h2>
                <button
                    onClick={() => setIsAddingCustom(true)}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                    <Plus size={20} />
                    Додати власне
                </button>
            </div>

            {isAddingCustom && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">Нове налаштування</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ключ</label>
                            <input
                                type="text"
                                value={newKey}
                                onChange={e => setNewKey(e.target.value)}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="my_custom_setting"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Значення</label>
                            <input
                                type="text"
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="Значення"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddCustom}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            Зберегти
                        </button>
                        <button
                            onClick={() => setIsAddingCustom(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            )}

            {/* Predefined Labels */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Основні налаштування</h3>
                {PREDEFINED_LABELS.map(label => (
                    <div key={label.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4 flex-1">
                            <Tag className="text-gray-400" size={20} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{label.label}</span>
                                    <span className="text-xs text-gray-400 font-mono">{label.key}</span>
                                </div>
                                <p className="text-xs text-gray-500">{label.description}</p>
                            </div>
                            {editingKey === label.key ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        className="flex-1 border rounded-md px-3 py-1.5 text-sm"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSave}
                                        className="text-green-600 hover:bg-green-50 p-1.5 rounded"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={() => setEditingKey(null)}
                                        className="text-gray-400 hover:bg-gray-100 p-1.5 rounded"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-sm max-w-xs truncate">
                                        {getSettingValue(label.key) || <span className="text-gray-400 italic">Не вказано</span>}
                                    </span>
                                    <button
                                        onClick={() => startEditing(label.key)}
                                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Settings */}
            {customSettings.length > 0 && (
                <div className="mt-8 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Власні налаштування</h3>
                    {customSettings.map(setting => (
                        <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-4 flex-1">
                                <Tag className="text-blue-400" size={20} />
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900 font-mono">{setting.key}</span>
                                </div>
                                {editingKey === setting.key ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            className="flex-1 border rounded-md px-3 py-1.5 text-sm"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSave}
                                            className="text-green-600 hover:bg-green-50 p-1.5 rounded"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingKey(null)}
                                            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 text-sm max-w-xs truncate">{setting.value}</span>
                                        <button
                                            onClick={() => startEditing(setting.key)}
                                            className="text-gray-400 hover:text-blue-500 p-1.5 rounded"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(setting.key)}
                                            className="text-red-400 hover:text-red-500 p-1.5 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
