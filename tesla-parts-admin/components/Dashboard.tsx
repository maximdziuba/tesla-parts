import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { DashboardStats, Order, Product } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';

const getProductCategories = (value?: string) => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    {subtext && <p className="text-xs text-gray-400 mt-4">{subtext}</p>}
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          ApiService.getOrders(),
          ApiService.getProducts()
        ]);

        const totalRevenue = ordersData.reduce((acc, order) => acc + order.totalUAH, 0);
        const pending = ordersData.filter(o => o.status === 'new').length;
        // Mock stock logic since backend doesn't track quantity yet, assume inStock=true is > 0
        const lowStock = productsData.filter(p => !p.inStock).length;

        setStats({
          totalRevenue,
          totalOrders: ordersData.length,
          pendingOrders: pending,
          lowStockItems: lowStock
        });
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Calculate Sales by Category
  const salesByCategories = Array.from(new Set(products.flatMap(p => getProductCategories(p.category)))).map(categoryName => {
    const categoryProducts = products
      .filter(p => getProductCategories(p.category).includes(categoryName))
      .map(p => p.id);
    const count = orders.reduce((acc, order) => {
      const categoryItems = order.items.filter(item => categoryProducts.includes(item.product_id));
      return acc + categoryItems.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
    return { name: categoryName, value: count };
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Загальний Дохід"
          value={`${stats.totalRevenue.toLocaleString()} ₴`}
          icon={DollarSign}
          color="bg-green-500"
          subtext="За весь час"
        />
        <StatCard
          title="Всього Замовлень"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-blue-500"
          subtext="Оброблено"
        />
        <StatCard
          title="Нові Замовлення"
          value={stats.pendingOrders}
          icon={Package}
          color="bg-yellow-500"
          subtext="Потребують уваги"
        />
        <StatCard
          title="Немає в наявності"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="bg-red-500"
          subtext="Товари не в наявності"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Sales by Category */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Продажі за категоріями (шт)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCategories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Статус Замовлень</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Нові', value: stats.pendingOrders },
                    { name: 'Завершені', value: stats.totalOrders - stats.pendingOrders },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-500">Нові</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Завершені</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Останні Замовлення</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Клієнт</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Сума</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 3).map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4">{order.customer_first_name} {order.customer_last_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${order.status === 'new' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {order.status === 'new' ? 'Нове' : order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{order.totalUAH} ₴</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
