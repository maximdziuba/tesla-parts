import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import SubcategoryCard from './components/SubcategoryCard';
import ProductPage from './components/ProductPage';
import StaticPage from './components/StaticPage';
import { Product, Currency, CartItem, Category, Subcategory } from './types';
import { api } from './services/api';
import { CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState('home'); // home, checkout, success, or category name
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart & Settings
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(),
          api.getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (e) {
        console.error("Failed to load data", e);
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
    setSelectedSubcategory(null); // Reset subcategory when changing view
    setSelectedProduct(null);
    window.scrollTo(0, 0);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    setSelectedSubcategory(null);
    window.scrollTo(0, 0);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (currentView === 'home') {
      // Show all or popular
    } else if (currentView === 'search') {
      const lowerQuery = searchQuery.toLowerCase();

      // Helper to find all subcategory IDs that match the query code (or whose parent matches)
      const matchingSubcategoryIds = new Set<number>();

      const traverseAndCollect = (subs: Subcategory[], collect: boolean) => {
        for (const sub of subs) {
          const matches = sub.code?.toLowerCase().includes(lowerQuery);
          const shouldCollect = collect || matches;

          if (shouldCollect) {
            matchingSubcategoryIds.add(sub.id);
          }

          if (sub.subcategories) {
            traverseAndCollect(sub.subcategories, shouldCollect || false);
          }
        }
      };

      // Traverse all categories to find matching subcategories
      categories.forEach(cat => {
        if (cat.subcategories) {
          traverseAndCollect(cat.subcategories, false);
        }
      });

      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.detail_number && p.detail_number.toLowerCase().includes(lowerQuery)) ||
        (p.subcategory_id && matchingSubcategoryIds.has(p.subcategory_id))
      );
    } else {
      // Category View
      filtered = filtered.filter(p => p.category === currentView);
    }

    if (selectedSubcategory) {
      filtered = filtered.filter(p => p.subcategory_id === selectedSubcategory);
    }

    return filtered;
  }, [products, currentView, searchQuery, selectedSubcategory, categories]);

  const currentCategory = categories.find(c => c.name === currentView);

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

        {/* VIEW: PRODUCT DETAIL */}
        {currentView === 'product-detail' && selectedProduct && (
          <ProductPage
            product={selectedProduct}
            currency={currency}
            onAddToCart={addToCart}
            onBack={() => {
              // Go back to category if product has one, else home
              if (selectedProduct.category) {
                handleNavigate(selectedProduct.category);
              } else {
                handleNavigate('home');
              }
            }}
          />
        )}

        {/* VIEW: CONTENT (Home, Search, Category) */}
        {!['success', 'checkout', 'about', 'delivery', 'returns', 'faq', 'contacts', 'product-detail'].includes(currentView) && (
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

              {/* Category Header & Subcategories */}
              {currentCategory && (
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    {selectedSubcategory && (
                      <button
                        onClick={() => {
                          // Find parent of current subcategory or go back to root
                          const findParent = (subs: Subcategory[], targetId: number, parentId: number | null = null): number | null => {
                            for (const sub of subs) {
                              if (sub.id === targetId) return parentId;
                              if (sub.subcategories) {
                                const found = findParent(sub.subcategories, targetId, sub.id);
                                if (found !== undefined) return found;
                              }
                            }
                            return undefined as any;
                          };

                          let parentId: number | null = null;
                          const traverse = (subs: Subcategory[], target: number, currentParent: number | null) => {
                            for (const s of subs) {
                              if (s.id === target) {
                                parentId = currentParent;
                                return;
                              }
                              if (s.subcategories) traverse(s.subcategories, target, s.id);
                            }
                          };
                          traverse(currentCategory.subcategories, selectedSubcategory, null);
                          setSelectedSubcategory(parentId);
                        }}
                        className="text-gray-500 hover:text-tesla-red transition"
                      >
                        ← Назад
                      </button>
                    )}
                    <h1 className="text-3xl font-bold">
                      {selectedSubcategory
                        ? (() => {
                          // Find name of selected subcategory
                          let name = '';
                          const findName = (subs: Subcategory[]) => {
                            for (const s of subs) {
                              if (s.id === selectedSubcategory) { name = s.name; return; }
                              if (s.subcategories) findName(s.subcategories);
                            }
                          };
                          findName(currentCategory.subcategories);
                          return name;
                        })()
                        : currentCategory.name
                      }
                    </h1>
                  </div>

                  {/* Determine what to show: Subcategories or Products */}
                  {(() => {
                    // Find current subcategory object
                    let currentSub: Subcategory | null = null;
                    if (selectedSubcategory) {
                      const findSub = (subs: Subcategory[]) => {
                        for (const s of subs) {
                          if (s.id === selectedSubcategory) { currentSub = s; return; }
                          if (s.subcategories) findSub(s.subcategories);
                        }
                      };
                      findSub(currentCategory.subcategories);
                    }

                    // If no subcategory selected, show root subcategories
                    // If subcategory selected and has children, show children
                    // If subcategory selected and NO children, show products

                    const subcategoriesToShow = selectedSubcategory
                      ? (currentSub?.subcategories || [])
                      : currentCategory.subcategories;

                    const showProducts = selectedSubcategory && (!currentSub?.subcategories || currentSub.subcategories.length === 0);

                    if (showProducts) {
                      return (
                        <ProductList
                          products={filteredProducts}
                          currency={currency}
                          onAddToCart={addToCart}
                          onProductClick={handleProductClick}
                        />
                      );
                    } else {
                      return (
                        <>
                          {/* Subcategory Cards Grid */}
                          <div className="grid grid-cols-1 gap-4">
                            {subcategoriesToShow.map(sub => (
                              <SubcategoryCard
                                key={sub.id}
                                subcategory={sub}
                                onClick={() => setSelectedSubcategory(sub.id)}
                              />
                            ))}
                          </div>
                          {subcategoriesToShow.length === 0 && (
                            <p className="text-gray-500 italic">В цій категорії поки немає підкатегорій.</p>
                          )}
                        </>
                      );
                    }
                  })()}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-tesla-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Show ProductList only for Home or Search */}
                  {(currentView === 'home' || currentView === 'search') && (
                    <ProductList
                      title={currentView === 'home' ? 'Популярні товари' : undefined}
                      products={filteredProducts}
                      currency={currency}
                      onAddToCart={addToCart}
                      onProductClick={handleProductClick}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Static Pages */}
        {['about', 'delivery', 'returns', 'faq', 'contacts'].includes(currentView) && (
          <StaticPage
            slug={currentView}
            onBack={() => handleNavigate('home')}
          />
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
              {categories.slice(0, 4).map(cat => (
                <li key={cat.id}><button onClick={() => handleNavigate(cat.name)} className="hover:text-white">{cat.name}</button></li>
              ))}
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