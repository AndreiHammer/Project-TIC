<template>
    <v-app>
        <v-app-bar color="primary" dark elevation="2">
            <v-app-bar-title class="font-weight-bold">
                <v-icon icon="mdi-storefront" class="mr-2"></v-icon>
                ShopApp
            </v-app-bar-title>
            <v-spacer></v-spacer>

            <v-btn icon @click="navigateTo('Cart')" class="mr-2">
                <v-badge v-if="cartCount > 0" :content="cartCount" color="error" overlap>
                    <v-icon>mdi-cart</v-icon>
                </v-badge>
                <v-icon v-else>mdi-cart-outline</v-icon>
            </v-btn>

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
                            Welcome, {{ currentUser?.username }}!
                        </h1>
                        <p class="text-h6 text-medium-emphasis">
                            What would you like to do today?
                        </p>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="12">
                        <h2 class="text-h4 font-weight-bold mb-4">Quick Actions</h2>
                    </v-col>

                    <v-col cols="12" md="6" lg="4">
                        <ActionCard title="Browse Products" subtitle="Explore our catalog"
                            description="Discover amazing products, check out new arrivals, and find what you need."
                            icon="mdi-store" avatar-color="primary" button-text="Start Shopping" button-color="primary"
                            @click="navigateTo('Products')" />
                    </v-col>

                    <v-col cols="12" md="6" lg="4">
                        <ActionCard title="Shopping Cart" subtitle="Review your items"
                            :description="`You have ${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart. View, update quantities, and proceed to checkout.`"
                            icon="mdi-cart" avatar-color="success" button-text="View Cart" button-color="success"
                            :badge="cartCount > 0 ? cartCount : null" @click="navigateTo('Cart')" />
                    </v-col>

                    <v-col cols="12" md="6" lg="4">
                        <ActionCard title="My Orders" subtitle="Track your purchases"
                            description="View order history, track shipments, and manage returns."
                            icon="mdi-package-variant-closed" avatar-color="info" button-text="View Orders"
                            button-color="info" @click="navigateTo('Orders')" />
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import ActionCard from '../components/ActionCard.vue'

export default {
    name: 'UserDashboard',
    components: {
        ActionCard,
    },
    setup() {
        const { currentUser, logout } = useAuth()
        const router = useRouter()
        const { cartCount } = useCart()

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
            cartCount,
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