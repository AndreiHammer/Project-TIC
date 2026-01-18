import { computed } from 'vue'

export function useProductStock(product) {
    const availableStock = computed(() => {
        if (!product.value) return 0
        return (product.value.stock?.quantity || 0) - (product.value.stock?.reserved || 0)
    })

    const isOutOfStock = computed(() => availableStock.value <= 0)

    const stockColor = computed(() => {
        if (availableStock.value > 20) return 'success'
        if (availableStock.value > 0) return 'warning'
        return 'error'
    })

    const stockIcon = computed(() => {
        if (availableStock.value > 20) return 'mdi-check-circle'
        if (availableStock.value > 0) return 'mdi-alert'
        return 'mdi-close-circle'
    })

    const stockText = computed(() => {
        if (availableStock.value > 20) return 'In Stock'
        if (availableStock.value > 0) return `Only ${availableStock.value} left`
        return 'Out of Stock'
    })

    const stockTextLong = computed(() => {
        if (availableStock.value > 20) return 'In Stock'
        if (availableStock.value > 0) return `Only ${availableStock.value} left in stock`
        return 'Out of Stock'
    })

    return {
        availableStock,
        isOutOfStock,
        stockColor,
        stockIcon,
        stockText,
        stockTextLong,
    }
}
