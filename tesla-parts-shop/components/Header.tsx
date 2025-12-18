import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Instagram, Send, ChevronDown } from 'lucide-react';
import { Category, Currency, Page } from '../types';
import TeslaPartsCenterLogo from './ShopLogo';
interface HeaderProps {
  cartCount: number;
  cartTotalUSD: number;
  currency: Currency;
  uahPerUsd: number;
  categories: Category[];
  setCurrency: (c: Currency) => void;
  onCartClick: () => void;
  onNavigate: (page: string) => void;
  onSearch: (query: string) => void;
  socialLinks: {
    instagram: string;
    telegram: string;
  };
  phoneNumber: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  headerPages: Page[];
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  cartTotalUSD, 
  currency, 
  uahPerUsd,
  categories,
  setCurrency, 
  onCartClick, 
  onNavigate,
  onSearch,
  socialLinks,
  phoneNumber,
  searchQuery,
  onSearchQueryChange,
  headerPages,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const [isPagesDropdownOpen, setIsPagesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container
  const pagesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (pagesDropdownRef.current && !pagesDropdownRef.current.contains(event.target as Node)) {
        setIsPagesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, pagesDropdownRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSearchChange = (value: string) => {
    onSearchQueryChange(value);
    onSearch(value);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };
  const displayCartTotal = (() => {
    const rate = uahPerUsd > 0 ? uahPerUsd : 1;
    return currency === Currency.UAH ? cartTotalUSD * rate : cartTotalUSD;
  })();

  const sortedCategories = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Row: Utilities & Info */}
      <div className="bg-tesla-dark text-gray-300 text-xs py-2 px-4 border-b border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <nav className="hidden md:flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
            {headerPages.filter(page => page.is_published).map((page) => (
              <button key={page.slug} onClick={() => onNavigate(page.slug)} className="hover:text-white transition">{page.title}</button>
            ))}
          </nav>
          
          <div className="relative md:hidden" ref={pagesDropdownRef}>
            <button onClick={() => setIsPagesDropdownOpen(!isPagesDropdownOpen)} className="flex items-center gap-1 hover:text-white transition">
              Навігація
              <ChevronDown size={16} />
            </button>
            {isPagesDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-20">
                {headerPages.filter(page => page.is_published).map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => { onNavigate(page.slug); setIsPagesDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {phoneNumber && (
                <a href={`tel:${phoneNumber}`} className="hover:text-white transition">
                    {phoneNumber}
                </a>
            )}
            <div className="flex items-center gap-2">
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-tesla-red tra nsition"><Instagram size={16} /></a>
              )}
              {socialLinks.telegram && (
                <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-tesla-red transition"><Send size={16} /></a>
              )}
            </div>
            <div className="border-l border-gray-700 pl-4 flex gap-2">
              {Object.values(Currency).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`font-semibold ${currency === cur ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Main Nav, Logo, Cart */}
      <div className="container mx-auto px-4 py-2 md:py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo */}
          <TeslaPartsCenterLogo onNavigate={onNavigate} />

          {/* Desktop Categories Menu */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl px-8 gap-6">
             {/* Category Links */}
            <div className="flex gap-4 font-medium text-tesla-dark whitespace-nowrap">
              {sortedCategories.slice(0, 4).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(cat.name)}
                  className="hover:text-tesla-red transition"
                >
                  {cat.name}
                </button>
              ))}
              {sortedCategories.length > 4 && (
                <div className="relative" ref={dropdownRef}> {/* Add ref here */}
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle on click
                    className="flex items-center hover:text-tesla-red transition"
                  >
                    Усі категорії <ChevronDown size={16} className="ml-1" />
                  </button>
                  <div className={`absolute left-0 top-full mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10 ${isDropdownOpen ? 'block' : 'hidden'}`}> {/* Conditional class */}
                    {sortedCategories.slice(4).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { onNavigate(cat.name); setIsDropdownOpen(false); }} // Close dropdown on item click
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="flex items-center gap-4">
            {/* Desktop Search Bar aligned near cart */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Пошук запчастин..."
                  className="w-full bg-gray-100 border-none rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-tesla-red focus:bg-white transition outline-none"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </form>

            <div 
              onClick={onCartClick}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative">
                <ShoppingCart className="text-tesla-dark group-hover:text-tesla-red transition" size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-tesla-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-sm text-right leading-tight">
                <div className="text-gray-500 text-xs">Кошик</div>
                <div className="font-bold text-tesla-dark">{formatPrice(displayCartTotal)}</div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('checkout')}
              className="hidden sm:block bg-tesla-red hover:bg-red-700 text-white px-5 py-2 rounded-md font-medium transition text-sm shadow-sm"
            >
              Оформити
            </button>

            {/* Mobile Search Toggle */}
            <button
              className="md:hidden text-tesla-dark"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search size={24} />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-tesla-dark"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100 space-y-4 pb-4">
            <div className="flex flex-col gap-2 font-medium text-lg">
              {sortedCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onNavigate(cat.name); setIsMenuOpen(false); }}
                  className="text-left py-2 border-b border-gray-100"
                >
                  {cat.name}
                </button>
              ))}

            </div>
          </div>
        )}

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="md:hidden absolute top-0 left-0 w-full h-full bg-white z-20 flex items-center px-4">
            <form onSubmit={(e) => { handleSearchSubmit(e); setIsMobileSearchOpen(false); }} className="flex items-center gap-2 w-full">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Пошук..."
                  className="w-full bg-gray-100 rounded-lg py-3 px-4 pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-tesla-dark"
              >
                <X size={24} />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
