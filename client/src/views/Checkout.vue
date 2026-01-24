<template>
    <v-app>
        <AppNav title="Checkout" icon="mdi-cart-check" :cart-count="cartCount" :show-cart="false" />

        <v-main>
            <v-container class="pa-6" style="max-width: 1200px;">
                <v-row v-if="isEmpty">
                    <v-col cols="12" class="text-center py-12">
                        <v-icon icon="mdi-cart-outline" size="120" color="grey-lighten-1"></v-icon>
                        <h2 class="text-h4 font-weight-bold mt-6 mb-4">Your cart is empty</h2>
                        <v-btn color="primary" size="large" @click="goToProducts">
                            <v-icon icon="mdi-store" start></v-icon>
                            Browse Products
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row v-else>
                    <v-col cols="12" md="7">
                        <v-card elevation="3" class="mb-6">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                <v-icon icon="mdi-truck-delivery" class="mr-2"></v-icon>
                                Shipping Information
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-card-text class="pa-6">
                                <v-form ref="shippingForm" v-model="formValid">
                                    <v-row>
                                        <v-col cols="12">
                                            <v-text-field v-model="shipping.name" label="Full Name" variant="outlined"
                                                :rules="[rules.required, rules.minLength(2), rules.maxLength(100)]"
                                                prepend-inner-icon="mdi-account" required></v-text-field>
                                        </v-col>

                                        <v-col cols="12">
                                            <v-text-field v-model="shipping.address" label="Address" variant="outlined"
                                                :rules="[rules.required, rules.minLength(5), rules.maxLength(200)]"
                                                prepend-inner-icon="mdi-home" required></v-text-field>
                                        </v-col>

                                        <v-col cols="12" sm="6">
                                            <v-text-field v-model="shipping.city" label="City" variant="outlined"
                                                :rules="[rules.required, rules.minLength(2), rules.maxLength(100)]"
                                                prepend-inner-icon="mdi-city" required></v-text-field>
                                        </v-col>

                                        <v-col cols="12" sm="6">
                                            <v-text-field v-model="shipping.postalCode" label="Postal Code"
                                                variant="outlined"
                                                :rules="[rules.required, rules.minLength(3), rules.maxLength(20)]"
                                                prepend-inner-icon="mdi-mailbox" required></v-text-field>
                                        </v-col>

                                        <v-col cols="12" sm="6">
                                            <v-text-field v-model="shipping.country" label="Country" variant="outlined"
                                                :rules="[rules.required, rules.minLength(2), rules.maxLength(100)]"
                                                prepend-inner-icon="mdi-flag" required></v-text-field>
                                        </v-col>

                                        <v-col cols="12" sm="6">
                                            <v-text-field v-model="shipping.phone" label="Phone (Optional)"
                                                variant="outlined" :rules="[rules.phoneOptional]"
                                                prepend-inner-icon="mdi-phone"></v-text-field>
                                        </v-col>
                                    </v-row>
                                </v-form>
                            </v-card-text>
                        </v-card>

                        <v-card elevation="3">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
                                Payment Method
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-card-text class="pa-6">
                                <v-radio-group v-model="payment.method" :rules="[rules.required]">
                                    <v-radio label="Card" value="card">
                                        <template v-slot:label>
                                            <div class="d-flex align-center">
                                                <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
                                                <span class="font-weight-medium">Card</span>
                                            </div>
                                        </template>
                                    </v-radio>
                                    <v-radio label="Cash on Delivery" value="cash_on_delivery">
                                        <template v-slot:label>
                                            <div class="d-flex align-center">
                                                <v-icon icon="mdi-cash" class="mr-2"></v-icon>
                                                <span class="font-weight-medium">Cash on Delivery</span>
                                            </div>
                                        </template>
                                    </v-radio>
                                </v-radio-group>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="5">
                        <v-card elevation="3" class="sticky-summary">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                Order Summary
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-card-text class="pa-6">
                                <div class="mb-4">
                                    <h3 class="text-h6 font-weight-bold mb-3">Items ({{ cartCount }})</h3>
                                    <v-list density="compact">
                                        <v-list-item v-for="item in cartItems" :key="item.productId" class="px-0">
                                            <template v-slot:prepend>
                                                <v-avatar size="40" rounded class="mr-3">
                                                    <v-img v-if="item.image" :src="item.image"
                                                        :alt="item.productName"></v-img>
                                                    <v-icon v-else icon="mdi-image"></v-icon>
                                                </v-avatar>
                                            </template>
                                            <v-list-item-title class="text-body-2">
                                                {{ item.productName }}
                                            </v-list-item-title>
                                            <v-list-item-subtitle class="text-caption">
                                                {{ item.quantity }} × €{{ getItemPrice(item).toFixed(2) }}
                                            </v-list-item-subtitle>
                                            <template v-slot:append>
                                                <span class="text-body-2 font-weight-medium">
                                                    €{{ (getItemPrice(item) * item.quantity).toFixed(2) }}
                                                </span>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </div>

                                <v-divider class="my-4"></v-divider>

                                <div class="d-flex justify-space-between mb-3">
                                    <span class="text-body-1">Subtotal:</span>
                                    <span class="text-body-1 font-weight-medium">
                                        €{{ (cart?.totals?.subtotal || 0).toFixed(2) }}
                                    </span>
                                </div>

                                <div class="d-flex justify-space-between mb-3">
                                    <span class="text-body-1">Shipping:</span>
                                    <span class="text-body-1 font-weight-medium text-success">
                                        Free
                                    </span>
                                </div>

                                <v-divider class="my-4"></v-divider>

                                <div class="d-flex justify-space-between mb-6">
                                    <span class="text-h6 font-weight-bold">Total:</span>
                                    <span class="text-h5 font-weight-bold text-primary">
                                        €{{ (cart?.totals?.total || 0).toFixed(2) }}
                                    </span>
                                </div>

                                <v-btn color="success" size="x-large" block class="mb-3" @click="placeOrder"
                                    :loading="placingOrder" :disabled="!formValid || !payment.method">
                                    <v-icon icon="mdi-check-circle" start></v-icon>
                                    Place Order
                                </v-btn>

                                <v-btn color="grey" size="large" block variant="outlined" @click="goToCart">
                                    <v-icon icon="mdi-arrow-left" start></v-icon>
                                    Back to Cart
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
    </v-app>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { useCart } from '../composables/useCart'
