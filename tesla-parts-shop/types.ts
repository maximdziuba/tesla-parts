export enum Currency {
  UAH = 'UAH',
  USD = 'USD'
}

export interface Subcategory {
  id: number;
  name: string;
  code?: string;
  image?: string;
  subcategories?: Subcategory[];
}

export interface Category {
  id: number;
  name: string;
  image?: string;
  sort_order?: number;
  subcategories: Subcategory[];
}

export interface Product {
  id: string;
  name: string;
  category: string; // Comma-separated list of categories (e.g., "Model 3, Model Y")
  subcategory_id?: number;
  subcategory_ids?: number[];
  priceUAH: number;
  priceUSD?: number;
  image: string;
  images?: string[];
  description: string;
  inStock: boolean;
  detail_number?: string;
  cross_number: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface NovaPostBranch {
  id: string;
  description: string;
}

export interface City {
  id: string;
  name: string;
  branches: NovaPostBranch[];
}

export enum PaymentMethod {
  IBAN = 'Оплата на рахунок ФОП',
  COD = 'Накладений платіж' // Cash on Delivery
}

export interface OrderData {
  items: CartItem[];
  totalUAH: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  delivery: {
    city: string;
    branch: string;
  };
  paymentMethod: PaymentMethod;
  createdAt: string;
}
