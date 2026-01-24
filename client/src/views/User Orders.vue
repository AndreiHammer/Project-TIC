<template>
    <v-app>
        <AppNav title="My Orders" icon="mdi-package-variant-closed" :cart-count="cartCount" />

        <v-main>
            <v-container class="pa-6">
                <v-row v-if="loading" class="mb-4">
                    <v-col cols="12">
                        <v-skeleton-loader type="table"></v-skeleton-loader>
                    </v-col>
                </v-row>

                <v-row v-else-if="orders.length === 0">
                    <v-col cols="12" class="text-center py-12">
                        <v-icon icon="mdi-package-variant" size="120" color="grey-lighten-1"></v-icon>
                        <h2 class="text-h4 font-weight-bold mt-6 mb-4">No orders yet</h2>
                        <p class="text-h6 text-medium-emphasis mb-6">
                            Start shopping and your orders will appear here
                        </p>
                        <v-btn color="primary" size="large" @click="goToProducts">
                            <v-icon icon="mdi-store" start></v-icon>
                            Browse Products
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row v-else>
                    <v-col cols="12">
                        <v-card elevation="3">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                Order History
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-expansion-panels>
                                <v-expansion-panel v-for="order in orders" :key="order.id">
                                    <v-expansion-panel-title>
                                        <div class="d-flex align-center justify-space-between w-100 pr-4">
                                            <div>
                                                <div class="text-h6 font-weight-bold">
                                                    Order #{{ order.id.substring(0, 8) }}
                                                </div>
                                                <div class="text-caption text-medium-emphasis">
                                                    {{ formatDate(order.metadata?.createdAt) }}
                                                </div>
                                            </div>
                                            <div class="d-flex align-center">
                                                <v-chip :color="getStatusColor(order.status)" class="mr-4">
                                                    {{ formatStatus(order.status) }}
                                                </v-chip>
                                                <span class="text-h6 font-weight-bold text-primary">
                                                    €{{ order.total?.toFixed(2) }}
                                                </span>
                                            </div>
                                        </div>
                                    </v-expansion-panel-title>

                                    <v-expansion-panel-text>
                                        <v-divider class="mb-4"></v-divider>

                                        <v-row>
                                            <v-col cols="12" md="6">
                                                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                                                    <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
                                                    Order Items
                                                </h3>
                                                <v-list density="compact">
                                                    <v-list-item v-for="item in order.items" :key="item.productId"
                                                        class="px-0">
                                                        <v-list-item-title>
                                                            {{ item.productName }}
                                                        </v-list-item-title>
                                                        <v-list-item-subtitle>
                                                            {{ item.quantity }} × €{{ item.price?.value?.toFixed(2) }} =
                                                            €{{ item.subtotal?.toFixed(2) }}
                                                        </v-list-item-subtitle>
                                                    </v-list-item>
                                                </v-list>
                                            </v-col>

                                            <v-col cols="12" md="6">
                                                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                                                    <v-icon icon="mdi-truck-delivery" class="mr-2"></v-icon>
                                                    Shipping Information
                                                </h3>
                                                <div class="text-body-2">
                                                    <div><strong>Name:</strong> {{ order.shipping?.name }}</div>
                                                    <div><strong>Address:</strong> {{ order.shipping?.address }}</div>
                                                    <div><strong>City:</strong> {{ order.shipping?.city }}, {{
                                                        order.shipping?.postalCode }}</div>
                                                    <div><strong>Country:</strong> {{ order.shipping?.country }}</div>
                                                    <div v-if="order.shipping?.phone"><strong>Phone:</strong> {{
                                                        order.shipping?.phone }}</div>
                                                </div>

                                                <h3 class="text-subtitle-1 font-weight-bold mb-3 mt-4">
                                                    <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
                                                    Payment Information
                                                </h3>
                                                <div class="text-body-2">
                                                    <div><strong>Method:</strong> {{
                                                        formatPaymentMethod(order.payment?.method)
                                                        }}</div>
                                                    <div><strong>Status:</strong>
                                                        <v-chip :color="getPaymentStatusColor(order.payment?.status)"
                                                            size="small">
                                                            {{ formatStatus(order.payment?.status) }}
                                                        </v-chip>
                                                    </div>
                                                </div>
                                            </v-col>
                                        </v-row>

                                        <v-divider class="my-4"></v-divider>

                                        <div class="d-flex justify-space-between align-center">
                                            <div class="text-h6">
                                                <strong>Total:</strong>
                                                <span class="text-primary ml-2">€{{ order.total?.toFixed(2) }}</span>
                                            </div>
                                            <v-btn v-if="canCancelOrder(order)" color="error" variant="outlined"
                                                @click="confirmCancel(order)" :loading="cancellingOrderId === order.id">
                                                <v-icon icon="mdi-close-circle" start></v-icon>
                                                Cancel Order
                                            </v-btn>
                                        </div>
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>

        <v-dialog v-model="cancelDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6 font-weight-bold">
                    Cancel Order
                </v-card-title>
                <v-card-text>
                    Are you sure you want to cancel order #{{ orderToCancel?.id.substring(0, 8) }}?
                    <br><br>
                    This action cannot be undone and the items will be returned to stock.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="cancelDialog = false">
                        No, Keep Order
                    </v-btn>
                    <v-btn color="error" variant="text" @click="cancelOrder" :loading="cancellingOrderId !== null">
                        Yes, Cancel Order
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import { useCart } from '../composables/useCart'
import { useNotification } from '../composables/useNotification'
import { orderService } from '../services/orderService'

