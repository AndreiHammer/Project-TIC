import { ref, reactive, onMounted, onUnmounted, onActivated, onDeactivated, nextTick } from 'vue'
import productService from '../services/productService'

export function useProducts(options = {}) {
    const {
        autoFetch = true,
        enableInfiniteScroll = true,
        enableScrollRestoration = false,
        enableAutoUpdate = false,
        limit = 12,
    } = options

    const products = ref([])
    const loading = ref(false)
    const loadingMore = ref(false)
    const currentOffset = ref(0)
    const hasMore = ref(true)
    const scrollPosition = ref(0)
    const showBackToTop = ref(false)

    const filters = reactive({
        search: '',
        sortBy: 'createdAt',
        inStockOnly: false,
    })

    const priceRange = ref([0, 1000])

    let observer = null
    const infiniteScrollTrigger = ref(null)

    const parseSortBy = (sortByValue) => {
        let sortField = 'createdAt'
        let sortOrder = 'desc'

        if (sortByValue.includes('-')) {
            const parts = sortByValue.split('-')
            sortField = parts[0]
            sortOrder = parts[1]
        } else {
            sortField = sortByValue
        }

        return { sortField, sortOrder }
    }

    const fetchProducts = async (append = false, bustCache = false) => {
        if (!append) {
            loading.value = true
            products.value = []
            currentOffset.value = 0
        } else {
            loadingMore.value = true
        }

        try {
            const { sortField, sortOrder } = parseSortBy(filters.sortBy)

            const params = {
                offset: currentOffset.value,
                limit: limit,
                minPrice: priceRange.value[0],
                maxPrice: priceRange.value[1],
                search: filters.search || undefined,
                sortBy: sortField,
                sortOrder: sortOrder,
                bustCache: bustCache,
            }

            const result = await productService.getAllProducts(params)

            if (result.success) {
                let filteredData = result.data

                if (filters.inStockOnly) {
                    filteredData = filteredData.filter(p => {
                        const available = (p.stock?.quantity || 0) - (p.stock?.reserved || 0)
                        return available > 0
                    })
                }

                if (append) {
                    products.value = [...products.value, ...filteredData]
                } else {
                    products.value = filteredData
                }
                hasMore.value = result.pagination.hasMore

                return { success: true }
            } else {
                return { success: false, error: result.error }
            }
        } catch (error) {
            console.error('Error fetching products:', error)
            return { success: false, error: 'Failed to fetch products' }
        } finally {
            loading.value = false
            loadingMore.value = false
        }
    }

    const updateFilters = (newFilters) => {
        if (newFilters.search !== undefined) filters.search = newFilters.search
        if (newFilters.sortBy !== undefined) filters.sortBy = newFilters.sortBy
        if (newFilters.inStockOnly !== undefined) filters.inStockOnly = newFilters.inStockOnly
    }

    const updatePriceRange = (newRange) => {
        priceRange.value = [newRange[0], newRange[1]]
    }

    const applyFilters = async () => {
        await nextTick()
        currentOffset.value = 0
        hasMore.value = true
        await fetchProducts(false)
    }

    const loadMore = () => {
        if (!loadingMore.value && hasMore.value) {
            currentOffset.value += limit
            fetchProducts(true)
        }
    }

    const setupInfiniteScroll = () => {
        if (!enableInfiniteScroll) return

        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
                    loadMore()
                }
            },
            { threshold: 0.5 }
        )

        if (infiniteScrollTrigger.value) {
            observer.observe(infiniteScrollTrigger.value)
        }
    }

    const cleanupInfiniteScroll = () => {
        if (observer && infiniteScrollTrigger.value) {
            observer.unobserve(infiniteScrollTrigger.value)
        }
    }

    const handleScroll = () => {
        showBackToTop.value = window.scrollY > 300
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const saveScrollPosition = () => {
        scrollPosition.value = window.scrollY || document.documentElement.scrollTop
    }

    const restoreScrollPosition = () => {
        if (scrollPosition.value > 0) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition.value)
            }, 0)
        }
    }

    const checkForUpdates = () => {
        if (!enableAutoUpdate) return

        const lastUpdate = localStorage.getItem('products-last-updated')
        const lastCheck = sessionStorage.getItem('products-last-check')

        if (lastUpdate && lastUpdate !== lastCheck) {
            sessionStorage.setItem('products-last-check', lastUpdate)
            fetchProducts(false, false)
        }
    }

    const handleProductsUpdated = () => {
        fetchProducts(false, false)
    }

    const handleStorageChange = (e) => {
        if (e.key === 'products-last-updated' && e.newValue !== e.oldValue) {
            fetchProducts(false, false)
        }
    }

    const notifyProductsUpdated = () => {
        const timestamp = Date.now().toString()
        localStorage.setItem('products-last-updated', timestamp)
        window.dispatchEvent(new CustomEvent('products-updated'))
    }

    const refreshProducts = async () => {
        await fetchProducts(false, true)
    }

    const setupEventListeners = () => {
        window.addEventListener('scroll', handleScroll)
        if (enableAutoUpdate) {
            window.addEventListener('products-updated', handleProductsUpdated)
            window.addEventListener('storage', handleStorageChange)
        }
    }

    const cleanupEventListeners = () => {
        window.removeEventListener('scroll', handleScroll)
        if (enableAutoUpdate) {
            window.removeEventListener('products-updated', handleProductsUpdated)
            window.removeEventListener('storage', handleStorageChange)
        }
    }

    onMounted(() => {
        if (autoFetch) {
            fetchProducts(false, false)
            checkForUpdates()
        }
        setupInfiniteScroll()
        setupEventListeners()
    })

    onActivated(() => {
        if (enableScrollRestoration) {
            checkForUpdates()
            restoreScrollPosition()
        } else if (enableAutoUpdate) {
            checkForUpdates()
        }
        if (observer && infiniteScrollTrigger.value) {
            observer.observe(infiniteScrollTrigger.value)
        }
    })

    onDeactivated(() => {
        if (enableScrollRestoration) {
            saveScrollPosition()
        }
        cleanupInfiniteScroll()
    })

    onUnmounted(() => {
        cleanupInfiniteScroll()
        cleanupEventListeners()
    })

    return {
        products,
        loading,
        loadingMore,
        filters,
        priceRange,
        hasMore,
        showBackToTop,
        infiniteScrollTrigger,
        fetchProducts,
        refreshProducts,
        updateFilters,
        updatePriceRange,
        applyFilters,
        loadMore,
        scrollToTop,
        saveScrollPosition,
        notifyProductsUpdated,
    }
}
