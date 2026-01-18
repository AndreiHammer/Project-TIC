<template>
    <v-app-bar color="primary" dark elevation="2">
        <v-btn v-if="showBack" icon="mdi-arrow-left" @click="goBack" title="Back"></v-btn>

        <v-btn v-else icon="mdi-home" @click="goHome" title="Home"></v-btn>

        <v-app-bar-title class="font-weight-bold">
            <v-icon v-if="icon" :icon="icon" class="mr-2"></v-icon>
            {{ title }}
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <v-btn v-if="showCart" icon @click="goToCart" class="mr-2">
            <v-badge v-if="cartCount > 0" :content="cartCount" color="error" overlap>
                <v-icon>mdi-cart</v-icon>
            </v-badge>
            <v-icon v-else>mdi-cart</v-icon>
        </v-btn>

        <v-chip color="white" variant="outlined" class="mr-4 profile-chip" @click="goToProfile">
            <v-icon icon="mdi-account-circle" start></v-icon>
            {{ username }}
        </v-chip>

        <v-btn icon="mdi-logout" @click="handleLogout" title="Logout"></v-btn>
    </v-app-bar>
</template>

<script>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

export default {
    name: 'AppNav',
    props: {
        title: {
            type: String,
            default: 'ShopApp',
        },
        icon: {
            type: String,
            default: '',
        },
        showBack: {
            type: Boolean,
            default: false,
        },
        showCart: {
            type: Boolean,
            default: true,
        },
        cartCount: {
            type: Number,
            default: 0,
        },
    },
    setup() {
        const { currentUser, logout, isAdmin } = useAuth()
        const router = useRouter()

        const goBack = () => {
            router.back()
        }

        const goHome = () => {
            router.push({ name: isAdmin.value ? 'AdminDashboard' : 'UserDashboard' })
        }

        const goToProfile = () => {
            router.push({ name: 'UserProfile' })
        }

        const goToCart = () => {
            router.push({ name: 'Cart' })
        }

        const handleLogout = () => {
            logout()
        }

        return {
            username: currentUser.value?.username || 'User',
            goBack,
            goHome,
            goToProfile,
            goToCart,
            handleLogout,
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