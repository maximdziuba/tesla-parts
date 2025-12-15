import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Product } from '../types';
import { Search, Plus, Filter, Trash2, Pencil } from 'lucide-react';

import { Link } from 'react-router-dom';

const extractCategories = (value?: string) => {
  if (!value) return [];
  return value.split(',').map(cat => cat.trim()).filter(Boolean);
};

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Всі');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await ApiService.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = products;
    if (categoryFilter !== 'Всі') {
      result = result.filter(p => extractCategories(p.category).includes(categoryFilter));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        (p.detail_number && p.detail_number.toLowerCase().includes(lower)) ||
        (p.cross_number && p.cross_number.toLowerCase().includes(lower))
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, categoryFilter, products]);

  const handleDelete = async (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
      await ApiService.deleteProduct(id);
      setSelectedProducts(prev => prev.filter(pid => pid !== id));
      fetchProducts();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setSelectedProducts(prev =>
      prev.filter(pid => products.some(product => product.id === pid))
    );
  }, [products]);

  const allVisibleIds = filteredProducts.map(p => p.id);
  const isAllSelected =
    allVisibleIds.length > 0 && allVisibleIds.every(id => selectedProducts.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts(prev => prev.filter(id => !allVisibleIds.includes(id)));
    } else {
      setSelectedProducts(prev => Array.from(new Set([...prev, ...allVisibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Видалити ${selectedProducts.length} товар(и)?`)) return;
    try {
      await ApiService.bulkDeleteProducts(selectedProducts);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      alert('Не вдалося видалити вибрані товари');
    }
  };

  if (loading) return <div className="p-8 text-center">Завантаження...</div>;

  const categories = ['Всі', ...Array.from(new Set(products.flatMap(p => extractCategories(p.category))))];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Пошук за назвою..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleBulkDelete}
            disabled={selectedProducts.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
              selectedProducts.length === 0
                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                : 'text-red-600 border-red-200 hover:bg-red-50'
            }`}
          >
            <Trash2 size={16} />
            <span>Видалити вибрані</span>
            {selectedProducts.length > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {selectedProducts.length}
              </span>
            )}
          </button>
          <div className="relative">
            <select
              className="appearance-none pl-10 pr-8 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <Link to="/products/new" className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <Plus size={20} />
            <span>Додати Товар</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-4">Товар</th>
                <th className="px-6 py-4">Категорія</th>
                <th className="px-6 py-4">Наявність</th>
                <th className="px-6 py-4">Ціна</th>
                <th className="px-6 py-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                        {product.cross_number && (
                          <div className="text-xs text-gray-500 mt-1">Cross: {product.cross_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${product.inStock ? 'text-green-600' : 'text-red-600 font-bold'}`}>
                      {product.inStock ? 'В наявності' : 'Немає'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{product.priceUAH} ₴</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/products/edit/${product.id}`}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Товарів не знайдено.
          </div>
        )}
      </div>
    </div>
  );
};
