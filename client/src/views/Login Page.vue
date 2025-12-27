<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Login</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                prepend-inner-icon="mdi-email"
                type="email"
                :rules="emailRules"
                required
                variant="outlined"
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                required
                variant="outlined"
                class="mb-2"
              ></v-text-field>

              <v-alert
                v-if="error"
                type="error"
                density="compact"
                class="mb-4"
                closable
                @click:close="error = null"
              >
                {{ error }}
              </v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!valid || loading"
              @click="handleLogin"
              block
              size="large"
            >
              Login
            </v-btn>
          </v-card-actions>
          <v-card-actions>
            <v-spacer></v-spacer>
            <span class="text-body-2">
              Don't have an account?
              <router-link to="/register" class="text-primary">Register</router-link>
            </span>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const { login } = useAuth()

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
          router.push({ name: 'Home' })
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
</style>
