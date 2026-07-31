import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { Order } from '../types';
import { ArrowLeft, User, Phone, Mail, Clock, Calendar } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomerData(parseInt(id));
    }
  }, [id]);

  const fetchCustomerData = async (customerId: number) => {
    try {
      setLoading(true);
      const [customerData, ordersData] = await Promise.all([
        ApiService.getCustomer(customerId),
        ApiService.getCustomerOrders(customerId),
      ]);
      setCustomer(customerData);
      setOrders(ordersData);
    } catch (e) {
      console.error(e);
      alert('Помилка завантаження даних клієнта');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; bg: string; text: string }
    > = {
      pending: {
        label: 'Очікується',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
      },
      processing: {
        label: 'В обробці',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
      },
      shipped: {
        label: 'Відправлено',
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
      },
      delivered: {
        label: 'Доставлено',
        bg: 'bg-green-100',
        text: 'text-green-800',
      },
      cancelled: { label: 'Скасовано', bg: 'bg-red-100', text: 'text-red-800' },
    };
    const s = statusMap[status] || {
      label: status,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${s.bg} ${s.text}`}
      >
        {s.label}
      </span>
    );
  };

  if (loading)
    return <div className="p-8 text-center text-gray-500">Завантаження...</div>;
  if (!customer)
    return (
      <div className="p-8 text-center text-red-500">Клієнта не знайдено</div>
    );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-gray-600 hover:text-black transition"
      >
        <ArrowLeft size={20} />
        Повернутися до списку
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-1 h-max">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {customer.first_name || '—'} {customer.last_name || '—'}
              </h2>
              <p className="text-gray-500 text-sm">ID: {customer.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{customer.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="text-sm text-gray-500">Телефон</p>
                <p className="font-medium">{customer.phone || '—'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-2">Статус</p>
            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-sm w-fit ${customer.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {customer.is_verified ? 'Верифікований' : 'Не верифікований'}
              </span>
              {customer.discount_type && customer.discount_value && (
                <span className="inline-flex items-center px-2 py-1 rounded text-sm w-fit bg-purple-100 text-purple-800">
                  Знижка: {customer.discount_value}{' '}
                  {customer.discount_type === 'percent'
                    ? '%'
                    : customer.discount_type.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:col-span-2">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              Історія замовлень
            </h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {orders.length}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              У цього клієнта ще немає замовлень.
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-lg">
                          Замовлення #{order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        ${order.totalUSD.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Доставка:</span>{' '}
                      {order.delivery_city}, {order.delivery_branch}
                    </p>
                    <p>
                      <span className="font-medium">Оплата:</span>{' '}
                      {order.payment_method}
                    </p>
                    {order.note && (
                      <p>
                        <span className="font-medium">Коментар:</span>{' '}
                        {order.note}
                      </p>
                    )}
                    {order.promocode && (
                      <p>
                        <span className="font-medium text-green-600">
                          Промокод:
                        </span>{' '}
                        {order.promocode}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Товари:</h4>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center font-medium">
                              {item.quantity}x
                            </span>
                            <span className="font-medium">
                              {item.product_name}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            ${item.price_at_purchase.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
