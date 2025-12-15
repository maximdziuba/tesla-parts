export interface Subcategory {
  id: number;
  name: string;
  code?: string;
  image?: string;
  category_id: number;
  parent_id?: number | null;
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
  category: string;
  subcategory_id?: number;
  subcategory_ids?: number[];
  priceUAH: number;
  image: string;
  images?: string[];
  description: string;
  inStock: boolean;
  detail_number?: string;
  priceUSD?: number;
  cross_number: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  delivery_city: string;
  delivery_branch: string;
  payment_method: string;
  totalUAH: number;
  created_at: string;
  status: string;
  items: OrderItem[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
}
