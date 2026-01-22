import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useMatch, useParams, Navigate, Link } from 'react-router-dom';
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
        const headerPageSlugs = ['about', 'delivery', 'returns', 'contacts', 'faq', 'terms-of-service', 'privacy-policy'];
        const [categoriesData, socialLinksData, pagesData] = await Promise.all([
          api.getCategories(),
          api.getSocialLinks(),
          api.getPagesBySlugs(headerPageSlugs),
        ]);

        const sortedCats = sortCategoryTreeData(categoriesData);
        setCategories(sortedCats);
        setSocialLinks(socialLinksData);
        setHeaderPages(pagesData);

        // Preload critical images
        const heroImages = sortedCats.slice(0, 4).map(c => c.image);
        await preloadImages(heroImages);

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

  const categoryRouteElement = currentCategory ? (
    <CategoryView
      category={currentCategory}
      currency={currency}
      uahPerUsd={uahPerUsd}
      addToCart={addToCart}
      handleProductClick={handleProductClick}
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
                currency={currency}
                uahPerUsd={uahPerUsd}
                onAddToCart={addToCart}
                onNavigateBack={handleProductBack}
                onNavigateHome={() => handleNavigate('home')}
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

      {/* ОНОВЛЕНИЙ ФУТЕР З ПОСИЛАННЯМИ (LINKS) ДЛЯ SEO */}
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
                <li key={cat.id}>
                  {/* ЗАМІНЕНО: button -> Link для індексації */}
                  <Link 
                    to={`/category/${slugify(cat.name)}`} 
                    className="hover:text-white block"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Клієнтам</h3>
            <ul className="space-y-2 text-sm">
              {/* ЗАМІНЕНО: button -> Link для індексації */}
              <li><Link to="/info/delivery" className="hover:text-white block">Доставка та оплата</Link></li>
              <li><Link to="/info/returns" className="hover:text-white block">Повернення</Link></li>
              <li><Link to="/info/contacts" className="hover:text-white block">Контакти</Link></li>
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
      {/* ЗАМІНЕНО: button -> Link */}
      <Link
        to="/"
        className="bg-tesla-dark text-white px-8 py-3 rounded-md hover:bg-gray-800 transition inline-block text-center"
      >
        На головну
      </Link>
    </div>
  )
};

interface HomeViewProps {
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
  showHero: boolean;
  onSelectCategory: (category: string) => void;
  seoRecord?: StaticSeoRecord;
}

const HomeView: React.FC<HomeViewProps> = ({
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
  showHero,
  onSelectCategory,
  seoRecord,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await api.getProducts({ limit: 8 });
        setProducts(data);
      } catch (e) {
        console.error("Failed to load popular products", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const fallbackTitle = 'Tesla Parts Center | Магазин запчастин для Tesla';
  const fallbackDescription = 'Популярні запчастини Tesla з гарантією якості та швидкою доставкою по Україні.';

  // FIX: Весь контент чекає на завантаження, щоб уникнути миготіння
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
        <div className="w-full min-h-[280px] md:min-h-[400px] lg:min-h-[500px]">
           <Hero onSelectCategory={onSelectCategory} />
        </div>
      )}
      <div className="mt-8">
        <ProductList
          title="Популярні товари"
          products={products}
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
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
  searchQuery: string;
  seoRecord?: StaticSeoRecord;
}

