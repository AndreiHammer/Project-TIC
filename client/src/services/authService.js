import api from "./api"

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/users/login', {
        email,
        password,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {

      const errorData = error.response?.data
      if (errorData) {
        return {
          success: false,
          error: Array.isArray(errorData.error)
            ? errorData.error
            : errorData.error || 'Login failed',
        }
      }

      return {
        success: false,
        error: error.message || 'Login failed',
      }
    }
  },

  async register(email, password, username, confirmPassword) {
    try {
      const response = await api.post('/users/register', {
        email,
        password,
        username,
        confirmPassword,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {

      const errorData = error.response?.data
      if (errorData) {
        return {
          success: false,
          error: Array.isArray(errorData.error)
            ? errorData.error
            : errorData.error || 'Registration failed',
        }
      }

      return {
        success: false,
        error: error.message || 'Registration failed',
      }
    }
  },
}

export default authService
