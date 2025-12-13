import { Product, Order } from '../types';

const API_URL = 'http://127.0.0.1:8000';

const getHeaders = () => {
  const secret = localStorage.getItem('adminSecret');
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': secret || '',
  };
};

export const ApiService = {
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  createProduct: async (product: any) => {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('category', product.category);
    formData.append('priceUAH', product.priceUAH.toString());
    formData.append('description', product.description);
    formData.append('inStock', product.inStock.toString());

    if (product.file) {
      formData.append('file', product.file);
    } else if (product.image) {
      formData.append('image', product.image);
    }

    const res = await fetch(`${API_URL}/products/`, {
      method: 'POST',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/orders/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  checkAuth: () => {
    return !!localStorage.getItem('adminSecret');
  }
};