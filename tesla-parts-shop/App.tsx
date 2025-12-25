import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useMatch, useParams, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import SubcategoryCard from './components/SubcategoryCard';
import ProductPage from './components/ProductPage';
import StaticPage from './components/StaticPage';
import { Product, Currency, CartItem, Category, Subcategory, StaticSeoRecord, Page } from './types';
import { api } from './services/api';
import { CheckCircle } from 'lucide-react';
import TeslaPartsCenterLogo from './components/ShopLogo';
import { DEFAULT_EXCHANGE_RATE_UAH_PER_USD } from './constants';
import SeoHead from './components/SeoHead';

const CART_STORAGE_KEY = 'tesla-parts-cart';

// --- Helpers ---

const parseProductCategories = (value?: string | null) => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

const productMatchesCategory = (product: Product, categoryName: string) => {
  if (!categoryName) return false;
  return parseProductCategories(product.category).includes(categoryName);
};

const getPrimaryCategory = (value?: string | null) => {
  const categories = parseProductCategories(value);
  return categories.length > 0 ? categories[0] : '';
};

const getProductSubcategoryIds = (product: Product): number[] => {
  if (product.subcategory_ids && product.subcategory_ids.length > 0) {
    return product.subcategory_ids;
  }
  return product.subcategory_id ? [product.subcategory_id] : [];
};

const STATIC_PAGE_SLUGS = new Set(['about', 'delivery', 'returns', 'faq', 'contacts']);

const slugify = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

const categoryContainsSubcategory = (subs: Subcategory[] | undefined, targetId: number): boolean => {
  if (!subs) return false;
  for (const sub of subs) {
    if (sub.id === targetId) {
      return true;
    }
    if (sub.subcategories && categoryContainsSubcategory(sub.subcategories, targetId)) {
      return true;
    }
  }
  return false;
};

const findCategorySlugForSubcategory = (categories: Category[], targetId: number): string | null => {
  for (const category of categories) {
    if (categoryContainsSubcategory(category.subcategories, targetId)) {
      return slugify(category.name);
    }
  }
  return null;
};

const compareBySortOrder = <T extends { sort_order?: number | null; id?: number }>(a: T, b: T) => {
  const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  if (a.id !== undefined && b.id !== undefined) {
    return a.id - b.id;
  }
  return 0;
};

const sortSubcategoryTreeData = (subs?: Subcategory[]): Subcategory[] => {
  if (!subs) return [];
  return [...subs]
    .sort(compareBySortOrder)
    .map(sub => ({
      ...sub,
      subcategories: sortSubcategoryTreeData(sub.subcategories),
    }));
};

const sortCategoryTreeData = (cats: Category[]): Category[] => {
  return [...cats]
    .sort(compareBySortOrder)
    .map(cat => ({
      ...cat,
      subcategories: sortSubcategoryTreeData(cat.subcategories),
    }));
};

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed: CartItem[] = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load cart from storage', err);
  }
  return [];
};

const getProductUsdPrice = (product: Product, rate: number): number => {
  if (product.priceUSD && product.priceUSD > 0) {
    return product.priceUSD;
  }
  if (product.priceUAH && product.priceUAH > 0 && rate > 0) {
    return product.priceUAH / rate;
  }
  return 0;
};

// --- Image Preloader ---
const preloadImages = async (imageUrls: (string | undefined)[]) => {
  const promises = imageUrls.filter(Boolean).map((src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src!;
      img.onload = resolve;
      img.onerror = resolve; 
    });
  });
  await Promise.all(promises);
};

