<template>
    <v-app>
        <v-app-bar color="primary" dark elevation="2">
            <v-app-bar-title class="font-weight-bold">
                <v-icon icon="mdi-shield-crown" class="mr-2"></v-icon>
                Admin Dashboard
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
                <v-row class="mb-6">
                    <v-col cols="12">
                        <h1 class="text-h3 font-weight-bold mb-2">
                            Welcome back, {{ currentUser?.username }}!
                        </h1>
                        <p class="text-h6 text-medium-emphasis">
                            Manage your e-commerce platform from here
                        </p>
                    </v-col>
                </v-row>

                <v-row class="mb-6">
                    <v-col cols="12" md="3">
                        <v-card color="primary" dark>
                            <v-card-text>
                                <div class="text-h6">Total Products</div>
                                <div class="text-h3 font-weight-bold">
                                    {{ loadingStats ? '...' : totalProducts }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-card color="success" dark>
                            <v-card-text>
                                <div class="text-h6">Total Orders</div>
                                <div class="text-h3 font-weight-bold">
                                    {{ loadingStats ? '...' : totalOrders }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-card color="warning" dark>
                            <v-card-text>
                                <div class="text-h6">Pending Orders</div>
                                <div class="text-h3 font-weight-bold">
                                    {{ loadingStats ? '...' : pendingOrders }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="3">
                        <v-card color="info" dark>
                            <v-card-text>
                                <div class="text-h6">Total Users</div>
                                <div class="text-h3 font-weight-bold">
                                    {{ loadingStats ? '...' : totalUsers }}
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row justify="center">
                    <v-col cols="12" md="6" lg="4">
                        <ActionCard title="Product Management" icon="mdi-package-variant" avatar-color="primary"
                            avatar-size="56" icon-size="32" button-text="Manage Products" button-color="primary"
                            :show-divider="false" :features="[
                                { text: 'View all products', completed: true },
                                { text: 'Add new products', completed: true },
                                { text: 'Edit & delete products', completed: true },
                                { text: 'Manage inventory', completed: true },
                            ]" @click="navigateTo('AdminProducts')" />
                    </v-col>

                    <v-col cols="12" md="6" lg="4">
                        <ActionCard title="Order Management" icon="mdi-clipboard-list" avatar-color="success"
                            avatar-size="56" icon-size="32" button-text="Manage Orders" button-color="success"
                            :show-divider="false" :features="[
                                { text: 'View all orders', completed: true },
                                { text: 'Update order status', completed: true },
                                { text: 'Process refunds', completed: true },
                                { text: 'Track shipments', completed: true },
                            ]" @click="navigateTo('AdminOrders')" />
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'
import ActionCard from '../components/ActionCard.vue'
import productService from '../services/productService'
import orderService from '../services/orderService'
import userService from '../services/authService'

export default {
    name: 'AdminDashboard',
    components: {
        ActionCard,
    },
    setup() {
        const { currentUser, logout } = useAuth()
        const router = useRouter()

        const totalProducts = ref(0)
        const loadingStats = ref(true)
        const totalOrders = ref(0)
        const pendingOrders = ref(0)
        const totalUsers = ref(0)

        const fetchOrderStats = async () => {
            try {
                const result = await orderService.getOrders()
                if (result.success) {
                    totalOrders.value = result.data.length
                    pendingOrders.value = result.data.filter(o => o.status === 'pending').length
                }
            } catch (error) {
                console.error('Error fetching order stats:', error)
            }
        }

        const fetchStats = async () => {
            loadingStats.value = true
            try {
                const result = await productService.getAllProducts({ offset: 0, limit: 1 })
                if (result.success) {
                    totalProducts.value = result.pagination.totalProducts
                }
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                loadingStats.value = false
            }
        }

        const fetchUserStats = async () => {
            try {
                const result = await userService.getUsersCount()
                if (result.success) {
                    totalUsers.value = result.data
                }
            } catch (error) {
                console.error('Error fetching user stats:', error)
            }
        }

        onMounted(() => {
            fetchStats()
            fetchOrderStats()
            fetchUserStats()
        })

        const goToProfile = () => {
            router.push({ name: 'UserProfile' })
        }

        const handleLogout = () => {
            logout()
        }

        const navigateTo = (routeName) => {
            router.push({ name: routeName })
        }

        return {
            currentUser,
            totalProducts,
            totalOrders,
            pendingOrders,
            loadingStats,
            totalUsers,
            goToProfile,
            handleLogout,
            navigateTo,
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
</style>