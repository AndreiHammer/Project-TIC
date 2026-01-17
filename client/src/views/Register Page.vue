<template>
  <v-container fluid class="fill-height bg-gradient">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="5" xl="4">
        <v-card class="elevation-12 rounded-lg">
          <v-card-title class="text-h4 font-weight-bold text-center pa-6 bg-primary">
            <span class="text-white">Create Account</span>
          </v-card-title>

          <v-card-text class="pa-6">
            <p class="text-center text-medium-emphasis mb-6">
              Join us today and start shopping
            </p>

            <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="handleRegister">
              <v-text-field v-model="username" label="Username" name="username" prepend-inner-icon="mdi-account"
                :rules="usernameRules" required variant="outlined" density="comfortable" class="mb-3"></v-text-field>

              <v-text-field v-model="email" label="Email" name="email" prepend-inner-icon="mdi-email" type="email"
                :rules="emailRules" required variant="outlined" density="comfortable" class="mb-3"></v-text-field>

              <v-text-field v-model="password" label="Password" name="password" prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword" :rules="passwordRules" required variant="outlined"
                density="comfortable" class="mb-3" @input="updatePasswordStrength"></v-text-field>

              <!-- Password Strength Indicator -->
              <v-progress-linear v-if="password" :model-value="passwordStrength.value" :color="passwordStrength.color"
                height="4" class="mb-2"></v-progress-linear>
              <p v-if="password" :class="`text-caption text-${passwordStrength.color} mb-3`">
                Password strength: {{ passwordStrength.text }}
              </p>

              <v-text-field v-model="confirmPassword" label="Confirm Password" name="confirmPassword"
                prepend-inner-icon="mdi-lock-check" :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword" :rules="confirmPasswordRules" required
                variant="outlined" density="comfortable" class="mb-2"></v-text-field>

              <v-alert v-if="error" type="error" density="compact" class="mb-4" closable @click:close="error = null">
                {{ error }}
              </v-alert>

              <v-btn color="primary" :loading="loading" :disabled="!valid || loading" type="submit" block size="large"
                class="mb-4">
                Create Account
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-6 justify-center">
            <span class="text-body-2 text-medium-emphasis">
              Already have an account?
              <router-link to="/login" class="text-primary text-decoration-none font-weight-medium">
                Sign In
              </router-link>
            </span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, reactive } from 'vue'
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

    const passwordStrength = reactive({
      value: 0,
      text: '',
      color: 'error',
    })

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

    const updatePasswordStrength = () => {
      const pwd = password.value
      let strength = 0

      if (pwd.length >= 8) strength += 20
      if (pwd.length >= 12) strength += 10
      if (/[a-z]/.test(pwd)) strength += 15
      if (/[A-Z]/.test(pwd)) strength += 15
      if (/[0-9]/.test(pwd)) strength += 15
      if (/[@$!%*?&#]/.test(pwd)) strength += 15
      if (pwd.length >= 16) strength += 10

      passwordStrength.value = strength

      if (strength < 40) {
        passwordStrength.text = 'Weak'
        passwordStrength.color = 'error'
      } else if (strength < 70) {
        passwordStrength.text = 'Medium'
        passwordStrength.color = 'warning'
      } else {
        passwordStrength.text = 'Strong'
        passwordStrength.color = 'success'
      }
    }

    const handleRegister = async () => {
      error.value = null

      const { valid: formValid } = await form.value.validate()
      if (!formValid) return

      loading.value = true
      try {
        const result = await register(email.value, password.value, username.value, confirmPassword.value)
        if (result.success) {
          router.push({ name: 'UserDashboard' })
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
      passwordStrength,
      usernameRules,
      emailRules,
      passwordRules,
      confirmPasswordRules,
      updatePasswordStrength,
      handleRegister,
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