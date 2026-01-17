import api from './api'

export const cartService = {
    async getCart() {
        try {
            const response = await api.get('/cart')
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch cart',
            }
        }
    },

    async addToCart(productId, quantity = 1) {
        try {
            const response = await api.post('/cart', { productId, quantity })
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to add item to cart',
            }
        }
    },

    async updateCartItem(productId, quantity) {
        try {
            const response = await api.put(`/cart/${productId}`, { quantity })
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update cart item',
            }
        }
    },

    async removeFromCart(productId) {
        try {
            const response = await api.delete(`/cart/${productId}`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to remove item from cart',
            }
        }
    },

    async clearCart() {
        try {
            const response = await api.delete('/cart')
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to clear cart',
            }
        }
    },
}

export default cartService