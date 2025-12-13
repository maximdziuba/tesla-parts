import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  LogOut,
  Car,
  Layers,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
      ? 'bg-red-600 text-white'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminSecret');
    navigate('/login');
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Огляд';
      case '/products': return 'Товари';
      case '/orders': return 'Замовлення';
      case '/categories': return 'Категорії';
      case '/settings': return 'Налаштування';
      case '/cms': return 'Контент';
      default: return 'Адмін Панель';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center gap-2 p-6 border-b border-gray-800">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <span className="font-bold text-white text-lg">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Tesla Admin</span>
        </div>

        <nav className="p-4 space-y-2">
          <SidebarItem
            to="/"
            icon={LayoutDashboard}
            label="Дашборд"
            active={location.pathname === '/'}
          />
          <SidebarItem
            to="/products"
            icon={Car}
            label="Товари"
            active={location.pathname === '/products'}
          />
          <SidebarItem
            to="/orders"
            icon={ShoppingCart}
            label="Замовлення"
            active={location.pathname === '/orders'}
          />
          <SidebarItem
            to="/categories"
            icon={Layers}
            label="Категорії"
            active={location.pathname === '/categories'}
          />
          <SidebarItem
            to="/settings"
            icon={Settings}
            label="Налаштування"
            active={location.pathname === '/settings'}
          />
          <SidebarItem
            to="/cms"
            icon={FileText}
            label="Контент"
            active={location.pathname === '/cms'}
          />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle(location.pathname)}
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm border border-red-200">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};