import { Product, OrderData, Category } from '../types';

const API_URL = 'http://127.0.0.1:8000';

export const api = {
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_URL}/products/`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getProduct: async (id: string): Promise<Product> => {
        // Since we don't have a dedicated single product endpoint yet (except admin one), 
        // we can filter from all products or add a new endpoint.
        // Actually, we should add a new endpoint in backend or use the existing list and filter client side if list is small.
        // But for correctness, let's assume we might want a dedicated endpoint.
        // Wait, backend router has `read_products` (list) and `delete_product`. It DOES NOT have `read_product` (single).
        // I should add `read_product` to backend first? 
        // Or just use the list for now since we load all products in App.tsx anyway.
        // Let's use the list for now to avoid backend restart if possible, BUT user asked for "open product page", usually implies fetching details.
        // However, `App.tsx` already loads ALL products. So I can just find it in the state.
        // But if I refresh on product page, I need to fetch it.
        // Let's add a simple `read_product` endpoint to backend `routers/products.py` first.
        // Actually, I'll add it to backend now.
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    getLabels: async (): Promise<string[]> => {
        const res = await fetch(`${API_URL}/products/labels`);
        if (!res.ok) throw new Error('Failed to fetch labels');
        return res.json();
    },

    getCategories: async (): Promise<Category[]> => {
        const res = await fetch(`${API_URL}/categories/`);
        if (!res.ok) throw new Error('Failed to fetch categories');
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
    },

    getPage: async (slug: string): Promise<{ id: number; slug: string; title: string; content: string; is_published: boolean; location: string } | null> => {
        try {
            const res = await fetch(`${API_URL}/pages/${slug}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    getSetting: async (key: string): Promise<string | null> => {
        try {
            const res = await fetch(`${API_URL}/settings/${key}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.value;
        } catch {
            return null;
        }
    }
};
