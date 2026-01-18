import { reactive } from 'vue'

export function useNotification() {
    const snackbar = reactive({
        show: false,
        message: '',
        color: 'success',
    })

    const showNotification = (message, color = 'success') => {
        snackbar.message = message
        snackbar.color = color
        snackbar.show = true
    }

    const showSuccess = (message) => showNotification(message, 'success')
    const showError = (message) => showNotification(message, 'error')
    const showWarning = (message) => showNotification(message, 'warning')
    const showInfo = (message) => showNotification(message, 'info')

    return {
        snackbar,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    }
}
