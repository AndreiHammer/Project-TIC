import { ref, computed } from 'vue'
import cartService from '../services/cartService'

const cart = ref(null)
const loading = ref(false)
const initialized = ref(false)

const initializeCart = async () => {
    if (!initialized.value) {
        loading.value = true
        try {
            const result = await cartService.getCart()
            if (result.success) {
                cart.value = result.data
            }
        } catch (error) {
            console.error('Error initializing cart:', error)
        } finally {
            loading.value = false
            initialized.value = true
        }
    }
}

initializeCart()

export function useCart() {
    const cartItems = computed(() => cart.value?.items || [])

    const cartCount = computed(() => {
        return cart.value?.totals?.itemCount || 0
    })

    const cartTotal = computed(() => {
        return cart.value?.totals?.total || 0
    })

    const isEmpty = computed(() => cartItems.value.length === 0)

    const fetchCart = async () => {
        loading.value = true
        try {
            const result = await cartService.getCart()
            if (result.success) {
                cart.value = result.data
                return { success: true, data: result.data }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            return { success: false, error: 'Failed to fetch cart' }
        } finally {
            loading.value = false
        }
    }

    const addToCart = async (productId, quantity = 1) => {
        try {
            const result = await cartService.addToCart(productId, quantity)
            if (result.success) {
                cart.value = result.data
                return { success: true, message: 'Item added to cart' }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            return { success: false, error: 'Failed to add item to cart' }
        }
    }

    const updateCartItem = async (productId, quantity) => {
        if (quantity < 1) {
            return { success: false, error: 'Quantity must be at least 1' }
        }

        try {
            const result = await cartService.updateCartItem(productId, quantity)
            if (result.success) {
                cart.value = result.data
                return { success: true, message: 'Cart updated' }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error updating cart:', error)
            return { success: false, error: 'Failed to update cart' }
        }
    }

    const removeFromCart = async (productId) => {
        try {
            const result = await cartService.removeFromCart(productId)
            if (result.success) {
                cart.value = result.data
                return { success: true, message: 'Item removed from cart' }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error removing from cart:', error)
            return { success: false, error: 'Failed to remove item' }
        }
    }

    const clearCart = async () => {
        try {
            const result = await cartService.clearCart()
            if (result.success) {
                cart.value = result.data
                return { success: true, message: 'Cart cleared' }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error clearing cart:', error)
            return { success: false, error: 'Failed to clear cart' }
        }
    }

    return {
        cart,
        cartItems,
        cartCount,
        cartTotal,
        isEmpty,
        loading,
        fetchCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        initializeCart,
    }
}