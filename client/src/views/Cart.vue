<template>
    <v-app>
        <AppNav title="Shopping Cart" icon="mdi-cart" :cart-count="cartCount" :show-cart="false" />

        <v-main>
            <v-container class="pa-6">
                <v-row v-if="loading && !cart">
                    <v-col cols="12">
                        <v-skeleton-loader type="table"></v-skeleton-loader>
                    </v-col>
                </v-row>

                <v-row v-else-if="isEmpty">
                    <v-col cols="12" class="text-center py-12">
                        <v-icon icon="mdi-cart-outline" size="120" color="grey-lighten-1"></v-icon>
                        <h2 class="text-h4 font-weight-bold mt-6 mb-4">Your cart is empty</h2>
                        <p class="text-h6 text-medium-emphasis mb-6">
                            Add some products to get started!
                        </p>
                        <v-btn color="primary" size="large" @click="goToProducts">
                            <v-icon icon="mdi-store" start></v-icon>
                            Browse Products
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row v-else>
                    <v-col cols="12" md="8">
                        <v-card elevation="3">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                Cart Items ({{ cartCount }})
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-list lines="three">
                                <template v-for="(item, index) in cartItems" :key="item.productId">
                                    <v-list-item class="pa-4" @click="goToProduct(item.productId)">
                                        <template v-slot:prepend>
                                            <v-avatar size="80" rounded="lg" color="grey-lighten-3">
                                                <v-img v-if="item.image" :src="item.image" :alt="item.productName"
                                                    cover></v-img>
                                                <v-icon v-else icon="mdi-image" size="40" color="grey"></v-icon>
                                            </v-avatar>
                                        </template>

                                        <v-list-item-title class="text-h6 font-weight-bold mb-2">
                                            {{ item.productName }}
                                        </v-list-item-title>

                                        <v-list-item-subtitle class="mb-3">
                                            <span class="text-h6 text-primary font-weight-bold">
                                                €{{ getItemPrice(item).toFixed(2) }}
                                            </span>
                                            <span class="text-medium-emphasis ml-2">each</span>
                                            <v-chip v-if="item.stockIssue" color="warning" size="small" class="ml-2">
                                                <v-icon icon="mdi-alert" start size="small"></v-icon>
                                                Limited stock
                                            </v-chip>
                                        </v-list-item-subtitle>

                                        <div class="d-flex align-center" @click.stop>
                                            <v-btn-group density="compact" variant="outlined" color="primary">
                                                <v-btn icon="mdi-minus" size="small" :disabled="item.quantity <= 1"
                                                    @click="decrementQuantity(item)"></v-btn>
                                                <v-btn disabled class="px-6">
                                                    {{ item.quantity }}
                                                </v-btn>
                                                <v-btn icon="mdi-plus" size="small"
                                                    @click="incrementQuantity(item)"></v-btn>
                                            </v-btn-group>

                                            <span class="text-h6 font-weight-bold ml-6">
                                                €{{ (getItemPrice(item) * item.quantity).toFixed(2) }}
                                            </span>

                                            <v-spacer></v-spacer>

                                            <v-btn icon="mdi-delete" color="error" variant="text"
                                                @click.stop="confirmRemove(item)"></v-btn>
                                        </div>
                                    </v-list-item>

                                    <v-divider v-if="index < cartItems.length - 1"></v-divider>
                                </template>
                            </v-list>

                            <v-divider></v-divider>

                            <v-card-actions class="pa-6">
                                <v-btn color="error" variant="outlined" @click="confirmClearCart"
                                    :disabled="clearingCart">
                                    <v-icon icon="mdi-delete-sweep" start></v-icon>
                                    Clear Cart
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card elevation="3" class="sticky-summary">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                Order Summary
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-card-text class="pa-6">
                                <div class="d-flex justify-space-between mb-3">
                                    <span class="text-body-1">Subtotal:</span>
                                    <span class="text-body-1 font-weight-medium">
                                        €{{ (cart?.totals?.subtotal || 0).toFixed(2) }}
                                    </span>
                                </div>

                                <div class="d-flex justify-space-between mb-3">
                                    <span class="text-body-1">Items:</span>
                                    <span class="text-body-1 font-weight-medium">
                                        {{ cart?.totals?.itemCount || 0 }}
                                    </span>
                                </div>

                                <v-divider class="my-4"></v-divider>

                                <div class="d-flex justify-space-between mb-4">
                                    <span class="text-h6 font-weight-bold">Total:</span>
                                    <span class="text-h5 font-weight-bold text-primary">
                                        €{{ (cart?.totals?.total || 0).toFixed(2) }}
                                    </span>
                                </div>

                                <v-btn color="primary" size="x-large" block class="mb-3" @click="proceedToCheckout">
                                    <v-icon icon="mdi-cart-arrow-right" start></v-icon>
                                    Proceed to Checkout
                                </v-btn>

                                <v-btn color="secondary" size="large" block variant="outlined" @click="goToProducts">
                                    <v-icon icon="mdi-arrow-left" start></v-icon>
                                    Continue Shopping
                                </v-btn>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>

        <v-dialog v-model="removeDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6 font-weight-bold">
                    Remove Item
                </v-card-title>
                <v-card-text>
                    Are you sure you want to remove "{{ itemToRemove?.productName }}" from your cart?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="removeDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="error" variant="text" @click="removeItem" :loading="removingItem">
                        Remove
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="clearDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6 font-weight-bold">
                    Clear Cart
                </v-card-title>
                <v-card-text>
                    Are you sure you want to remove all items from your cart?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="clearDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="error" variant="text" @click="handleClearCart" :loading="clearingCart">
                        Clear All
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { useCart } from '../composables/useCart'
import { useNotification } from '../composables/useNotification'

