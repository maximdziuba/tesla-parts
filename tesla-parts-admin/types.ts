export interface Product {
  id: string;
  name: string;
  category: string;
  priceUAH: number;
  image: string;
  description: string;
  inStock: boolean;
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