import api from './api'

export const orderService = {
    async createOrder(orderData) {
        try {
            const response = await api.post('/orders', orderData)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create order',
            }
        }
    },

    async getOrders() {
        try {
            const response = await api.get('/orders')
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch orders',
            }
        }
    },

    async getOrderById(id) {
        try {
            const response = await api.get(`/orders/${id}`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch order',
            }
        }
    },

    async cancelOrder(id) {
        try {
            const response = await api.post(`/orders/${id}/cancel`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to cancel order',
            }
        }
    },

    async updateOrderStatus(id, status) {
        try {
            const response = await api.patch(`/orders/${id}/status`, { status })
            return {
                success: true,
                data: response.data,
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update order status',
            }
        }
    },
}

export default orderService