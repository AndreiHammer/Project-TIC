<template>
    <v-app>
        <v-app-bar color="primary" dark elevation="2">
            <v-btn icon="mdi-home" @click="goBack" title="Home"></v-btn>

            <v-app-bar-title class="font-weight-bold">
                <v-icon icon="mdi-clipboard-list" class="mr-2"></v-icon>
                Order Management
            </v-app-bar-title>

            <v-spacer></v-spacer>

            <v-chip color="white" variant="outlined" class="mr-4 profile-chip" @click="goToProfile">
                <v-icon icon="mdi-account-circle" start></v-icon>
                {{ currentUser?.username }}
            </v-chip>

            <v-btn icon="mdi-logout" @click="handleLogout" title="Logout"></v-btn>
        </v-app-bar>

        <v-main>
            <v-container fluid class="pa-6">
                <v-row class="mb-4">
                    <v-col cols="12" md="3">
                        <v-select v-model="statusFilter" :items="statusOptions" label="Filter by Status"
                            variant="outlined" density="comfortable" clearable
                            prepend-inner-icon="mdi-filter"></v-select>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-btn color="primary" variant="outlined" @click="fetchOrders" :loading="loading">
                            <v-icon icon="mdi-refresh" start></v-icon>
                            Refresh
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row v-if="loading && orders.length === 0">
                    <v-col cols="12">
                        <v-skeleton-loader type="table"></v-skeleton-loader>
                    </v-col>
                </v-row>

                <v-row v-else-if="filteredOrders.length === 0">
                    <v-col cols="12" class="text-center py-12">
                        <v-icon icon="mdi-package-variant" size="120" color="grey-lighten-1"></v-icon>
                        <h2 class="text-h4 font-weight-bold mt-6 mb-4">No orders found</h2>
                    </v-col>
                </v-row>

                <v-row v-else>
                    <v-col cols="12">
                        <v-card elevation="3">
                            <v-card-title class="text-h5 font-weight-bold pa-6">
                                All Orders ({{ filteredOrders.length }})
                            </v-card-title>
                            <v-divider></v-divider>

                            <v-expansion-panels>
                                <v-expansion-panel v-for="order in filteredOrders" :key="order.id">
                                    <v-expansion-panel-title>
                                        <div class="d-flex align-center justify-space-between w-100 pr-4">
                                            <div class="flex-grow-1">
                                                <div class="text-h6 font-weight-bold">
                                                    Order #{{ order.id.substring(0, 8) }}
                                                </div>
                                                <div class="text-caption text-medium-emphasis">
                                                    {{ formatDate(order.metadata?.createdAt) }}
                                                </div>
                                                <div class="text-caption">
                                                    Customer: {{ order.shipping?.name }}
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
                                            <v-col cols="12" md="4">
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
                                                <div class="text-h6 font-weight-bold mt-3">
                                                    Total: €{{ order.total?.toFixed(2) }}
                                                </div>
                                            </v-col>

                                            <v-col cols="12" md="4">
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

                                            <v-col cols="12" md="4">
                                                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                                                    <v-icon icon="mdi-cog" class="mr-2"></v-icon>
                                                    Update Order Status
                                                </h3>

                                                <v-alert v-if="order.status === 'delivered'" type="success"
                                                    variant="tonal" class="mb-3">
                                                    This order has been completed.
                                                </v-alert>

                                                <v-select v-model="order.newStatus" :items="orderStatuses"
                                                    label="Select New Status" variant="outlined" density="comfortable"
                                                    item-title="label" item-value="value"
                                                    :prepend-inner-icon="'mdi-clipboard-check'"
                                                    :disabled="order.status === 'delivered'"></v-select>

                                                <v-btn color="success" block class="mt-3" @click="updateStatus(order)"
                                                    :disabled="!order.newStatus || order.newStatus === order.status || order.status === 'delivered'"
                                                    :loading="updatingOrderId === order.id">
                                                    <v-icon icon="mdi-check" start></v-icon>
                                                    Update Status
                                                </v-btn>

                                                <v-divider class="my-4"></v-divider>

                                                <h3 class="text-subtitle-1 font-weight-bold mb-3">
                                                    Order Metadata
                                                </h3>
                                                <div class="text-caption">
                                                    <div><strong>Order ID:</strong> {{ order.id }}</div>
                                                    <div><strong>User ID:</strong> {{ order.userId }}</div>
                                                    <div><strong>Created:</strong> {{
                                                        formatDate(order.metadata?.createdAt) }}</div>
                                                    <div v-if="order.metadata?.updatedAt"><strong>Updated:</strong> {{
                                                        formatDate(order.metadata?.updatedAt) }}</div>
                                                    <div v-if="order.metadata?.updatedBy"><strong>Updated By:</strong>
                                                        {{
                                                            order.metadata?.updatedBy }}</div>
                                                </div>
                                            </v-col>
                                        </v-row>
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
    </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useNotification } from '../composables/useNotification'
import { orderService } from '../services/orderService'

export default {
    name: 'AdminOrders',
    setup() {
        const router = useRouter()
        const { currentUser, logout } = useAuth()
        const { snackbar, showSuccess, showError } = useNotification()

        const orders = ref([])
        const loading = ref(true)
        const statusFilter = ref(null)
        const updatingOrderId = ref(null)

        const orderStatuses = [
            { label: 'Pending', value: 'pending' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Processing', value: 'processing' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Cancelled', value: 'cancelled' },
        ]

        const statusOptions = [
            'All',
            'Pending',
            'Confirmed',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
        ]

        const filteredOrders = computed(() => {
            if (!statusFilter.value || statusFilter.value === 'All') {
                return orders.value
            }
            return orders.value.filter(order => order.status === statusFilter.value.toLowerCase())
        })

        const fetchOrders = async () => {
            loading.value = true
            const result = await orderService.getOrders()
            if (result.success) {
                orders.value = result.data.map(order => ({
                    ...order,
                    newStatus: order.status,
                }))
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

        const updateStatus = async (order) => {
            if (!order.newStatus || order.newStatus === order.status) return

            updatingOrderId.value = order.id
            const result = await orderService.updateOrderStatus(order.id, order.newStatus)
            updatingOrderId.value = null

            if (result.success) {
                showSuccess(`Order status updated to ${formatStatus(order.newStatus)}`)
                await fetchOrders()
            } else {
                showError(result.error || 'Failed to update order status')
            }
        }

        const goToProfile = () => {
            router.push({ name: 'UserProfile' })
        }

        const goBack = () => {
            router.push({ name: 'AdminDashboard' })
        }

        const handleLogout = () => {
            logout()
        }

        return {
            currentUser,
            handleLogout,
            orders,
            loading,
            statusFilter,
            orderStatuses,
            statusOptions,
            filteredOrders,
            updatingOrderId,
            snackbar,
            fetchOrders,
            formatDate,
            formatStatus,
            formatPaymentMethod,
            getStatusColor,
            getPaymentStatusColor,
            updateStatus,
            goToProfile,
            goBack,
        }
    },
}
</script>

<style scoped>
.profile-chip {
    cursor: pointer;
    transition: all 0.2s ease;
}

.profile-chip:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.w-100 {
    width: 100%;
}
</style>