// --- Main App Component ---

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryMatchWithSub = useMatch('/category/:slug/sub/:subId');
  const categoryMatchBase = useMatch('/category/:slug');
  const categoryMatch = categoryMatchWithSub ?? categoryMatchBase;
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [headerPages, setHeaderPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart & Settings
  const [cart, setCart] = useState<CartItem[]>(() => getInitialCart());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);
  const [uahPerUsd, setUahPerUsd] = useState(DEFAULT_EXCHANGE_RATE_UAH_PER_USD);
  const [socialLinks, setSocialLinks] = useState({ instagram: '', telegram: '' });
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    footerDescription: '',
    footerText: '',
  });
  const [staticSeo, setStaticSeo] = useState<Record<string, StaticSeoRecord>>({});

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to persist cart', err);
    }
  }, [cart]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const headerPageSlugs = ['about', 'delivery', 'returns', 'contacts', 'faq'];
        const [productsData, categoriesData, socialLinksData, pagesData] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
          api.getSocialLinks(),
          api.getPagesBySlugs(headerPageSlugs),
        ]);

        setProducts(productsData);
        const sortedCats = sortCategoryTreeData(categoriesData);
        setCategories(sortedCats);
        setSocialLinks(socialLinksData);
        setHeaderPages(pagesData);

        // Preload critical images
        const heroImages = sortedCats.slice(0, 4).map(c => c.image);
        const productImages = productsData.slice(0, 4).map(p => p.image);
        await preloadImages([...heroImages, ...productImages]);

      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const value = await api.getSetting('exchange_rate');
        const parsed = value ? parseFloat(value) : NaN;
        if (!Number.isNaN(parsed) && parsed > 0) {
          setUahPerUsd(parsed);
        }
      } catch (e) {
        console.error("Failed to load exchange rate", e);
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const loadContactInfo = async () => {
      const fetchSetting = async (key: string) => {
        try {
          const value = await api.getSetting(key);
          return value || '';
        } catch {
          return '';
        }
      };
      const [email, phone, footerDescription, footerText] = await Promise.all([
        fetchSetting('contact_email'),
        fetchSetting('contact_phone'),
        fetchSetting('footer_description'),
        fetchSetting('footer_text'),
      ]);
      setContactInfo({
        email,
        phone,
        footerDescription,
        footerText,
      });
    };
    loadContactInfo();
  }, []);

  useEffect(() => {
    const loadStaticSeo = async () => {
      try {
        const records = await api.getStaticSeo();
        const map: Record<string, StaticSeoRecord> = {};
        records.forEach(record => {
          map[record.slug] = record;
        });
        setStaticSeo(map);
      } catch (e) {
        console.error("Failed to load SEO metadata", e);
      }
    };
    loadStaticSeo();
  }, []);

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

  const cartTotalUSD = useMemo(() => {
    const effectiveRate = uahPerUsd > 0 ? uahPerUsd : DEFAULT_EXCHANGE_RATE_UAH_PER_USD;
    return cart.reduce((sum, item) => {
      const priceUSD = getProductUsdPrice(item, effectiveRate);
      return sum + priceUSD * item.quantity;
    }, 0);
  }, [cart, uahPerUsd]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const previousPathRef = React.useRef<string | null>(null);
  const lastPathRef = React.useRef(location.pathname + location.search);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryFromUrl = params.get('q') || '';
    if (location.pathname === '/search') {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery('');
    }
  }, [location]);

  useEffect(() => {
    const current = location.pathname + location.search;
    if (current !== lastPathRef.current) {
      previousPathRef.current = lastPathRef.current;
      lastPathRef.current = current;
    }
  }, [location.pathname, location.search]);

  const handleNavigate = (view: string) => {
    if (view !== 'search') {
      setSearchQuery('');
    }
    window.scrollTo(0, 0);

    if (view === 'home') {
      navigate('/');
      return;
    }
    if (view === 'checkout') {
      navigate('/checkout');
      return;
    }
    if (view === 'success') {
      navigate('/success');
      return;
    }
    if (view === 'search') {
      navigate('/search');
      return;
    }
    if (STATIC_PAGE_SLUGS.has(view)) {
      navigate(`/info/${view}`);
      return;
    }
    const slug = slugify(view);
    navigate(`/category/${slug}`);
  };

  const handleProductClick = (product: Product) => {
    window.scrollTo(0, 0);
    navigate(`/product/${product.id}`);
  };

  const handleProductBack = (product: Product) => {
    if (previousPathRef.current) {
      navigate(previousPathRef.current);
      return;
    }

    const subcategoryIds = getProductSubcategoryIds(product);
    if (subcategoryIds.length > 0) {
      const targetSubId = subcategoryIds[0];
      const categorySlug = findCategorySlugForSubcategory(categories, targetSubId);
      if (categorySlug) {
        navigate(`/category/${categorySlug}/sub/${targetSubId}`);
        return;
      }
    }

    const primaryCategory = getPrimaryCategory(product.category);
    if (primaryCategory) {
      handleNavigate(primaryCategory);
    } else {
      handleNavigate('home');
    }
  };

  const handleSearch = (query: string) => {
    window.scrollTo(0, 0);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const sortedCategories = useMemo(() => [...categories].sort(compareBySortOrder), [categories]);

  const currentCategorySlug = categoryMatch?.params?.slug;
  const currentCategory = useMemo(() => {
    if (!currentCategorySlug) return undefined;
    return sortedCategories.find(c => slugify(c.name) === currentCategorySlug);
  }, [sortedCategories, currentCategorySlug]);

  const searchResults = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchingSubcategoryIds = new Set<number>();

    const traverseAndCollect = (subs: Subcategory[], collect: boolean) => {
      for (const sub of subs) {
        const matches = sub.code?.toLowerCase().includes(lowerQuery);
        const shouldCollect = collect || !!matches;

        if (shouldCollect) {
          matchingSubcategoryIds.add(sub.id);
        }

        if (sub.subcategories) {
          traverseAndCollect(sub.subcategories, shouldCollect);
        }
      }
    };

    categories.forEach(cat => {
      if (cat.subcategories) {
        traverseAndCollect(cat.subcategories, false);
      }
    });

    return products.filter(p => {
      const productSubIds = getProductSubcategoryIds(p);
      return (
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.detail_number && p.detail_number.toLowerCase().includes(lowerQuery)) ||
        (p.cross_number && p.cross_number.toLowerCase().includes(lowerQuery)) ||
        productSubIds.some(id => matchingSubcategoryIds.has(id))
      );
    });
  }, [products, searchQuery, categories]);

  const categoryRouteElement = currentCategory ? (
    <CategoryView
      category={currentCategory}
      products={products}
      currency={currency}
      uahPerUsd={uahPerUsd}
      addToCart={addToCart}
      handleProductClick={handleProductClick}
      loading={loading}
    />
  ) : loading ? (
    <LoadingSpinner />
  ) : (
    <Navigate to="/" replace />
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-tesla-dark bg-[#f8fafc]">
      <Header
        cartCount={cartCount}
        cartTotalUSD={cartTotalUSD}
        currency={currency}
        uahPerUsd={uahPerUsd}
        categories={sortedCategories}
        setCurrency={setCurrency}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        socialLinks={socialLinks}
        phoneNumber={contactInfo.phone}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        headerPages={headerPages}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                loading={loading}
                products={products}
                currency={currency}
                uahPerUsd={uahPerUsd}
                addToCart={addToCart}
                handleProductClick={handleProductClick}
                showHero={!searchQuery}
                onSelectCategory={handleNavigate}
                seoRecord={staticSeo['home']}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchView
                loading={loading}
                products={searchResults}
                currency={currency}
                uahPerUsd={uahPerUsd}
                addToCart={addToCart}
                handleProductClick={handleProductClick}
                searchQuery={searchQuery}
                seoRecord={staticSeo['search']}
              />
            }
          />
          <Route path="/category/:slug" element={categoryRouteElement} />
          <Route path="/category/:slug/sub/:subId" element={categoryRouteElement} />
          <Route
            path="/product/:productId"
            element={
              <ProductDetailRoute
                products={products}
                currency={currency}
                uahPerUsd={uahPerUsd}
                onAddToCart={addToCart}
                onNavigateBack={handleProductBack}
                onNavigateHome={() => handleNavigate('home')}
                loading={loading}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cartItems={cart}
                currency={currency}
                uahPerUsd={uahPerUsd}
                totalUSD={cartTotalUSD}
                onSuccess={() => {
                  clearCart();
                  navigate('/success');
                }}
              />
            }
          />
          <Route
            path="/success"
            element={<SuccessView onNavigateHome={() => handleNavigate('home')} />}
          />
          <Route
            path="/info/:slug"
            element={<StaticPageRoute onNavigateHome={() => handleNavigate('home')} seoRecords={staticSeo} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-tesla-dark text-gray-400 py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <TeslaPartsCenterLogo onNavigate={handleNavigate} />
            </div>
            <p className="text-sm">
              {contactInfo.footerDescription || 'Ваш надійний партнер у світі запчастин для електромобілів.'}
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Навігація</h3>
            <ul className="space-y-2 text-sm">
              {sortedCategories.slice(0, 4).map(cat => (
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
            <p className="text-sm mb-2">
              {contactInfo.phone || '+38 (099) 123-45-67'}
            </p>
            <p className="text-sm mb-2">
              {contactInfo.email || 'info@teslaparts.ua'}
            </p>
            <div className="flex gap-4 mt-4">
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-tesla-red transition cursor-pointer">IG</a>
              )}
              {socialLinks.telegram && (
                <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-tesla-red transition cursor-pointer">TG</a>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-xs">
          {contactInfo.footerText || '© 2024 Tesla Parts Center. Всі права захищені.'}
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currency={currency}
        uahPerUsd={uahPerUsd}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
};

// --- Sub-components ---

const LoadingSpinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-tesla-red border-t-transparent rounded-full animate-spin"></div>
  </div>
);

interface SuccessViewProps {
  onNavigateHome: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ onNavigateHome }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center pt-20 pb-8 min-h-[80vh] animate-fade-in">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
        <CheckCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-center mb-4">Замовлення успішно оформлено!</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Дякуємо за покупку. Наш менеджер зв'яжеться з вами найближчим часом для підтвердження деталей.
      </p>
      <button
        onClick={onNavigateHome}
        className="bg-tesla-dark text-white px-8 py-3 rounded-md hover:bg-gray-800 transition"
      >
        На головну
      </button>
    </div>
  )
};

interface HomeViewProps {
  loading: boolean;
  products: Product[];
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
  showHero: boolean;
  onSelectCategory: (category: string) => void;
  seoRecord?: StaticSeoRecord;
}

const HomeView: React.FC<HomeViewProps> = ({
  loading,
  products,
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
  showHero,
  onSelectCategory,
  seoRecord,
}) => {
  const fallbackTitle = 'Tesla Parts Center | Магазин запчастин для Tesla';
  const fallbackDescription = 'Популярні запчастини Tesla з гарантією якості та швидкою доставкою по Україні.';

  const popularProducts = useMemo(() => products.slice(0, 8), [products]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SeoHead
        title={seoRecord?.meta_title}
        description={seoRecord?.meta_description}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
      />
      
      {showHero && (
        // ВИПРАВЛЕННЯ: min-h-[...] резервує місце. 
        // 280px для мобільних, 400px для планшетів, 500px для десктопів.
        // Це запобігає "стрибку" товарів, поки Hero вантажиться.
        <div className="w-full min-h-[280px] md:min-h-[400px] lg:min-h-[500px]">
           <Hero onSelectCategory={onSelectCategory} />
        </div>
      )}

      <div className="mt-8">
        <ProductList
          title="Популярні товари"
          products={popularProducts}
          currency={currency}
          uahPerUsd={uahPerUsd}
          onAddToCart={addToCart}
          onProductClick={handleProductClick}
        />
      </div>
    </>
  );
};

interface SearchViewProps {
  loading: boolean;
  products: Product[];
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
  searchQuery: string;
  seoRecord?: StaticSeoRecord;
}

const SearchView: React.FC<SearchViewProps> = ({
  loading,
  products,
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
  searchQuery,
  seoRecord,
}) => {
  const normalizedQuery = searchQuery || 'запчастини';
  const fallbackTitle = `Пошук: ${normalizedQuery} | Tesla Parts Center`;
  const fallbackDescription = `Результати пошуку "${normalizedQuery}" у Tesla Parts Center. Знайдіть сумісні запчастини для свого авто.`;
  return (
    <div className="mt-8">
      <SeoHead
        title={seoRecord?.meta_title}
        description={seoRecord?.meta_description}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Результати пошуку: "{searchQuery}"</h1>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ProductList
          products={products}
          currency={currency}
          uahPerUsd={uahPerUsd}
          onAddToCart={addToCart}
          onProductClick={handleProductClick}
        />
      )}
    </div>
  );
};

