import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export const SettingsPage: React.FC = () => {
    const [rate, setRate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [savingRate, setSavingRate] = useState(false);
    const [instagram, setInstagram] = useState('');
    const [telegram, setTelegram] = useState('');
    const [savingSocial, setSavingSocial] = useState(false);
    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState('');
    const [savingTelegramSettings, setSavingTelegramSettings] = useState(false);


    useEffect(() => {
        loadRate();
        loadSocialLinks();
        loadTelegramSettings();
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
    
    const loadSocialLinks = async () => {
        try {
            const data = await ApiService.getSocialLinks();
            setInstagram(data.instagram);
            setTelegram(data.telegram);
        } catch (e) {
            console.error("Failed to load social links", e);
        }
    };

    const loadTelegramSettings = async () => {
        try {
            const token = await ApiService.getSetting('telegram_bot_token');
            setBotToken(token.value || '');
        } catch {
            setBotToken('');
        }
        try {
            const chat = await ApiService.getSetting('telegram_chat_id');
            setChatId(chat.value || '');
        } catch {
            setChatId('');
        }
    };

    const handleSaveRate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingRate(true);
        try {
            await ApiService.updateSetting('exchange_rate', rate);
            alert('Курс збережено!');
        } catch (e) {
            console.error("Failed to save rate", e);
            alert('Помилка при збереженні');
        } finally {
            setSavingRate(false);
        }
    };

    const handleSaveSocial = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSocial(true);
        try {
            await ApiService.updateSocialLinks({ instagram, telegram });
            alert('Посилання збережено!');
        } catch (e) {
            console.error("Failed to save social links", e);
            alert('Помилка при збереженні');
        } finally {
            setSavingSocial(false);
        }
    }

    const handleSaveTelegramSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTelegramSettings(true);
        try {
            await Promise.all([
                ApiService.updateSetting('telegram_bot_token', botToken),
                ApiService.updateSetting('telegram_chat_id', chatId),
            ]);
            alert('Телеграм налаштування збережено!');
        } catch (e) {
            console.error("Failed to save telegram settings", e);
            alert('Помилка при збереженні телеграм налаштувань');
        } finally {
            setSavingTelegramSettings(false);
        }
    };

    if (loading) return <div>Завантаження...</div>;

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Налаштування</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
                <form onSubmit={handleSaveRate} className="space-y-6">
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
                        disabled={savingRate}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {savingRate ? 'Збереження...' : 'Зберегти курс'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
                <form onSubmit={handleSaveSocial} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instagram Link
                        </label>
                        <input
                            type="text"
                            value={instagram}
                            onChange={e => setInstagram(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telegram Link
                        </label>
                        <input
                            type="text"
                            value={telegram}
                            onChange={e => setTelegram(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={savingSocial}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {savingSocial ? 'Збереження...' : 'Зберегти посилання'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSaveTelegramSettings} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telegram Bot Token
                        </label>
                        <input
                            type="text"
                            value={botToken}
                            onChange={e => setBotToken(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telegram Chat ID
                        </label>
                        <input
                            type="text"
                            value={chatId}
                            onChange={e => setChatId(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            Використовуйте ID чату або каналу, куди потрібно надсилати повідомлення про замовлення.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={savingTelegramSettings}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {savingTelegramSettings ? 'Збереження...' : 'Зберегти Telegram налаштування'}
                    </button>
                </form>
            </div>
        </div>
    );
};
