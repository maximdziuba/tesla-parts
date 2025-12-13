import { Product, OrderData } from '../types';

const API_URL = 'http://127.0.0.1:8000';

export const api = {
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_URL}/products/`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getLabels: async (): Promise<string[]> => {
        const res = await fetch(`${API_URL}/products/labels`);
        if (!res.ok) throw new Error('Failed to fetch labels');
        return res.json();
    },

    createOrder: async (orderData: OrderData) => {
        // Transform frontend OrderData to backend schema if needed
        // Backend expects: items, totalUAH, customer, delivery, paymentMethod
        // Frontend OrderData matches this structure mostly.

        const payload = {
            items: orderData.items,
            totalUAH: orderData.totalUAH,
            customer: orderData.customer,
            delivery: orderData.delivery,
            paymentMethod: orderData.paymentMethod
        };

        const res = await fetch(`${API_URL}/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
    },

    getCities: async (): Promise<any[]> => {
        // Mock cities for now as backend doesn't have this endpoint
        return [
            {
                id: '1',
                name: 'Kyiv',
                branches: [
                    { id: '1', description: 'Branch #1' },
                    { id: '2', description: 'Branch #2' }
                ]
            },
            {
                id: '2',
                name: 'Lviv',
                branches: [
                    { id: '3', description: 'Branch #1' }
                ]
            }
        ];
    }
};
