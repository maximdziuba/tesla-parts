import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export const SettingsPage: React.FC = () => {
    const [rate, setRate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRate();
    }, []);

    const loadRate = async () => {
        try {
            const data = await ApiService.getSetting('exchange_rate');
            setRate(data.value);
        } catch (e) {
            console.error("Failed to load rate", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await ApiService.updateSetting('exchange_rate', rate);
            alert('Курс збережено!');
        } catch (e) {
            console.error("Failed to save rate", e);
            alert('Помилка при збереженні');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Завантаження...</div>;

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Налаштування</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Курс долара (USD до UAH)
                        </label>
                        <div className="flex items-center">
                            <span className="text-gray-500 mr-2">1 USD = </span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={rate}
                                onChange={e => setRate(e.target.value)}
                                className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-gray-500 ml-2">UAH</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Цей курс буде використовуватись для автоматичного розрахунку цін в гривнях при додаванні товарів.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {saving ? 'Збереження...' : 'Зберегти'}
                    </button>
                </form>
            </div>
        </div>
    );
};
