import { MOCK_PRODUCTS, MOCK_CITIES } from '../constants';
import { Product, City, OrderData } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getProducts: async (): Promise<Product[]> => {
    await delay(500);
    return MOCK_PRODUCTS;
  },

  getCities: async (): Promise<City[]> => {
    await delay(300); // Simulate fetching Nova Post cities
    return MOCK_CITIES;
  },

  saveOrder: async (order: OrderData): Promise<{ success: boolean; orderId: string }> => {
    await delay(1500); // Simulate processing
    console.log("Order saved to backend:", order);
    return { success: true, orderId: `ORD-${Date.now()}` };
  }
};