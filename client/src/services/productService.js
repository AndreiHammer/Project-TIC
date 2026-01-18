import api from './api'

export const productService = {
    async getAllProducts(params = {}) {
        try {
            const {
                offset = 0,
                limit = 12,
                minPrice,
                maxPrice,
                search,
                sortBy,
                sortOrder,
                bustCache = false
            } = params;

            const queryParams = new URLSearchParams({
                offset: offset.toString(),
                limit: limit.toString(),
            });

            if (minPrice !== undefined) queryParams.append('minPrice', minPrice.toString());
            if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice.toString());
            if (search) queryParams.append('search', search);
            if (sortBy) queryParams.append('sortBy', sortBy);
            if (sortOrder) queryParams.append('sortOrder', sortOrder);
            if (bustCache) queryParams.append('_t', Date.now().toString());

            const response = await api.get(`/products?${queryParams.toString()}`);
            return {
                success: true,
                data: response.data.products,
                pagination: response.data.pagination,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch products',
            }
        }
    },

    async getProductById(id) {
        try {
            const response = await api.get(`/products/${id}`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch product',
            }
        }
    },

    async createProduct(productData) {
        try {
            const response = await api.post('/products', productData)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create product',
            }
        }
    },

    async updateProduct(id, productData) {
        try {
            const response = await api.put(`/products/${id}`, productData)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update product',
            }
        }
    },

    async deleteProduct(id) {
        try {
            await api.delete(`/products/${id}`)
            return {
                success: true
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete product',
            }
        }
    },

    async updateProductStock(id, quantityChange, reservedChange = 0) {
        try {
            const response = await api.patch(`/products/${id}/stock`, {
                quantityChange,
                reservedChange
            })
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update stock',
            }
        }
    }
}

export default productService