import { Product, Order, Category, Subcategory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getHeaders = (isMultipart: boolean = false) => {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if it's not a multipart request
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Define a temporary function to be replaced by the actual AuthContext logout
// This prevents a circular dependency with AuthContext importing ApiService, and ApiService needing AuthContext for logout.
// The real logout will be passed as a setter by AuthContext later.
let onUnauthorized: () => void = () => { console.warn("onUnauthorized callback not set in ApiService"); };

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
};

// Helper to check token expiration (very basic, actual JWT parsing would be better)
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + (5 * 60 * 1000); // Consider expired 5 mins before actual expiry
  } catch (e) {
    return true; // Malformed token
  }
};

// Generic authenticated fetch wrapper with refresh token logic
// async function _authenticatedFetch(url: string, options: RequestInit = {}, isMultipart: boolean = false): Promise<Response> {
//   const accessToken = localStorage.getItem('accessToken');
//   const refreshToken = localStorage.getItem('refreshToken');

//   // If token is expired or about to expire, try to refresh
//   if (isTokenExpired(accessToken) && refreshToken) {
//     try {
//       const refreshResponse = await ApiService.refreshToken(refreshToken);
//       localStorage.setItem('accessToken', refreshResponse.access_token);
//       localStorage.setItem('refreshToken', refreshResponse.refresh_token);
//     } catch (refreshError) {
//       console.error("Token refresh failed:", refreshError);
//       onUnauthorized(); // Refresh failed, log out
//       throw new Error("Unauthorized: Token refresh failed.");
//     }
//   }

//   // After potential refresh, get new headers
//   let headers = getHeaders(isMultipart);
//   options.headers = { ...headers, ...options.headers };

//   let response = await fetch(url, options);

//   // If unauthorized after retry or if initial 401 on auth endpoints, and not on auth endpoint itself
//   if (response.status === 401 && !url.includes('/auth/')) {
//     onUnauthorized();
//     throw new Error("Unauthorized: Invalid credentials or session expired.");
//   }

//   return response;
// }

// Generic authenticated fetch wrapper with refresh token logic
async function _authenticatedFetch(url: string, options: RequestInit = {}, isMultipart: boolean = false): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (isTokenExpired(accessToken) && refreshToken) {
        try {
      const refreshResponse = await ApiService.refreshToken(refreshToken);
      localStorage.setItem('accessToken', refreshResponse.access_token);
      localStorage.setItem('refreshToken', refreshResponse.refresh_token);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      onUnauthorized(); // Refresh failed, log out
      throw new Error("Unauthorized: Token refresh failed.");
    }
  }

  let headers = getHeaders(isMultipart); // Pass isMultipart to getHeaders
  options.headers = { ...headers, ...options.headers };

  if (options.body instanceof FormData) {
    // Якщо ми бачимо, що body - це FormData, ми МУСИМО видалити Content-Type.
    // Це дозволить браузеру самому встановити 'multipart/form-data; boundary=...'
    
    // TypeScript трюк для видалення ключа з HeadersInit
    if (options.headers && 'Content-Type' in options.headers) {
        delete (options.headers as any)['Content-Type'];
    }
    
    // Якщо headers - це об'єкт класу Headers (рідше, але буває)
    if (options.headers instanceof Headers) {
        options.headers.delete('Content-Type');
    }
}

  let response = await fetch(url, options);

  if (response.status === 401 && !url.includes('/auth/')) {
    onUnauthorized();
    throw new Error("Unauthorized: Invalid credentials or session expired.");
  }

  return response;
}


