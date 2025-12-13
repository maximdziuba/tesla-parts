import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import { Product, Currency, CartItem } from './types';
import { api } from './services/api';
import { CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState('home'); // home, checkout, success, or category name
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart & Settings
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.priceUAH * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Navigation Logic
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    window.scrollTo(0, 0);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    if (currentView === 'home') return products;
    if (currentView === 'search') {
      return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Categories
    return products.filter(p => p.category === currentView);
  }, [products, currentView, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-tesla-dark bg-[#f8fafc]">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        currency={currency}
        setCurrency={setCurrency}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
      />

      <main className="flex-grow container mx-auto px-4 py-8">

        {/* VIEW: SUCCESS */}
        {currentView === 'success' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
              <CheckCircle size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Замовлення успішно оформлено!</h1>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Дякуємо за покупку. Наш менеджер зв'яжеться з вами найближчим часом для підтвердження деталей.
            </p>
            <button
              onClick={() => handleNavigate('home')}
              className="bg-tesla-dark text-white px-8 py-3 rounded-md hover:bg-gray-800 transition"
            >
              На головну
            </button>
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <Checkout
            cartItems={cart}
            currency={currency}
            totalUAH={cartTotal}
            onSuccess={() => {
              clearCart();
              handleNavigate('success');
            }}
          />
        )}

        {/* VIEW: CONTENT (Home, Search, Category) */}
        {['home', 'search', 'Model 3', 'Model S', 'Model X'].includes(currentView) && (
          <>
            {currentView === 'home' && !searchQuery && (
              <Hero onSelectCategory={handleNavigate} />
            )}

            <div className="mt-8">
              {currentView === 'search' && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">Результати пошуку: "{searchQuery}"</h1>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-tesla-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <ProductList
                  title={currentView === 'home' ? 'Популярні товари' : undefined}
                  products={filteredProducts}
                  currency={currency}
                  onAddToCart={addToCart}
                />
              )}
            </div>
          </>
        )}

        {/* Static Pages Placeholders */}
        {['about', 'delivery', 'returns', 'faq', 'contacts'].includes(currentView) && (
          <div className="py-12 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 capitalize">{currentView.replace('-', ' ')}</h1>
            <p className="text-gray-600 leading-relaxed">
              Ця сторінка знаходиться в розробці. Тут буде розміщено інформацію про {currentView}.
              <br /><br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <button onClick={() => handleNavigate('home')} className="mt-8 text-tesla-red font-medium hover:underline">
              ← Повернутись на головну
            </button>
          </div>
        )}

      </main>

      <footer className="bg-tesla-dark text-gray-400 py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-tesla-red">TESLA</span> PARTS
            </div>
            <p className="text-sm">Ваш надійний партнер у світі запчастин для електромобілів.</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Навігація</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigate('Model 3')} className="hover:text-white">Model 3</button></li>
              <li><button onClick={() => handleNavigate('Model S')} className="hover:text-white">Model S</button></li>
              <li><button onClick={() => handleNavigate('Model X')} className="hover:text-white">Model X</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Клієнтам</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigate('delivery')} className="hover:text-white">Доставка та оплата</button></li>
              <li><button onClick={() => handleNavigate('returns')} className="hover:text-white">Повернення</button></li>
              <li><button onClick={() => handleNavigate('contacts')} className="hover:text-white">Контакти</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Контакти</h3>
            <p className="text-sm mb-2">+38 (099) 123-45-67</p>
            <p className="text-sm mb-2">info@teslaparts.ua</p>
            <div className="flex gap-4 mt-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-tesla-red transition cursor-pointer">IG</div>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-tesla-red transition cursor-pointer">TG</div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-xs">
          © 2024 Tesla Parts Shop. Всі права захищені.
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currency={currency}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => {
          setIsCartOpen(false);
          handleNavigate('checkout');
        }}
      />
    </div>
  );
};

export default App;