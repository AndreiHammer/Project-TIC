<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4">
            Welcome, {{ currentUser?.username || 'User' }}!
          </v-card-title>
          <v-card-text>
            <p class="text-body-1">You have successfully logged in.</p>
            <v-divider class="my-4"></v-divider>
            <div v-if="currentUser">
              <p><strong>User ID:</strong> {{ currentUser.id }}</p>
              <p><strong>Email:</strong> {{ currentUser.email }}</p>
              <p><strong>Username:</strong> {{ currentUser.username }}</p>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="handleLogout" variant="outlined">
              Logout
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Home',
  setup() {
    const { currentUser, logout } = useAuth()

    const handleLogout = () => {
      logout()
    }

    return {
      currentUser,
      handleLogout,
    }
  },
}
</script>
