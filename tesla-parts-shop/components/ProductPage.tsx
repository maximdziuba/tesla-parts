import React, { useState, useMemo } from 'react';
import { Product, Currency } from '../types';
import { ShoppingCart, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATE_UAH_PER_USD } from '../constants';
import SeoHead from './SeoHead';

interface ProductPageProps {
    product: Product;
    currency: Currency;
    uahPerUsd: number;
    onAddToCart: (product: Product) => void;
    onBack: () => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ product, currency, uahPerUsd, onAddToCart, onBack }) => {
    // Combine main image with additional images and remove duplicates
    const allImages = useMemo(
        () => Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean))),
        [product.image, product.images]
    );
    const [selectedImage, setSelectedImage] = useState(allImages[0]);
    const [added, setAdded] = useState(false);
    const effectiveRate = uahPerUsd > 0 ? uahPerUsd : DEFAULT_EXCHANGE_RATE_UAH_PER_USD;

    const fallbackTitle = `${product.name} | Tesla Parts Center`;
    const fallbackDescription = useMemo(() => {
        const trimmed = product.meta_description?.trim();
        if (trimmed) return trimmed;
        const desc = product.description?.trim();
        if (desc) {
            const shortened = desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}...` : desc;
            return shortened;
        }
        return `Buy ${product.name} at Tesla Parts Center`;
    }, [product.meta_description, product.description, product.name]);
    const seoImage = selectedImage || product.image;

    const handleAddToCart = () => {
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handlePrevImage = () => {
        const currentIndex = allImages.indexOf(selectedImage);
        const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        setSelectedImage(allImages[prevIndex]);
    };

    const handleNextImage = () => {
        const currentIndex = allImages.indexOf(selectedImage);
        const nextIndex = (currentIndex + 1) % allImages.length;
        setSelectedImage(allImages[nextIndex]);
    };

    const getDisplayPrice = () => {
        const priceUSD = product.priceUSD && product.priceUSD > 0
            ? product.priceUSD
            : (product.priceUAH && product.priceUAH > 0 && effectiveRate > 0
                ? product.priceUAH / effectiveRate
                : 0);
        const amount = currency === Currency.USD ? priceUSD : priceUSD * effectiveRate;
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency
        }).format(amount);
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* <SeoHead
                title={product.meta_title}
                description={product.meta_description}
                fallbackTitle={fallbackTitle}
                fallbackDescription={fallbackDescription}
                image={seoImage}               
            /> */}
            <SeoHead
                title={product.meta_title || product.name}
                description={product.meta_description}
                fallbackTitle={product.name} // Якщо немає meta_title, візьме назву
                fallbackDescription={`Купити ${product.name} за ціною ${product.price} грн`}
                image={product.image}

                // ВАЖЛИВО: Передаємо дані для Schema
                type="product"
                price={product.priceUAH}
                currency="UAH"
                availability={product.inStock}
            />
            <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-tesla-dark mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Назад
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Image Gallery */}
                    <div className="md:w-1/2 p-6 bg-gray-50">
                        <div className="relative">
                            <div className="aspect-square rounded-xl overflow-hidden bg-white mb-4 shadow-sm">
                                <img
                                    src={selectedImage}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white transition-all"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white transition-all"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImage === img ? 'border-tesla-red' : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
                        <div className="mb-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        {product.category}
                                    </span>
                                    {product.detail_number && (
                                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                            Part #: {product.detail_number}
                                        </span>
                                    )}
                                    {product.cross_number && (
                                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                            Cross #: {product.cross_number}
                                        </span>
                                    )}
                                </div>
                                {product.inStock ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        В наявності
                                    </span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Немає в наявності
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

                            <div className="mb-8">
                                <div className="text-3xl font-bold text-tesla-dark">
                                    {getDisplayPrice()}
                                </div>
                            </div>

                            <div className="prose prose-sm text-gray-600 mb-8">
                                <h3 className="text-gray-900 font-semibold mb-2">Опис</h3>
                                <p className="whitespace-pre-line">{product.description}</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <button
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${added
                                    ? 'bg-green-600 text-white'
                                    : product.inStock
                                        ? 'bg-tesla-red text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {added ? (
                                    <>
                                        <Check size={24} />
                                        Додано в кошик
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={24} />
                                        {product.inStock ? 'Купити' : 'Немає в наявності'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
