import React, { useState } from 'react';
import { PaymentMethod, CartItem, Currency, OrderData } from '../types';
import { api } from '../services/api';
import { Truck, CreditCard, Building, Wallet } from 'lucide-react';
import NovaPostWidget from '../components/NovaPostWidget'; // Ensure this path is correct
import { DEFAULT_EXCHANGE_RATE_UAH_PER_USD } from '../constants';

interface CheckoutProps {
  cartItems: CartItem[];
  currency: Currency;
  uahPerUsd: number;
  onSuccess: () => void;
  totalUAH: number;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, currency, uahPerUsd, onSuccess, totalUAH }) => {
  // --- Form State ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.IBAN);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // --- Delivery State (Simplified) ---
  // We no longer need arrays for cities/warehouses. We just store the final result.
  const [deliveryData, setDeliveryData] = useState<{ 
    city: string; 
    branch: string; 
    ref: string;
    address: string;
  } | null>(null);

  const [processing, setProcessing] = useState(false);

  // --- Handlers ---

  const handleNovaPostSelect = (data: { ref: string; description: string; city: string; address: string }) => {
    setDeliveryData({
      city: data.city,
      branch: data.description, // e.g., "Department No 1"
      address: data.address,    // e.g., "Kyiv, Khreshchatyk str..."
      ref: data.ref             // UUID for backend
    });
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const parts = [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6, 8),
      digits.slice(8, 10),
    ].filter(Boolean);
    return parts.join(' ');
  };

  const validatePhone = (value: string) => {
    const pattern = /^0\d{2}\s\d{3}\s\d{2}\s\d{2}$/;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError("Номер має містити 10 цифр у форматі 0XX XXX XX XX");
      return false;
    }
    if (!pattern.test(value)) {
      setPhoneError("Номер має бути у форматі 0XX XXX XX XX");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    if (!formatted) {
      setPhoneError(null);
      return;
    }

    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError(null);
      return;
    }

    validatePhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      alert("Будь ласка, введіть коректний номер телефону");
      return;
    }

    if (!deliveryData) {
      alert("Будь ласка, оберіть відділення доставки на мапі");
      return;
    }

    setProcessing(true);

    const order: OrderData = {
      items: cartItems,
      totalUAH,
      customer: { firstName, lastName, phone },
      delivery: { 
        city: deliveryData.city, 
        branch: `${deliveryData.branch} (${deliveryData.address})` // Save full info
      },
      paymentMethod,
      createdAt: new Date().toISOString(),
      // Optional: You can add deliveryRef to your OrderData type if you want to store the UUID
      // deliveryRef: deliveryData.ref 
    };

    try {
      await api.createOrder(order);
      onSuccess();
    } catch (err) {
      console.error("Order failed", err);
      alert("Виникла помилка при оформленні. Спробуйте ще раз.");
    } finally {
      setProcessing(false);
    }
  };

  const effectiveRate = uahPerUsd > 0 ? uahPerUsd : DEFAULT_EXCHANGE_RATE_UAH_PER_USD;
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatItemPrice = (item: CartItem) => {
    const priceUSD = item.priceUSD && item.priceUSD > 0
      ? item.priceUSD
      : (item.priceUAH && item.priceUAH > 0 && effectiveRate > 0 ? item.priceUAH / effectiveRate : 0);
    const amount = currency === Currency.USD ? priceUSD : priceUSD * effectiveRate;
    return formatAmount(amount);
  };
  const totalDisplayAmount = currency === Currency.UAH ? totalUAH : (effectiveRate > 0 ? totalUAH / effectiveRate : totalUAH);

  if (cartItems.length === 0) {
    return <div className="p-8 text-center text-gray-500">Кошик порожній</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-tesla-dark">Оформлення замовлення</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-8">

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Contact Info */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">1</div>
                Контактні дані
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    required
                    type="tel"
                    placeholder="0XX XX XX XX"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red outline-none ${phoneError ? 'border-red-500' : ''}`}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Delivery (Using NovaPostWidget) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">2</div>
                Доставка <span className="text-red-500 font-bold ml-2 text-sm flex items-center gap-1"><Truck size={14} /> Nova Post</span>
              </h2>
              
              <div className="space-y-4">
                {/* The Map Widget */}
                <NovaPostWidget onSelect={handleNovaPostSelect} />

                {/* Validation / Selection Message */}
                {deliveryData ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex flex-col">
                    <span className="font-bold">✓ Вибрано:</span>
                    <span>{deliveryData.city}</span>
                    <span>{deliveryData.branch}</span>
                    <span className="text-xs text-gray-500 mt-1">{deliveryData.address}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic pl-1">
                    * Оберіть відділення або поштомат на карті вище
                  </div>
                )}
              </div>
            </section>

            {/* 3. Payment */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">3</div>
                Оплата
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === PaymentMethod.IBAN ? 'border-tesla-red bg-red-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value={PaymentMethod.IBAN} checked={paymentMethod === PaymentMethod.IBAN} onChange={() => setPaymentMethod(PaymentMethod.IBAN)} className="text-tesla-red focus:ring-tesla-red" />
                  <div className="ml-3 flex items-center gap-3">
                    <Building className="text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Оплата на рахунок ФОП</div>
                      <div className="text-xs text-gray-500">Менеджер зв'яжеться для надання реквізитів</div>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === PaymentMethod.COD ? 'border-tesla-red bg-red-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value={PaymentMethod.COD} checked={paymentMethod === PaymentMethod.COD} onChange={() => setPaymentMethod(PaymentMethod.COD)} className="text-tesla-red focus:ring-tesla-red" />
                  <div className="ml-3 flex items-center gap-3">
                    <Wallet className="text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Накладений платіж</div>
                      <div className="text-xs text-gray-500">Оплата при отриманні на пошті (+ комісія перевізника)</div>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </form>

        </div>

        {/* Right Column: Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-24">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Ваше замовлення</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-2 custom-scrollbar">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover rounded" alt={item.name} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium line-clamp-2">{item.name}</div>
                    <div className="text-gray-500">{item.quantity} x {formatItemPrice(item)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Сума товарів</span>
                <span>{formatAmount(totalDisplayAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span className="text-xs">(за тарифами перевізника)</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t mt-2">
                <span>Разом</span>
                <span>{formatAmount(totalDisplayAmount)}</span>
              </div>
            </div>

            <button
              form="checkout-form"
              disabled={processing}
              type="submit"
              className="w-full bg-tesla-red text-white py-3 rounded-md font-bold hover:bg-red-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {processing ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Підтвердити замовлення"
              )}
            </button>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Натискаючи кнопку, ви погоджуєтесь з умовами публічної оферти
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
