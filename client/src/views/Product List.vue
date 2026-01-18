<template>
    <v-app>
        <AppNav title="Products" icon="mdi-store" :cart-count="cartCount" />

        <v-main>
            <v-container fluid class="pa-6">
                <v-row class="mb-4">
                    <v-col cols="12">
                        <ProductFilters :filters="filters" :price-range="priceRange" @update:filters="updateFilters"
                            @update:price-range="updatePriceRange" @apply="applyFilters" />
                    </v-col>
                </v-row>

                <v-row v-if="!loading && products.length > 0">
                    <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
                        <ProductCard :product="product" @click="goToProduct" @add-to-cart="addToCart" />
                    </v-col>
                </v-row>

                <v-row v-if="loading && products.length === 0" class="mt-4">
                    <v-col v-for="n in 12" :key="n" cols="12" sm="6" md="4" lg="3">
                        <v-skeleton-loader type="card"></v-skeleton-loader>
                    </v-col>
                </v-row>

                <v-row v-if="loadingMore" class="mt-4">
                    <v-col cols="12" class="text-center">
                        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
                        <p class="mt-2">Loading more products...</p>
                    </v-col>
                </v-row>

                <v-row v-if="!loading && products.length === 0" class="mt-8">
                    <v-col cols="12" class="text-center">
                        <v-icon icon="mdi-package-variant-closed" size="100" color="grey"></v-icon>
                        <h2 class="text-h5 mt-4">No products found</h2>
                        <p class="text-medium-emphasis">Try adjusting your filters</p>
                    </v-col>
                </v-row>

                <div ref="infiniteScrollTrigger" style="height: 1px;"></div>
            </v-container>
            <v-fab v-show="showBackToTop" icon="mdi-chevron-up" location="bottom end" color="primary" size="large" app
                @click="scrollToTop" :style="{ marginBottom: '24px', marginRight: '24px' }"></v-fab>
        </v-main>
    </v-app>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductFilters from '../components/ProductFilters.vue'
import { useProducts } from '../composables/useProducts'

export default {
    name: 'ProductsList',
    components: {
        AppNav,
        ProductCard,
        ProductFilters,
    },
    setup() {
        const router = useRouter()
        const cartCount = ref(0)

        const {
            products,
            loading,
            loadingMore,
            filters,
            priceRange,
            infiniteScrollTrigger,
            showBackToTop,
            updateFilters,
            updatePriceRange,
            applyFilters,
            scrollToTop,
            saveScrollPosition,
        } = useProducts({
            enableInfiniteScroll: true,
            enableScrollRestoration: true,
            enableAutoUpdate: true,
        })

        const goToProduct = (productId) => {
            saveScrollPosition()
            router.push({ name: 'ProductDetail', params: { id: productId } })
        }

        const addToCart = () => {
            cartCount.value++
        }

        return {
            products,
            loading,
            loadingMore,
            filters,
            priceRange,
            cartCount,
            infiniteScrollTrigger,
            updateFilters,
            updatePriceRange,
            applyFilters,
            goToProduct,
            addToCart,
            showBackToTop,
            scrollToTop,
        }
    },
}
</script>