const SearchView: React.FC<SearchViewProps> = ({
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
  searchQuery,
  seoRecord,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const data = await api.getProducts({ search: searchQuery });
        setProducts(data);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce could be added here, but simple fetch for now
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
  currency: Currency;
  uahPerUsd: number;
  addToCart: (product: Product) => void;
  handleProductClick: (product: Product) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  currency,
  uahPerUsd,
  addToCart,
  handleProductClick,
}) => {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const categorySlug = slugify(category.name);
  const selectedSubcategory = subId ? Number(subId) : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // State for the full category tree (with subcategories)
  const [detailedCategory, setDetailedCategory] = useState<Category>(category);
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Fetch full category details (subcategories) on mount or change
  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingCategory(true);
      try {
        const fullData = await api.getCategory(category.id);
        // Sort the tree immediately
        const sorted = {
            ...fullData,
            subcategories: sortSubcategoryTreeData(fullData.subcategories)
        };
        setDetailedCategory(sorted);
      } catch (e) {
        console.error("Failed to fetch category details", e);
      } finally {
        setLoadingCategory(false);
      }
    };
    fetchDetails();
  }, [category.id]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const filters: any = { category: categorySlug }; // use slug
        if (selectedSubcategory) {
          filters.subId = selectedSubcategory;
        }
        const data = await api.getProducts(filters);
        setProducts(data);
      } catch (e) {
        console.error("Failed to fetch category products", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [categorySlug, selectedSubcategory]);


  const findSubcategory = (subs: Subcategory[], targetId: number): Subcategory | null => {
    if (!subs) return null;
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
    ? findSubcategory(detailedCategory.subcategories, selectedSubcategory)
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    // Only redirect if we have finished loading the category structure and still can't find the subcategory
    if (!loadingCategory && selectedSubcategory && !currentSubcategory && detailedCategory.subcategories?.length > 0) {
      navigate(`/category/${categorySlug}`, { replace: true });
    }
  }, [selectedSubcategory, currentSubcategory, navigate, categorySlug, loadingCategory, detailedCategory]);

  const getBackLink = (): string => {
    if (!selectedSubcategory) return '/';
    
    const findParent = (subs: Subcategory[], target: number, parent: number | null = null): number | null => {
      if (!subs) return null;
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
    
    const parentId = findParent(detailedCategory.subcategories, selectedSubcategory, null);
    if (parentId) {
      return `/category/${categorySlug}/sub/${parentId}`;
    } else {
      return `/category/${categorySlug}`;
    }
  };

  const getSelectedSubcategoryName = () => {
    if (!selectedSubcategory) return category.name;
    const found = findSubcategory(detailedCategory.subcategories, selectedSubcategory);
    return found?.name || category.name;
  };

  const subcategoriesToShow = useMemo(() => {
    // If loading, show nothing yet to avoid flicker
    if (loadingCategory) return [];
    
    const base = selectedSubcategory
      ? currentSubcategory?.subcategories || []
      : detailedCategory.subcategories;
    return sortSubcategoryTreeData(base);
  }, [selectedSubcategory, currentSubcategory, detailedCategory, loadingCategory]);

  const pageHeading = getSelectedSubcategoryName();
  const fallbackTitle = `${pageHeading} | Tesla Parts Center`;
  const fallbackDescription = selectedSubcategory
    ? `Запчастини підкатегорії ${pageHeading} в категорії ${category.name}.`
    : `Категорія ${category.name}: підберіть запчастини для вашої Tesla.`;

  const backLink = getBackLink();

  const loading = loadingProducts || loadingCategory;

  return (
    <div className="mt-8">
      <SeoHead
        title={category.meta_title}
        description={category.meta_description}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
      />
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* ЗАМІНЕНО: button onClick -> Link */}
        <Link to="/" className="text-gray-500 hover:text-tesla-red transition">
          ← Назад до головної
        </Link>
        {selectedSubcategory && (
          // ЗАМІНЕНО: button onClick -> Link (динамічний розрахунок URL)
          <Link to={backLink} className="text-gray-500 hover:text-tesla-red transition">
            ← Назад
          </Link>
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
        products.length > 0 && (
          <ProductList
            title={subcategoriesToShow.length > 0 ? "Товари" : undefined}
            products={products}
            currency={currency}
            uahPerUsd={uahPerUsd}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
        )
      )}

      {!loading && subcategoriesToShow.length === 0 && products.length === 0 && (
        <p className="text-gray-500 italic">В цій категорії поки немає товарів чи підкатегорій.</p>
      )}
    </div>
  );
};

interface ProductDetailRouteProps {
  currency: Currency;
  uahPerUsd: number;
  onAddToCart: (product: Product) => void;
  onNavigateBack: (product: Product) => void;
  onNavigateHome: () => void;
}

const ProductDetailRoute: React.FC<ProductDetailRouteProps> = ({
  currency,
  uahPerUsd,
  onAddToCart,
  onNavigateBack,
  onNavigateHome,
}) => {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await api.getProduct(productId);
        setProduct(data);
      } catch (e) {
        console.error("Failed to fetch product", e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-600 mb-4">Товар не знайдено.</p>
        {/* ЗАМІНЕНО: button -> Link */}
        <Link
          to="/"
          className="bg-tesla-dark text-white px-6 py-2 rounded-md hover:bg-gray-800 transition inline-block"
        >
          На головну
        </Link>
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