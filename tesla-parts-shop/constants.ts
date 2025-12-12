import { City, Product } from './types';

export const EXCHANGE_RATES = {
  UAH: 1,
  USD: 0.024, // 1 UAH = 0.024 USD (approx 1/41)
  EUR: 0.022
};

export const MOCK_CITIES: City[] = [
  {
    id: 'kyiv',
    name: 'Київ',
    branches: [
      { id: '1', description: 'Відділення №1: вул. Пирогівський шлях, 135' },
      { id: '5', description: 'Відділення №5: вул. Федорова, 32 (метро Олімпійська)' },
      { id: '12', description: 'Відділення №12: вул. Зелена, 14' },
      { id: '250', description: 'Поштомат №250: вул. Хрещатик, 22' },
    ]
  },
  {
    id: 'lviv',
    name: 'Львів',
    branches: [
      { id: '1', description: 'Відділення №1: вул. Городоцька, 355' },
      { id: '2', description: 'Відділення №2: вул. Пластова, 7' },
      { id: '55', description: 'Відділення №55: просп. Свободи, 10' },
    ]
  },
  {
    id: 'odesa',
    name: 'Одеса',
    branches: [
      { id: '1', description: 'Відділення №1: Київське шосе, 27' },
      { id: '15', description: 'Відділення №15: вул. Тираспольська, 19' },
    ]
  },
  {
    id: 'dnipro',
    name: 'Дніпро',
    branches: [
      { id: '1', description: 'Відділення №1: вул. Маршала Малиновського, 98а' },
      { id: '3', description: 'Відділення №3: вул. Тітова, 21' },
    ]
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'm3-001',
    name: 'Передній бампер Model 3 (Primed)',
    category: 'Model 3',
    priceUAH: 12500,
    image: 'https://picsum.photos/400/300?random=1',
    description: 'Оригінальний передній бампер під фарбування. Підходить для моделей 2017-2023.',
    inStock: true,
  },
  {
    id: 'm3-002',
    name: 'Фара LED Matrix ліва Model 3',
    category: 'Model 3',
    priceUAH: 18400,
    image: 'https://picsum.photos/400/300?random=2',
    description: 'Матрична фара європейського зразка. Повністю справна, гарантія 1 рік.',
    inStock: true,
  },
  {
    id: 'm3-003',
    name: 'Фільтр салону HEPA Model 3/Y',
    category: 'Model 3',
    priceUAH: 1200,
    image: 'https://picsum.photos/400/300?random=3',
    description: 'Вугільний фільтр для очищення повітря в салоні. Рекомендована заміна кожні 15 тис. км.',
    inStock: true,
  },
  {
    id: 'ms-001',
    name: 'Пневмостійка передня Model S',
    category: 'Model S',
    priceUAH: 24500,
    image: 'https://picsum.photos/400/300?random=4',
    description: 'Відновлена оригінальна пневмостійка. Гарантія 6 місяців.',
    inStock: true,
  },
  {
    id: 'ms-002',
    name: 'Дверна ручка (Gen 3) Model S',
    category: 'Model S',
    priceUAH: 8200,
    image: 'https://picsum.photos/400/300?random=5',
    description: 'Модернізований механізм ручки, посилені шестерні.',
    inStock: true,
  },
  {
    id: 'mx-001',
    name: 'Ключ-брелок Model X',
    category: 'Model X',
    priceUAH: 5600,
    image: 'https://picsum.photos/400/300?random=6',
    description: 'Оригінальний ключ. Потребує прошивки на сервісі.',
    inStock: true,
  },
  {
    id: 'mx-002',
    name: 'Falcon Wing сенсор',
    category: 'Model X',
    priceUAH: 3100,
    image: 'https://picsum.photos/400/300?random=7',
    description: 'Ультразвуковий сенсор для дверей Falcon Wing.',
    inStock: false,
  },
];