export default {
    name: 'Cart',
    components: {
        AppNav,
    },
    setup() {
        const router = useRouter()
        const {
            cart,
            cartItems,
            cartCount,
            cartTotal,
            isEmpty,
            loading,
            updateCartItem,
            removeFromCart,
            clearCart,
        } = useCart()

        const { snackbar, showSuccess, showError, showInfo } = useNotification()

        const removeDialog = ref(false)
        const clearDialog = ref(false)
        const itemToRemove = ref(null)
        const removingItem = ref(false)
        const clearingCart = ref(false)

        const getItemPrice = (item) => {
            if (typeof item.price === 'number') {
                return item.price
            }
            return item.price?.value || 0
        }

        const incrementQuantity = async (item) => {
            const result = await updateCartItem(item.productId, item.quantity + 1)
            if (result.success) {
                showSuccess('Quantity updated')
            } else {
                showError(result.error || 'Failed to update quantity')
            }
        }

        const decrementQuantity = async (item) => {
            if (item.quantity > 1) {
                const result = await updateCartItem(item.productId, item.quantity - 1)
                if (result.success) {
                    showSuccess('Quantity updated')
                } else {
                    showError(result.error || 'Failed to update quantity')
                }
            }
        }

        const confirmRemove = (item) => {
            itemToRemove.value = item
            removeDialog.value = true
        }

        const removeItem = async () => {
            if (!itemToRemove.value) return

            removingItem.value = true
            const result = await removeFromCart(itemToRemove.value.productId)
            removingItem.value = false

            if (result.success) {
                showSuccess('Item removed from cart')
                removeDialog.value = false
                itemToRemove.value = null
            } else {
                showError(result.error || 'Failed to remove item')
            }
        }

        const confirmClearCart = () => {
            clearDialog.value = true
        }

        const handleClearCart = async () => {
            clearingCart.value = true
            const result = await clearCart()
            clearingCart.value = false

            if (result.success) {
                showSuccess('Cart cleared')
                clearDialog.value = false
            } else {
                showError(result.error || 'Failed to clear cart')
            }
        }

        const goToProducts = () => {
            router.push({ name: 'Products' })
        }

        const goToProduct = (productId) => {
            router.push({ name: 'ProductDetail', params: { id: productId } })
        }

        const proceedToCheckout = () => {
            showInfo('Checkout functionality coming soon!')
        }

        return {
            cart,
            cartItems,
            cartCount,
            cartTotal,
            isEmpty,
            loading,
            snackbar,
            removeDialog,
            clearDialog,
            getItemPrice,
            itemToRemove,
            removingItem,
            clearingCart,
            incrementQuantity,
            decrementQuantity,
            confirmRemove,
            removeItem,
            confirmClearCart,
            handleClearCart,
            goToProducts,
            goToProduct,
            proceedToCheckout
        }
    },
}
</script>

<style scoped>
.sticky-summary {
    position: sticky;
    top: 80px;
}

.cart-item-card {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.cart-item-card:hover {
    background-color: rgba(0, 0, 0, 0.04);
}
</style>