import { useNotification } from '../composables/useNotification'
import { orderService } from '../services/orderService'

export default {
    name: 'Checkout',
    components: {
        AppNav,
    },
    setup() {
        const router = useRouter()
        const { cart, cartItems, cartCount, isEmpty, fetchCart } = useCart()
        const { snackbar, showSuccess, showError } = useNotification()

        const shippingForm = ref(null)
        const formValid = ref(false)
        const placingOrder = ref(false)

        const shipping = ref({
            name: '',
            address: '',
            city: '',
            postalCode: '',
            country: '',
            phone: '',
        })

        const payment = ref({
            method: '',
            status: 'pending',
        })

        const rules = {
            required: (v) => !!v || 'This field is required',
            minLength: (min) => (v) => (v && v.length >= min) || `Minimum ${min} characters required`,
            maxLength: (max) => (v) => !v || v.length <= max || `Maximum ${max} characters allowed`,
            phoneOptional: (v) => !v || (v.length >= 5 && v.length <= 20) || 'Phone must be between 5 and 20 characters',
        }

        const getItemPrice = (item) => {
            if (typeof item.price === 'number') {
                return item.price
            }
            return item.price?.value || 0
        }

        const placeOrder = async () => {
            const valid = await shippingForm.value?.validate()
            if (!valid.valid) {
                showError('Please fill in all required fields')
                return
            }

            if (!payment.value.method) {
                showError('Please select a payment method')
                return
            }

            placingOrder.value = true

            const orderData = {
                items: cartItems.value.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                shipping: {
                    name: shipping.value.name.trim(),
                    address: shipping.value.address.trim(),
                    city: shipping.value.city.trim(),
                    postalCode: shipping.value.postalCode.trim(),
                    country: shipping.value.country.trim(),
                    phone: shipping.value.phone?.trim() || null,
                },
                payment: {
                    method: payment.value.method,
                    status: 'pending',
                },
            }

            const result = await orderService.createOrder(orderData)
            placingOrder.value = false

            if (result.success) {
                showSuccess('Order placed successfully!')
                await fetchCart()
                setTimeout(() => {
                    router.push({ name: 'Orders' })
                }, 1500)
            } else {
                if (typeof result.error === 'string') {
                    showError(result.error)
                } else if (result.error?.details) {
                    const stockErrors = result.error.details.map(d => `${d.productName}: ${d.error}`).join(', ')
                    showError(`Stock validation failed: ${stockErrors}`)
                } else {
                    showError('Failed to place order')
                }
            }
        }

        const goToCart = () => {
            router.push({ name: 'Cart' })
        }

        const goToProducts = () => {
            router.push({ name: 'Products' })
        }

        return {
            cart,
            cartItems,
            cartCount,
            isEmpty,
            snackbar,
            shippingForm,
            formValid,
            shipping,
            payment,
            rules,
            placingOrder,
            getItemPrice,
            placeOrder,
            goToCart,
            goToProducts,
        }
    },
}
</script>

<style scoped>
.sticky-summary {
    position: sticky;
    top: 80px;
}
</style>