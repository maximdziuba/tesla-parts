import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { Order } from '../types';
import {
  Search,
  Truck,
  CreditCard,
  Pencil,
  Check,
  X,
  Package,
  ExternalLink,
  User,
  MapPin,
} from 'lucide-react';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTtnOrderId, setEditingTtnOrderId] = useState<number | null>(
    null
  );
  const [editingTtnValue, setEditingTtnValue] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    const filtered = orders.filter((order) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      const customerName =
        `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase();
      const ttn = (order.ttn || '').toLowerCase();
      const productNames = order.items
        .map((item) => (item.product_name || '').toLowerCase())
        .join(' ');

      return (
        customerName.includes(query) ||
        ttn.includes(query) ||
        productNames.includes(query)
      );
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

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, ttn: editingTtnValue, status: 'processed' }
            : order
        )
      );
      setEditingTtnOrderId(null);
      setEditingTtnValue('');
    } catch (e) {
      console.error('Failed to update order', e);
      alert('Failed to update order details');
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
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Керування Замовленнями
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Пошук за TTN, Ім'ям або Товаром..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as 'newest' | 'oldest')
              }
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
                <th className="px-6 py-4">Товари</th>
                <th className="px-6 py-4">Доставка</th>
                <th className="px-6 py-4">Сума</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">ТТН</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedOrders.map((order) => {
                const statusDisplay = getStatusDisplay(order.status);
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        #{order.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {order.customer_first_name} {order.customer_last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 truncate max-w-[200px]"
                          >
                            <span className="font-medium">
                              {item.quantity}x
                            </span>{' '}
                            {item.product_name || item.product_id}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[10px] text-red-500 font-medium">
                            + ще {order.items.length - 2} позиції
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Truck
                          size={14}
                          className="mt-0.5 text-gray-400 flex-shrink-0"
                        />
                        <div className="text-xs">
                          <div>{order.delivery_city}</div>
                          <div className="text-gray-500 truncate max-w-[150px]">
                            {order.delivery_branch}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <div className="text-gray-900">
                        {(order.totalUAH ?? 0).toLocaleString()} ₴
                      </div>
                      <div className="text-xs text-gray-400 font-normal">
                        ${(order.totalUSD ?? 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusDisplay.className}`}
                      >
                        {statusDisplay.text}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingTtnOrderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTtnValue}
                            onChange={(e) => setEditingTtnValue(e.target.value)}
                            className="w-full border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateTtn(order.id)}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingTtnOrderId(null)}
                            className="text-gray-400 hover:bg-gray-100 p-1 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span className="font-mono text-xs">
                            {order.ttn || '-'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTtnOrderId(order.id);
                              setEditingTtnValue(order.ttn || '');
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Редагувати ТТН"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Замовлень немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Замовлення #{selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {/* Customer & Delivery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider">
                    <User size={16} />
                    <span>Покупець</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="font-bold text-lg text-gray-900">
                      {selectedOrder.customer_first_name}{' '}
                      {selectedOrder.customer_last_name}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {selectedOrder.customer_phone}
                    </div>
                    {selectedOrder.note && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800 italic">
                        "{selectedOrder.note}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider">
                    <Truck size={16} />
                    <span>Доставка та Оплата</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin
                        size={16}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <div className="font-medium">
                          {selectedOrder.delivery_city}
                        </div>
                        <div className="text-gray-500">
                          {selectedOrder.delivery_branch}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard
                        size={16}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <div className="font-medium">
                        {selectedOrder.payment_method}
                      </div>
                    </div>
                    {selectedOrder.ttn && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">
                          ТТН
                        </div>
                        <div className="font-mono font-bold text-red-600">
                          {selectedOrder.ttn}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider">
                  <Package size={16} />
                  <span>Товари ({selectedOrder.items.length})</span>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Товар
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          К-сть
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Ціна
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded-md border border-gray-100"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                  <Package
                                    size={20}
                                    className="text-gray-400"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.product_name || 'Невідомий товар'}
                                </div>
                                {item.product_detail_number && (
                                  <div className="text-[10px] text-gray-500 font-mono uppercase">
                                    {item.product_detail_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">
                            {item.quantity} шт.
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            $
                            {(item.price_at_purchase * item.quantity).toFixed(
                              2
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusDisplay(selectedOrder.status).className}`}
                >
                  {getStatusDisplay(selectedOrder.status).text}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Разом до сплати
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {selectedOrder.totalUAH.toLocaleString()} ₴
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  ${selectedOrder.totalUSD.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
