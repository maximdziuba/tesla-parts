import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AppContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginCustomer } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.loginCustomer({ email, password });
      await loginCustomer(data.access_token);

      const profile = await api.getMe();
      if (!profile.first_name || !profile.phone) {
        navigate('/profile?tab=info');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">Вхід в кабінет</h2>
      {error && (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-tesla-red"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-tesla-red text-white py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? 'Зачекайте...' : 'Увійти'}
        </button>
      </form>
      <div className="mt-4 text-center space-y-2">
        <Link
          to="/forgot-password"
          className="text-sm text-tesla-red hover:underline block"
        >
          Забули пароль?
        </Link>
        <div className="text-sm">
          Ще немає акаунта?{' '}
          <Link to="/register" className="text-tesla-red hover:underline">
            Зареєструватися
          </Link>
        </div>
      </div>
    </div>
  );
};
