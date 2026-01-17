<template>
  <v-container fluid class="fill-height bg-gradient">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <v-card class="elevation-12 rounded-lg">
          <v-card-title class="text-h4 font-weight-bold text-center pa-6 bg-primary">
            <span class="text-white">Welcome Back</span>
          </v-card-title>

          <v-card-text class="pa-6">
            <p class="text-center text-medium-emphasis mb-6">
              Sign in to your account to continue
            </p>

            <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="handleLogin">
              <v-text-field v-model="email" label="Email" name="email" prepend-inner-icon="mdi-email" type="email"
                :rules="emailRules" required variant="outlined" density="comfortable" class="mb-3"></v-text-field>

              <v-text-field v-model="password" label="Password" name="password" prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword" :rules="passwordRules" required variant="outlined"
                density="comfortable" class="mb-2"></v-text-field>

              <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = null">
                {{ error }}
              </v-alert>

              <v-btn color="primary" :loading="loading" :disabled="!valid || loading" type="submit" block size="large"
                class="mb-4">
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-6 justify-center">
            <span class="text-body-2 text-medium-emphasis">
              Don't have an account?
              <router-link to="/register" class="text-primary text-decoration-none font-weight-medium">
                Sign Up
              </router-link>
            </span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { login, isAdmin } = useAuth()

    const form = ref(null)
    const valid = ref(false)
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const loading = ref(false)
    const error = ref(null)

    const emailRules = [
      (v) => !!v || 'Email is required',
      (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
    ]

    const passwordRules = [
      (v) => !!v || 'Password is required',
      (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
    ]

    const handleLogin = async () => {
      error.value = null

      const { valid: formValid } = await form.value.validate()
      if (!formValid) return

      loading.value = true
      try {
        const result = await login(email.value, password.value)
        if (result.success) {
          const redirect = route.query.redirect
          if (redirect) {
            router.push(redirect)
          } else {
            router.push({ name: isAdmin.value ? 'AdminDashboard' : 'UserDashboard' })
          }
        } else {
          if (Array.isArray(result.error)) {
            error.value = result.error.map(e => e.msg || e.message || e).join(', ')
          } else if (typeof result.error === 'string') {
            error.value = result.error
          } else {
            error.value = 'Login failed. Please check your credentials.'
          }
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      valid,
      email,
      password,
      showPassword,
      loading,
      error,
      emailRules,
      passwordRules,
      handleLogin,
    }
  },
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rounded-lg {
  border-radius: 16px !important;
}

.bg-primary {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
}
</style>