export const ApiService = {
  login: async (username: string, password: string): Promise<{ access_token: string; refresh_token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Failed to login');
    }
    return res.json();
  },

  refreshToken: async (token: string): Promise<{ access_token: string; refresh_token: string }> => {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: token }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Failed to refresh token');
    }
    return res.json();
  },

  resetPassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const res = await _authenticatedFetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Failed to reset password');
    }
    return res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await _authenticatedFetch(`${API_URL}/products/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  getProduct: async (id: string): Promise<Product> => {
    const res = await _authenticatedFetch(`${API_URL}/products/${id}`, { headers: getHeaders() });
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
    formData.append('cross_number', product.cross_number);
    formData.append('meta_title', product.meta_title ?? '');
    formData.append('meta_description', product.meta_description ?? '');

    if (product.files && product.files.length > 0) {
      product.files.forEach((file: File) => {
        formData.append('files', file);
      });
    }

    if (product.subcategory_id) {
      formData.append('subcategory_id', product.subcategory_id.toString());
    }
    if (product.subcategory_ids && product.subcategory_ids.length > 0) {
      Array.from(new Set(product.subcategory_ids)).forEach((id: number) => {
        formData.append('subcategory_ids', id.toString());
      });
    } else {
      // Explicitly send an empty list if none are selected, so FastAPI receives the parameter
      formData.append('subcategory_ids', '');
    }

    if (product.detail_number) {
      formData.append('detail_number', product.detail_number);
    }

    const res = await _authenticatedFetch(`${API_URL}/products/`, {
      method: 'POST',
      headers: getHeaders(true), // Pass true for multipart
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
    formData.append('cross_number', product.cross_number);
    formData.append('meta_title', product.meta_title ?? '');
    formData.append('meta_description', product.meta_description ?? '');

    if (product.files && product.files.length > 0) {
      product.files.forEach((file: File) => {
        formData.append('files', file);
      });
    }

    if (product.subcategory_id) {
      formData.append('subcategory_id', product.subcategory_id.toString());
    }
    if (product.subcategory_ids && product.subcategory_ids.length > 0) {
      Array.from(new Set(product.subcategory_ids)).forEach((id: number) => {
        formData.append('subcategory_ids', id.toString());
      });
    } else {
      formData.append('subcategory_ids', ''); // Explicitly send an empty value
    }

    if (product.detail_number) {
      formData.append('detail_number', product.detail_number);
    }

    if (product.kept_images !== undefined) {
      const keptList: string[] = Array.isArray(product.kept_images)
        ? product.kept_images.filter((url: string) => Boolean(url))
        : [];

      if (keptList.length === 0) {
        formData.append('kept_images', '');
      } else {
        keptList.forEach((url: string) => {
          formData.append('kept_images', url);
        });
      }
    }

    const res = await _authenticatedFetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(true), // Pass true for multipart
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await _authenticatedFetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  bulkDeleteProducts: async (ids: string[]): Promise<{ deleted: number }> => {
    const res = await _authenticatedFetch(`${API_URL}/products/bulk-delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ product_ids: ids }),
    });
    if (!res.ok) throw new Error('Failed to delete products');
    return res.json();
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await _authenticatedFetch(`${API_URL}/orders/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  updateOrderTtn: async (orderId: number, ttn: string): Promise<void> => {
    const res = await _authenticatedFetch(`${API_URL}/orders/${orderId}/ttn`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ttn }),
    });
    if (!res.ok) throw new Error('Failed to update order TTN');
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<void> => {
    const res = await _authenticatedFetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await _authenticatedFetch(`${API_URL}/categories/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (name: string, file?: File, sort_order?: number, meta_title?: string, meta_description?: string): Promise<Category> => {
    const formData = new FormData();
    formData.append('name', name);
    
    if (file) {
      formData.append('file', file);
    }
    
    if (sort_order !== undefined && sort_order !== null) {
      formData.append('sort_order', sort_order.toString());
    }
    formData.append('meta_title', meta_title ?? '');
    formData.append('meta_description', meta_description ?? '');

    const res = await _authenticatedFetch(`${API_URL}/categories/`, {
      method: 'POST',
      headers: getHeaders(true), // Pass true for multipart
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  updateCategory: async (id: number, name: string, file?: File, sort_order?: number, meta_title?: string, meta_description?: string): Promise<Category> => {
    const formData = new FormData();
    formData.append('name', name);
    
    if (file) {
      formData.append('file', file);
    }
    
    if (sort_order !== undefined && sort_order !== null) {
      formData.append('sort_order', sort_order.toString());
    }
    formData.append('meta_title', meta_title ?? '');
    formData.append('meta_description', meta_description ?? '');

    const res = await _authenticatedFetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(true), // Pass true for multipart
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  createSubcategory: async (categoryId: number, name: string, code?: string, parentId?: number, file?: File): Promise<Subcategory> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId.toString());
    if (code) formData.append('code', code);
    if (parentId) formData.append('parent_id', parentId.toString());
    
    if (file) {
      formData.append('file', file);
    }

    const res = await _authenticatedFetch(`${API_URL}/categories/${categoryId}/subcategories/`, {
      method: 'POST',
      headers: getHeaders(true), // Pass true for multipart
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create subcategory');
    return res.json();
  },

  updateSubcategory: async (id: number, name: string, code?: string, parentId?: number, file?: File): Promise<Subcategory> => {
    const formData = new FormData();
    formData.append('name', name);
    if (code) formData.append('code', code);
    if (parentId !== undefined) formData.append('parent_id', parentId.toString());
    
    if (file) {
      formData.append('file', file);
    }

    const res = await _authenticatedFetch(`${API_URL}/categories/subcategories/${id}`, {
      method: 'PUT',
      headers: getHeaders(true), // Pass true for multipart
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update subcategory');
    return res.json();
  },

  moveSubcategory: async (id: number, targetCategoryId: number, targetParentId?: number | null): Promise<Subcategory> => {
    const res = await _authenticatedFetch(`${API_URL}/categories/subcategories/${id}/move`, {
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
    const res = await _authenticatedFetch(`${API_URL}/categories/subcategories/${id}/copy`, {
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
    const res = await _authenticatedFetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  deleteSubcategory: async (id: number): Promise<boolean> => {
    const res = await _authenticatedFetch(`${API_URL}/categories/subcategories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  checkAuth: () => {
    return !!localStorage.getItem('accessToken');
  },

  getSetting: async (key: string): Promise<{ key: string; value: string }> => {
    const res = await _authenticatedFetch(`${API_URL}/settings/${key}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch setting');
    return res.json();
  },

  updateSetting: async (key: string, value: string): Promise<{ key: string; value: string }> => {
    const res = await _authenticatedFetch(`${API_URL}/settings/${key}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  },

  getSettings: async (): Promise<{ key: string; value: string }[]> => {
    const res = await _authenticatedFetch(`${API_URL}/settings/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Pages API
  getPages: async (): Promise<any[]> => {
    const res = await _authenticatedFetch(`${API_URL}/pages/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pages');
    return res.json();
  },

  getPage: async (slugOrId: string): Promise<any> => {
    const res = await _authenticatedFetch(`${API_URL}/pages/${slugOrId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
  },

  createPage: async (page: { slug: string; title: string; content: string; is_published?: boolean; location?: string }): Promise<any> => {
    const res = await _authenticatedFetch(`${API_URL}/pages/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(page),
    });
    if (!res.ok) throw new Error('Failed to create page');
    return res.json();
  },

  updatePage: async (id: number, page: { slug?: string; title?: string; content?: string; is_published?: boolean; location?: string }): Promise<any> => {
    const res = await _authenticatedFetch(`${API_URL}/pages/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(page),
    });
    if (!res.ok) throw new Error('Failed to update page');
    return res.json();
  },

  deletePage: async (id: number): Promise<boolean> => {
    const res = await _authenticatedFetch(`${API_URL}/pages/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  },

  getSocialLinks: async (): Promise<{ instagram: string; telegram: string }> => {
    const res = await _authenticatedFetch(`${API_URL}/settings/social-links`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch social links');
    return res.json();
  },

  updateSocialLinks: async (links: { instagram: string; telegram: string }): Promise<any> => {
    const res = await _authenticatedFetch(`${API_URL}/settings/social-links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(links),
    });
    if (!res.ok) throw new Error('Failed to update social links');
    return res.json();
  },

  getStaticSeo: async (): Promise<Array<{ id: number; slug: string; meta_title: string; meta_description: string }>> => {
    const res = await _authenticatedFetch(`${API_URL}/seo/static`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch SEO records');
    return res.json();
  },

  updateStaticSeo: async (slug: string, payload: { meta_title?: string; meta_description?: string }): Promise<{ id: number; slug: string; meta_title: string; meta_description: string }> => {
    const res = await _authenticatedFetch(`${API_URL}/seo/static/${slug}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update SEO record');
    return res.json();
  },
};
