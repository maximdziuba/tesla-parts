import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.registerCustomer(email);
      setMessage(
        'Посилання для підтвердження надіслано на ваш email. Перевірте папку Спам, якщо лист не прийшов.'
      );
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">Реєстрація</h2>
      {error && (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      )}
      {message && (
        <div className="mb-4 text-green-500 text-sm text-center">{message}</div>
      )}

      {!message && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
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
            {loading ? 'Зачекайте...' : 'Зареєструватися'}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <span className="text-sm">Вже є акаунт? </span>
        <Link to="/login" className="text-sm text-tesla-red hover:underline">
          Увійти
        </Link>
      </div>
    </div>
  );
};
