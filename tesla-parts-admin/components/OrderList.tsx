import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Order } from '../types';
import { Search, Truck, CreditCard, Pencil, Check, X } from 'lucide-react';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTtnOrderId, setEditingTtnOrderId] = useState<number | null>(null);
  const [editingTtnValue, setEditingTtnValue] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await ApiService.getOrders();
        setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredAndSortedOrders = React.useMemo(() => {
    const filtered = orders.filter(order => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      const customerName = `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase();
      const ttn = (order.ttn || '').toLowerCase();
      
      return customerName.includes(query) || ttn.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [orders, sortOrder, searchQuery]);

  const handleUpdateTtn = async (orderId: number) => {
    try {
      await ApiService.updateOrderTtn(orderId, editingTtnValue);
      await ApiService.updateOrderStatus(orderId, 'processed');

      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId 
          ? { ...order, ttn: editingTtnValue, status: 'processed' } 
          : order
      ));
      setEditingTtnOrderId(null);
      setEditingTtnValue('');
    } catch (e) {
      console.error("Failed to update order", e);
      alert("Failed to update order details");
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'new':
        return { text: 'Нове', className: 'bg-yellow-100 text-yellow-800' };
      case 'processed':
        return { text: 'Оброблено', className: 'bg-green-100 text-green-800' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) return <div className="p-8 text-center">Завантаження...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Керування Замовленнями</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Пошук за TTN або Ім'ям..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">ID & Дата</th>
                <th className="px-6 py-4">Клієнт</th>
                <th className="px-6 py-4">Доставка</th>
                <th className="px-6 py-4">Сума</th>
                <th className="px-6 py-4">Оплата</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">ТТН</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedOrders.map((order) => {
                const statusDisplay = getStatusDisplay(order.status);
                return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer_first_name} {order.customer_last_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex items-start gap-2">
                      <Truck size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <div className="text-xs">
                        <div>{order.delivery_city}</div>
                        <div className="text-gray-500">{order.delivery_branch}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <div>${(order.totalUSD ?? 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{(order.totalUAH ?? 0).toFixed(2)} ₴</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs bg-gray-100 px-2 py-1 rounded w-fit">
                      <CreditCard size={12} />
                      {order.payment_method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.className}`}>
                      {statusDisplay.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {editingTtnOrderId === order.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTtnValue}
                          onChange={(e) => setEditingTtnValue(e.target.value)}
                          className="w-full border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleUpdateTtn(order.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingTtnOrderId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>{order.ttn || '-'}</span>
                        <button
                          onClick={() => {
                            setEditingTtnOrderId(order.id);
                            setEditingTtnValue(order.ttn || '');
                          }}
                          className="text-gray-400 hover:text-blue-500 p-1 rounded"
                          title="Редагувати ТТН"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
              {filteredAndSortedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Замовлень немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
