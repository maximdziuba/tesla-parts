import React from 'react';
import { CartItem, Currency } from '../types';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { EXCHANGE_RATES } from '../constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: Currency;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const getPrice = (priceUAH: number) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const price = priceUAH * (currency === Currency.UAH ? 1 : rate);
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };

  const total = items.reduce((sum, item) => sum + (item.priceUAH * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="flex-1 flex flex-col bg-white shadow-xl animate-slide-in">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Кошик ({items.length})</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Ваш кошик порожній</p>
                <button 
                  onClick={onClose}
                  className="mt-4 text-tesla-red font-medium hover:underline"
                >
                  Повернутись до покупок
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded-md">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-sm font-bold">{getPrice(item.priceUAH * item.quantity)}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-500 self-start p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-6 bg-gray-50">
              <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
                <span>Всього</span>
                <span>{getPrice(total)}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4 text-center">Вартість доставки розраховується за тарифами перевізника</p>
              <button
                onClick={() => { onClose(); onCheckout(); }}
                className="w-full bg-tesla-red text-white py-3 rounded-md font-bold hover:bg-red-700 transition shadow-md"
              >
                Оформити замовлення
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;