interface CategoryViewProps {
  category: Category;
  products: Product[];
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
  loading: boolean;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  products,
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
  loading,
}) => {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const categorySlug = slugify(category.name);
  const selectedSubcategory = subId ? Number(subId) : null;

  const categoryProducts = useMemo(() => {
    let filtered = products.filter(p => productMatchesCategory(p, category.name));
    if (selectedSubcategory) {
      filtered = filtered.filter(p => getProductSubcategoryIds(p).includes(selectedSubcategory));
    } else {
      filtered = filtered.filter(p => getProductSubcategoryIds(p).length === 0);
    }
    return filtered;
  }, [products, category.name, selectedSubcategory]);

  const findSubcategory = (subs: Subcategory[], targetId: number): Subcategory | null => {
    for (const sub of subs) {
      if (sub.id === targetId) {
        return sub;
      }
      if (sub.subcategories) {
        const found = findSubcategory(sub.subcategories, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const currentSubcategory = selectedSubcategory
    ? findSubcategory(category.subcategories, selectedSubcategory)
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (selectedSubcategory && !currentSubcategory) {
      navigate(`/category/${categorySlug}`, { replace: true });
    }
  }, [selectedSubcategory, currentSubcategory, navigate, categorySlug]);

  const handleBack = () => {
    if (!selectedSubcategory) return;
    const findParent = (subs: Subcategory[], target: number, parent: number | null = null): number | null => {
      for (const sub of subs) {
        if (sub.id === target) {
          return parent;
        }
        if (sub.subcategories) {
          const result = findParent(sub.subcategories, target, sub.id);
          if (result !== null && result !== undefined) {
            return result;
          }
        }
      }
      return null;
    };
    const parentId = findParent(category.subcategories, selectedSubcategory, null);
    if (parentId) {
      navigate(`/category/${categorySlug}/sub/${parentId}`);
    } else {
      navigate(`/category/${categorySlug}`);
    }
  };

  const getSelectedSubcategoryName = () => {
    if (!selectedSubcategory) return category.name;
    const found = findSubcategory(category.subcategories, selectedSubcategory);
    return found?.name || category.name;
  };

  const subcategoriesToShow = useMemo(() => {
    const base = selectedSubcategory
      ? currentSubcategory?.subcategories || []
      : category.subcategories;
    return sortSubcategoryTreeData(base);
  }, [selectedSubcategory, currentSubcategory, category]);

  const pageHeading = getSelectedSubcategoryName();
  const fallbackTitle = `${pageHeading} | Tesla Parts Center`;
  const fallbackDescription = selectedSubcategory
    ? `Запчастини підкатегорії ${pageHeading} в категорії ${category.name}.`
    : `Категорія ${category.name}: підберіть запчастини для вашої Tesla.`;

  return (
    <div className="mt-8">
      <SeoHead
        title={category.meta_title}
        description={category.meta_description}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
      />
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-tesla-red transition">
          ← Назад до головної
        </button>
        {selectedSubcategory && (
          <button onClick={handleBack} className="text-gray-500 hover:text-tesla-red transition">
            ← Назад
          </button>
        )}
        <h1 className="text-3xl font-bold">{pageHeading}</h1>
      </div>

      {subcategoriesToShow.length > 0 && (
        // FIX: Адаптивна сітка (grid-cols-1 -> md:grid-cols-2 -> xl:grid-cols-3)
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {subcategoriesToShow.map(sub => (
            <SubcategoryCard
              key={sub.id}
              subcategory={sub}
              onClick={() => navigate(`/category/${categorySlug}/sub/${sub.id}`)}
            />
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        categoryProducts.length > 0 && (
          <ProductList
            title={subcategoriesToShow.length > 0 ? "Товари" : undefined}
            products={categoryProducts}
            currency={currency}
            uahPerUsd={uahPerUsd}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
        )
      )}

      {!loading && subcategoriesToShow.length === 0 && categoryProducts.length === 0 && (
        <p className="text-gray-500 italic">В цій категорії поки немає товарів чи підкатегорій.</p>
      )}
    </div>
  );
};

interface ProductDetailRouteProps {
  products: Product[];
  currency: Currency;
  uahPerUsd: number;
  onAddToCart: (product: Product) => void;
  onNavigateBack: (product: Product) => void;
  onNavigateHome: () => void;
  loading: boolean;
}

const ProductDetailRoute: React.FC<ProductDetailRouteProps> = ({
  products,
  currency,
  uahPerUsd,
  onAddToCart,
  onNavigateBack,
  onNavigateHome,
  loading,
}) => {
  const { productId } = useParams();
  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  if (loading && !product) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-600 mb-4">Товар не знайдено.</p>
        <button
          onClick={onNavigateHome}
          className="bg-tesla-dark text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
        >
          На головну
        </button>
      </div>
    );
  }

  return (
    <ProductPage
      product={product}
      currency={currency}
      uahPerUsd={uahPerUsd}
      onAddToCart={onAddToCart}
      onBack={() => onNavigateBack(product)}
    />
  );
};

interface StaticPageRouteProps {
  onNavigateHome: () => void;
  seoRecords: Record<string, StaticSeoRecord>;
}

const StaticPageRoute: React.FC<StaticPageRouteProps> = ({ onNavigateHome, seoRecords }) => {
  const { slug } = useParams();
  if (!slug) {
    return <Navigate to="/" replace />;
  }
  return <StaticPage slug={slug} onBack={onNavigateHome} seo={seoRecords[slug]} />;
};

export default App;