<template>
    <v-app>
        <v-app-bar color="primary" dark elevation="2">
            <v-btn icon="mdi-arrow-left" @click="goBack" title="Back"></v-btn>
            <v-app-bar-title class="font-weight-bold">
                <v-icon icon="mdi-account-circle" class="mr-2"></v-icon>
                My Profile
            </v-app-bar-title>
            <v-spacer></v-spacer>
        </v-app-bar>

        <v-main>
            <v-container class="pa-6">
                <v-row justify="center">
                    <v-col cols="12" md="8" lg="6">
                        <v-card elevation="3" class="mb-6">
                            <v-card-text class="pa-8 text-center">
                                <v-avatar color="primary" size="120" class="mb-4">
                                    <v-icon icon="mdi-account" size="64"></v-icon>
                                </v-avatar>
                                <h2 class="text-h4 font-weight-bold mb-2">
                                    {{ currentUser?.username }}
                                </h2>
                                <p class="text-h6 text-medium-emphasis">
                                    {{ currentUser?.email }}
                                </p>
                                <v-chip :color="currentUser?.admin ? 'error' : 'success'" class="mt-2" variant="tonal">
                                    <v-icon :icon="currentUser?.admin ? 'mdi-shield-crown' : 'mdi-account-check'"
                                        start></v-icon>
                                    {{ currentUser?.admin ? 'Administrator' : 'User' }}
                                </v-chip>
                            </v-card-text>
                        </v-card>

                        <v-card elevation="3" class="mb-6">
                            <v-card-title class="bg-primary text-white">
                                <v-icon icon="mdi-information" class="mr-2"></v-icon>
                                Account Information
                            </v-card-title>
                            <v-card-text class="pa-6">
                                <v-list density="comfortable">
                                    <v-list-item>
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-identifier" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title class="text-medium-emphasis">User ID</v-list-item-title>
                                        <v-list-item-subtitle class="text-h6 mt-1">
                                            {{ currentUser?.id }}
                                        </v-list-item-subtitle>
                                    </v-list-item>

                                    <v-divider class="my-2"></v-divider>

                                    <v-list-item>
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-account" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title class="text-medium-emphasis">Username</v-list-item-title>
                                        <v-list-item-subtitle class="text-h6 mt-1">
                                            {{ currentUser?.username }}
                                        </v-list-item-subtitle>
                                    </v-list-item>

                                    <v-divider class="my-2"></v-divider>

                                    <v-list-item>
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-email" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title class="text-medium-emphasis">Email
                                            Address</v-list-item-title>
                                        <v-list-item-subtitle class="text-h6 mt-1">
                                            {{ currentUser?.email }}
                                        </v-list-item-subtitle>
                                    </v-list-item>

                                    <v-divider class="my-2"></v-divider>

                                    <v-list-item>
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-shield-account" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title class="text-medium-emphasis">Account Type</v-list-item-title>
                                        <v-list-item-subtitle class="text-h6 mt-1">
                                            {{ currentUser?.admin ? 'Administrator' : 'Standard User' }}
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-card-text>
                        </v-card>

                        <v-card elevation="3">
                            <v-card-title class="bg-secondary text-white">
                                <v-icon icon="mdi-cog" class="mr-2"></v-icon>
                                Account Actions
                            </v-card-title>
                            <v-divider></v-divider>
                            <v-card-actions class="pa-6">
                                <v-btn color="error" variant="outlined" size="large" block prepend-icon="mdi-logout"
                                    append-icon="mdi-chevron-right" @click="handleLogout">
                                    Logout
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

export default {
    name: 'UserProfile',
    setup() {
        const { currentUser, logout, isAdmin } = useAuth()
        const router = useRouter()

        const goBack = () => {
            router.push({ name: isAdmin.value ? 'AdminDashboard' : 'UserDashboard' })
        }

        const handleLogout = () => {
            logout()
        }

        return {
            currentUser,
            goBack,
            handleLogout,
        }
    },
}
</script>

<style scoped>
.logout-item {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.logout-item:hover {
    background-color: rgba(255, 82, 82, 0.1);
}
</style>