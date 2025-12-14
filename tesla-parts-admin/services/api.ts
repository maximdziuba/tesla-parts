import { Product, Order, Category, Subcategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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

  getProduct: async (id: string): Promise<Product> => {
    const res = await fetch(`${API_URL}/products/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  createProduct: async (product: any) => {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('category', product.category);
    formData.append('priceUAH', product.priceUAH.toString());
    formData.append('priceUSD', (product.priceUSD || 0).toString());
    formData.append('description', product.description);
    formData.append('inStock', product.inStock.toString());

    if (product.files && product.files.length > 0) {
      product.files.forEach((file: File) => {
        formData.append('files', file);
      });
    } else if (product.image) {
      formData.append('image', product.image);
    }

    if (product.subcategory_id) {
      formData.append('subcategory_id', product.subcategory_id.toString());
    }

    if (product.detail_number) {
      formData.append('detail_number', product.detail_number);
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

  updateProduct: async (id: string, product: any): Promise<Product> => {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('category', product.category);
    formData.append('priceUAH', product.priceUAH.toString());
    formData.append('priceUSD', (product.priceUSD || 0).toString());
    formData.append('description', product.description);
    formData.append('inStock', product.inStock.toString());

    if (product.files && product.files.length > 0) {
      product.files.forEach((file: File) => {
        formData.append('files', file);
      });
    } else if (product.image) {
      formData.append('image', product.image);
    }

    if (product.subcategory_id) {
      formData.append('subcategory_id', product.subcategory_id.toString());
    }

    if (product.detail_number) {
      formData.append('detail_number', product.detail_number);
    }

    if (product.kept_images) {
      product.kept_images.forEach((url: string) => {
        formData.append('kept_images', url);
      });
    }

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  bulkDeleteProducts: async (ids: string[]): Promise<{ deleted: number }> => {
    const res = await fetch(`${API_URL}/products/bulk-delete`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_ids: ids }),
    });
    if (!res.ok) throw new Error('Failed to delete products');
    return res.json();
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_URL}/orders/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_URL}/categories/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (name: string, image?: string, file?: File): Promise<Category> => {
    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);
    if (file) formData.append('file', file);

    const res = await fetch(`${API_URL}/categories/`, {
      method: 'POST',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  updateCategory: async (id: number, name: string, image?: string, file?: File): Promise<Category> => {
    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);
    if (file) formData.append('file', file);

    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  createSubcategory: async (categoryId: number, name: string, image?: string, code?: string, parentId?: number, file?: File): Promise<Subcategory> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId.toString());
    if (image) formData.append('image', image);
    if (code) formData.append('code', code);
    if (parentId) formData.append('parent_id', parentId.toString());
    if (file) formData.append('file', file);

    const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories/`, {
      method: 'POST',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create subcategory');
    return res.json();
  },

  updateSubcategory: async (id: number, name: string, image?: string, code?: string, parentId?: number, file?: File): Promise<Subcategory> => {
    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);
    if (code) formData.append('code', code);
    if (parentId !== undefined) formData.append('parent_id', parentId.toString());
    if (file) formData.append('file', file);

    const res = await fetch(`${API_URL}/categories/subcategories/${id}`, {
      method: 'PUT',
      headers: {
        'x-admin-secret': localStorage.getItem('adminSecret') || '',
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update subcategory');
    return res.json();
  },

  moveSubcategory: async (id: number, targetCategoryId: number, targetParentId?: number | null): Promise<Subcategory> => {
    const res = await fetch(`${API_URL}/categories/subcategories/${id}/move`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        target_category_id: targetCategoryId,
        target_parent_id: targetParentId ?? null,
      }),
    });
    if (!res.ok) throw new Error('Failed to move subcategory');
    return res.json();
  },

  copySubcategory: async (id: number, targetCategoryId: number, targetParentId?: number | null): Promise<Subcategory> => {
    const res = await fetch(`${API_URL}/categories/subcategories/${id}/copy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        target_category_id: targetCategoryId,
        target_parent_id: targetParentId ?? null,
      }),
    });
    if (!res.ok) throw new Error('Failed to copy subcategory');
    return res.json();
  },

  deleteCategory: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  deleteSubcategory: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API_URL}/categories/subcategories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  checkAuth: () => {
    return !!localStorage.getItem('adminSecret');
  },

  getSetting: async (key: string): Promise<{ key: string; value: string }> => {
    const res = await fetch(`${API_URL}/settings/${key}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch setting');
    return res.json();
  },

  updateSetting: async (key: string, value: string): Promise<{ key: string; value: string }> => {
    const res = await fetch(`${API_URL}/settings/${key}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  },

  getSettings: async (): Promise<{ key: string; value: string }[]> => {
    const res = await fetch(`${API_URL}/settings/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Pages API
  getPages: async (): Promise<any[]> => {
    const res = await fetch(`${API_URL}/pages/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pages');
    return res.json();
  },

  getPage: async (slugOrId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/pages/${slugOrId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
  },

  createPage: async (page: { slug: string; title: string; content: string; is_published?: boolean; location?: string }): Promise<any> => {
    const res = await fetch(`${API_URL}/pages/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(page),
    });
    if (!res.ok) throw new Error('Failed to create page');
    return res.json();
  },

  updatePage: async (id: number, page: { slug?: string; title?: string; content?: string; is_published?: boolean; location?: string }): Promise<any> => {
    const res = await fetch(`${API_URL}/pages/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(page),
    });
    if (!res.ok) throw new Error('Failed to update page');
    return res.json();
  },

  deletePage: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API_URL}/pages/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },
};
