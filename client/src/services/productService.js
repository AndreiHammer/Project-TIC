import api from './api'

export const productService = {
    async getAllProducts() {
        try {
            const response = await api.get('/products')
            return {
                success: true,
                data: response.data,
            }
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
            const response = await api.delete(`/products/${id}`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete product',
            }
        }
    },

    async updateProductStock(id, stockChange) {
        try {
            const response = await api.patch(`/products/${id}/stock`, { stockChange })
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
    },
}

export default productService