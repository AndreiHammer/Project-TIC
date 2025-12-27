<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Register</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="username"
                label="Username"
                name="username"
                prepend-inner-icon="mdi-account"
                :rules="usernameRules"
                required
                variant="outlined"
                class="mb-2"
              ></v-text-field>

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

              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                prepend-inner-icon="mdi-lock-check"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                :rules="confirmPasswordRules"
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
              @click="handleRegister"
              block
              size="large"
            >
              Register
            </v-btn>
          </v-card-actions>
          <v-card-actions>
            <v-spacer></v-spacer>
            <span class="text-body-2">
              Already have an account?
              <router-link to="/login" class="text-primary">Login</router-link>
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
  name: 'Register',
  setup() {
    const router = useRouter()
    const { register } = useAuth()

    const form = ref(null)
    const valid = ref(false)
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const loading = ref(false)
    const error = ref(null)

    const usernameRules = [
      (v) => !!v || 'Username is required',
      (v) => (v && v.length >= 3 && v.length <= 30) || 'Username must be between 3 and 30 characters',
      (v) => /^[a-zA-Z0-9_]+$/.test(v) || 'Username can only contain letters, numbers, and underscores',
    ]

    const emailRules = [
      (v) => !!v || 'Email is required',
      (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
    ]

    const passwordRules = [
      (v) => !!v || 'Password is required',
      (v) => (v && v.length >= 8 && v.length <= 64) || 'Password must be between 8 and 64 characters',
      (v) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
      (v) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
      (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
      (v) => /[@$!%*?&#]/.test(v) || 'Password must contain at least one special character (@$!%*?&#)',
    ]

    const confirmPasswordRules = [
      (v) => !!v || 'Please confirm your password',
      (v) => v === password.value || 'Passwords do not match',
    ]

    const handleRegister = async () => {
      error.value = null
      
      const { valid: formValid } = await form.value.validate()
      if (!formValid) return

      loading.value = true
      try {
        const result = await register(email.value, password.value, username.value, confirmPassword.value)
        if (result.success) {
          router.push({ name: 'Home' })
        } else {
          if (Array.isArray(result.error)) {
            error.value = result.error.map(e => e.msg || e.message || e).join(', ')
          } else if (typeof result.error === 'string') {
            error.value = result.error
          } else {
            error.value = 'Registration failed. Please check your information.'
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
      username,
      email,
      password,
      confirmPassword,
      showPassword,
      showConfirmPassword,
      loading,
      error,
      usernameRules,
      emailRules,
      passwordRules,
      confirmPasswordRules,
      handleRegister,
    }
  },
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
