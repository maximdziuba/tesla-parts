import React from 'react';
import { Product, Currency } from '../types';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATE_UAH_PER_USD } from '../constants';

interface ProductListProps {
  products: Product[];
  currency: Currency;
  uahPerUsd: number;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  title?: string;
}

const ProductList: React.FC<ProductListProps> = ({ products, currency, uahPerUsd, onAddToCart, onProductClick, title }) => {
  const effectiveRate = uahPerUsd > 0 ? uahPerUsd : DEFAULT_EXCHANGE_RATE_UAH_PER_USD;

  const getUsdPrice = (product: Product) => {
    if (product.priceUSD && product.priceUSD > 0) return product.priceUSD;
    if (product.priceUAH && product.priceUAH > 0 && effectiveRate > 0) {
      return product.priceUAH / effectiveRate;
    }
    return 0;
  };

  const formatPrice = (product: Product) => {
    const usd = getUsdPrice(product);
    const amount = currency === Currency.USD ? usd : usd * effectiveRate;
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg shadow-sm">
        <div className="text-gray-400 mb-4 flex justify-center"><AlertCircle size={48} /></div>
        <h3 className="text-xl font-medium text-gray-900">Товарів не знайдено</h3>
        <p className="text-gray-500 mt-2">Спробуйте змінити параметри пошуку або обрати іншу категорію.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {title && <h2 className="text-2xl font-bold mb-6 text-tesla-dark border-l-4 border-tesla-red pl-4">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onProductClick(product)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col cursor-pointer group"
          >
            <div className="relative h-48 bg-gray-100">
              {/* Placeholder for real images. In a real app, use next/image or optimized img */}
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {!product.inStock && (
                <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                  Немає в наявності
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="text-xs text-gray-500 mb-1">{product.category}</div>
              {product.detail_number && (
                <div className="text-xs text-gray-500 mb-1">{product.detail_number}</div>
              )}
              {product.cross_number && (
                <div className="text-[11px] text-gray-400 mb-1">Cross: {product.cross_number}</div>
              )}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-tesla-red transition-colors">{product.name}</h3>

              <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-tesla-dark">
                    {formatPrice(product)}
                  </span>
                  {/* {product.priceUSD && (
                    <span className="text-sm text-gray-500">
                      ${product.priceUSD.toFixed(2)}
                    </span>
                  )} */}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  disabled={!product.inStock}
                  className={`p-2 rounded-full transition ${product.inStock
                    ? 'bg-tesla-light text-tesla-dark hover:bg-tesla-red hover:text-white'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  aria-label="Додати в кошик"
                >
                  <ShoppingBag size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
