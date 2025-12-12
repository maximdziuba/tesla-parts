import React, { useState, useEffect } from 'react';
import { City, NovaPostBranch, PaymentMethod, CartItem, Currency, OrderData } from '../types';
import { api } from '../services/mockApi';
import { EXCHANGE_RATES } from '../constants';
import { CheckCircle, Truck, CreditCard, Building, Wallet } from 'lucide-react';

interface CheckoutProps {
  cartItems: CartItem[];
  currency: Currency;
  onSuccess: () => void;
  totalUAH: number;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, currency, onSuccess, totalUAH }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [branches, setBranches] = useState<NovaPostBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await api.getCities();
        setCities(data);
        if (data.length > 0) {
           // Don't auto select to force user choice, or select first
           // setSelectedCityId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch cities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      const city = cities.find(c => c.id === selectedCityId);
      setBranches(city ? city.branches : []);
      setSelectedBranchId(''); // Reset branch on city change
    } else {
      setBranches([]);
    }
  }, [selectedCityId, cities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId || !selectedBranchId) {
      alert("Будь ласка, оберіть місто та відділення доставки");
      return;
    }

    setProcessing(true);

    const city = cities.find(c => c.id === selectedCityId)?.name || '';
    const branch = branches.find(b => b.id === selectedBranchId)?.description || '';

    const order: OrderData = {
      items: cartItems,
      totalUAH,
      customer: { firstName, lastName, phone },
      delivery: { city, branch },
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    try {
      const result = await api.saveOrder(order);
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Order failed", err);
      alert("Виникла помилка при оформленні. Спробуйте ще раз.");
    } finally {
      setProcessing(false);
    }
  };

  const getPrice = (priceUAH: number) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const price = priceUAH * (currency === Currency.UAH ? 1 : rate);
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };

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
            {/* Contact Info */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">1</div>
                Контактні дані
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                  <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                  <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red focus:border-transparent outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input required type="tel" placeholder="+380..." value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-tesla-red focus:border-transparent outline-none" />
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">2</div>
                Доставка <span className="text-red-500 font-bold ml-2 text-sm flex items-center gap-1"><Truck size={14}/> Nova Post</span>
              </h2>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-500">Завантаження міст...</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                      <select 
                        required 
                        value={selectedCityId} 
                        onChange={e => setSelectedCityId(e.target.value)}
                        className="w-full border rounded-md p-2 bg-white focus:ring-2 focus:ring-tesla-red outline-none"
                      >
                        <option value="">Оберіть місто</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Відділення / Поштомат</label>
                      <select 
                        required 
                        value={selectedBranchId} 
                        onChange={e => setSelectedBranchId(e.target.value)}
                        disabled={!selectedCityId}
                        className="w-full border rounded-md p-2 bg-white focus:ring-2 focus:ring-tesla-red outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">Оберіть відділення</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.description}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">3</div>
                Оплата
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === PaymentMethod.CARD ? 'border-tesla-red bg-red-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value={PaymentMethod.CARD} checked={paymentMethod === PaymentMethod.CARD} onChange={() => setPaymentMethod(PaymentMethod.CARD)} className="text-tesla-red focus:ring-tesla-red" />
                  <div className="ml-3 flex items-center gap-3">
                    <CreditCard className="text-gray-600"/>
                    <div>
                      <div className="font-medium text-gray-900">Оплата карткою (Visa/Mastercard)</div>
                      <div className="text-xs text-gray-500">Миттєва оплата без комісії</div>
                    </div>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === PaymentMethod.IBAN ? 'border-tesla-red bg-red-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value={PaymentMethod.IBAN} checked={paymentMethod === PaymentMethod.IBAN} onChange={() => setPaymentMethod(PaymentMethod.IBAN)} className="text-tesla-red focus:ring-tesla-red" />
                  <div className="ml-3 flex items-center gap-3">
                    <Building className="text-gray-600"/>
                    <div>
                      <div className="font-medium text-gray-900">Оплата на рахунок IBAN</div>
                      <div className="text-xs text-gray-500">Менеджер зв'яжеться для надання реквізитів</div>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === PaymentMethod.COD ? 'border-tesla-red bg-red-50' : 'hover:bg-gray-50'}`}>
                  <input type="radio" name="payment" value={PaymentMethod.COD} checked={paymentMethod === PaymentMethod.COD} onChange={() => setPaymentMethod(PaymentMethod.COD)} className="text-tesla-red focus:ring-tesla-red" />
                  <div className="ml-3 flex items-center gap-3">
                    <Wallet className="text-gray-600"/>
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
                    <img src={item.image} className="w-full h-full object-cover rounded" alt="" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium line-clamp-2">{item.name}</div>
                    <div className="text-gray-500">{item.quantity} x {getPrice(item.priceUAH)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Сума товарів</span>
                <span>{getPrice(totalUAH)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span className="text-xs">(за тарифами перевізника)</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t mt-2">
                <span>Разом</span>
                <span>{getPrice(totalUAH)}</span>
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