export default {
    name: 'UserOrders',
    components: {
        AppNav,
    },
    setup() {
        const router = useRouter()
        const { cartCount } = useCart()
        const { snackbar, showSuccess, showError } = useNotification()

        const orders = ref([])
        const loading = ref(true)
        const cancelDialog = ref(false)
        const orderToCancel = ref(null)
        const cancellingOrderId = ref(null)

        const fetchOrders = async () => {
            loading.value = true
            const result = await orderService.getOrders()
            if (result.success) {
                orders.value = result.data
            } else {
                showError(result.error || 'Failed to fetch orders')
            }
            loading.value = false
        }

        onMounted(() => {
            fetchOrders()
        })

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A'
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        }

        const formatStatus = (status) => {
            if (!status) return 'Unknown'
            return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
        }

        const formatPaymentMethod = (method) => {
            if (!method) return 'N/A'
            return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }

        const getStatusColor = (status) => {
            const colors = {
                pending: 'orange',
                confirmed: 'blue',
                processing: 'purple',
                shipped: 'indigo',
                delivered: 'green',
                cancelled: 'red',
            }
            return colors[status] || 'grey'
        }

        const getPaymentStatusColor = (status) => {
            const colors = {
                pending: 'orange',
                completed: 'green',
                failed: 'red',
            }
            return colors[status] || 'grey'
        }

        const canCancelOrder = (order) => {
            return ['pending', 'confirmed'].includes(order.status)
        }

        const confirmCancel = (order) => {
            orderToCancel.value = order
            cancelDialog.value = true
        }

        const cancelOrder = async () => {
            if (!orderToCancel.value) return

            cancellingOrderId.value = orderToCancel.value.id
            const result = await orderService.cancelOrder(orderToCancel.value.id)
            cancellingOrderId.value = null

            if (result.success) {
                const orderIndex = orders.value.findIndex(o => o.id === orderToCancel.value.id)
                if (orderIndex !== -1) {
                    orders.value[orderIndex].status = 'cancelled'
                    if (orders.value[orderIndex].payment) {
                        orders.value[orderIndex].payment.status = 'failed'
                    }
                }

                showSuccess('Order cancelled successfully')
                cancelDialog.value = false
                orderToCancel.value = null

                await fetchOrders()
            } else {
                showError(result.error || 'Failed to cancel order')
            }
        }

        const goToProducts = () => {
            router.push({ name: 'Products' })
        }

        return {
            orders,
            loading,
            cartCount,
            snackbar,
            cancelDialog,
            orderToCancel,
            cancellingOrderId,
            formatDate,
            formatStatus,
            formatPaymentMethod,
            getStatusColor,
            getPaymentStatusColor,
            canCancelOrder,
            confirmCancel,
            cancelOrder,
            goToProducts,
        }
    },
}
</script>

<style scoped>
.w-100 {
    width: 100%;
}
</style>