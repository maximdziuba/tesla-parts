import React, { useState } from 'react';
import { api } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.forgotPassword(email);
      setMessage(
        'Посилання для відновлення пароля надіслано на ваш email. Перевірте папку Спам, якщо лист не прийшов.'
      );
    } catch (err: any) {
      setMessage(
        'Посилання для відновлення пароля надіслано на ваш email. Перевірте папку Спам, якщо лист не прийшов.'
      ); // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Відновлення пароля
      </h2>
      {message ? (
        <div className="text-green-600 text-center">{message}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Введіть ваш Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-tesla-red"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tesla-red text-white py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Зачекайте...' : 'Відправити'}
          </button>
        </form>
      )}
    </div>
  );
};
