import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, X, Instagram, Send, Phone, Info, Truck, RefreshCw, HelpCircle } from 'lucide-react';
import { Currency } from '../types';
import teslaLogo from '../static/tesla-logo.png';
import TeslaPartsCenterLogo from './ShopLogo';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onCartClick: () => void;
  onNavigate: (page: string) => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  cartTotal, 
  currency, 
  setCurrency, 
  onCartClick, 
  onNavigate,
  onSearch
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Row: Utilities & Info */}
      <div className="bg-tesla-dark text-gray-300 text-xs py-2 px-4 border-b border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <nav className="flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
            <button onClick={() => onNavigate('about')} className="hover:text-white transition">Про магазин</button>
            <button onClick={() => onNavigate('delivery')} className="hover:text-white transition">Доставка та оплата</button>
            <button onClick={() => onNavigate('returns')} className="hover:text-white transition">Обмін та повернення</button>
            <button onClick={() => onNavigate('faq')} className="hover:text-white transition">FAQ</button>
            <button onClick={() => onNavigate('contacts')} className="hover:text-white transition">Контакти</button>
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <a href="#" className="hover:text-tesla-red transition"><Instagram size={16} /></a>
              <a href="#" className="hover:text-tesla-red transition"><Send size={16} /></a>
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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo */}
          <TeslaPartsCenterLogo onNavigate={onNavigate} />

          {/* Desktop Search & Menu */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl px-8 gap-6">
             {/* Category Links */}
            <div className="flex gap-4 font-medium text-tesla-dark whitespace-nowrap">
              <button onClick={() => onNavigate('Model 3')} className="hover:text-tesla-red transition">Model 3</button>
              <button onClick={() => onNavigate('Model S')} className="hover:text-tesla-red transition">Model S</button>
              <button onClick={() => onNavigate('Model X')} className="hover:text-tesla-red transition">Model X</button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                placeholder="Пошук запчастин..."
                className="w-full bg-gray-100 border-none rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-tesla-red focus:bg-white transition outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </form>
          </div>

          {/* Cart & Checkout */}
          <div className="flex items-center gap-4">
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
                <div className="font-bold text-tesla-dark">{formatPrice(cartTotal)}</div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('checkout')}
              className="hidden sm:block bg-tesla-red hover:bg-red-700 text-white px-5 py-2 rounded-md font-medium transition text-sm shadow-sm"
            >
              Оформити
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
             <form onSubmit={(e) => { handleSearchSubmit(e); setIsMenuOpen(false); }} className="relative">
              <input
                type="text"
                placeholder="Пошук..."
                className="w-full bg-gray-100 rounded-lg py-3 px-4 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </form>
            <div className="flex flex-col gap-2 font-medium text-lg">
              <button onClick={() => { onNavigate('Model 3'); setIsMenuOpen(false); }} className="text-left py-2 border-b border-gray-100">Model 3</button>
              <button onClick={() => { onNavigate('Model S'); setIsMenuOpen(false); }} className="text-left py-2 border-b border-gray-100">Model S</button>
              <button onClick={() => { onNavigate('Model X'); setIsMenuOpen(false); }} className="text-left py-2 border-b border-gray-100">Model X</button>
              <button onClick={() => { onNavigate('checkout'); setIsMenuOpen(false); }} className="text-left py-2 text-tesla-red">Оформити замовлення</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;