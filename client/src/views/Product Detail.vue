<template>
    <v-app>
        <AppNav :title="product?.name || 'Product Details'" show-back :cart-count="cartCount" />

        <v-main>
            <v-container class="pa-6">
                <v-row v-if="loading">
                    <v-col cols="12" md="6">
                        <v-skeleton-loader type="image"></v-skeleton-loader>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-skeleton-loader type="article"></v-skeleton-loader>
                    </v-col>
                </v-row>

                <v-row v-else-if="product">
                    <v-col cols="12" md="6">
                        <v-card elevation="3">
                            <v-img :src="selectedImage" :alt="product.name" height="500" cover class="mb-4">
                                <div class="badges">
                                    <v-chip v-if="product.flags?.onSale" color="error" size="large" class="ma-2">
                                        SALE -{{ product.price?.discountPercent }}%
                                    </v-chip>
                                    <v-chip v-if="product.flags?.featured" color="warning" size="large" class="ma-2">
                                        <v-icon icon="mdi-star" start></v-icon>
                                        Featured
                                    </v-chip>
                                </div>
                            </v-img>

                            <div v-if="product.images && product.images.length > 1" class="pa-4">
                                <v-row>
                                    <v-col v-for="(image, index) in product.images" :key="index" cols="3">
                                        <v-img :src="image.url" :alt="`${product.name} ${index + 1}`" height="80" cover
                                            class="thumbnail"
                                            :class="{ 'thumbnail-active': selectedImage === image.url }"
                                            @click="selectedImage = image.url"></v-img>
                                    </v-col>
                                </v-row>
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-card elevation="3" class="pa-6">
                            <h1 class="text-h3 font-weight-bold mb-4">{{ product.name }}</h1>

                            <div v-if="product.rating" class="d-flex align-center mb-4">
                                <v-rating :model-value="product.rating.avg" readonly density="comfortable"
                                    color="warning" half-increments></v-rating>
                                <span class="ml-2 text-h6 text-medium-emphasis">
                                    {{ product.rating.avg }} ({{ product.rating.count }} reviews)
                                </span>
                            </div>

                            <v-divider class="mb-4"></v-divider>

                            <div class="mb-4">
                                <div v-if="product.flags?.onSale" class="mb-2">
                                    <span class="text-h5 text-decoration-line-through text-medium-emphasis">
                                        €{{ product.price?.base?.toFixed(2) }}
                                    </span>
                                </div>
                                <div class="d-flex align-center">
                                    <span class="text-h3 font-weight-bold text-primary">
                                        €{{ product.price?.value?.toFixed(2) }}
                                    </span>
                                    <v-chip v-if="product.flags?.onSale" color="error" class="ml-4">
                                        Save €{{ (product.price.base - product.price.value).toFixed(2) }}
                                    </v-chip>
                                </div>
                            </div>

                            <v-divider class="mb-4"></v-divider>

                            <div class="mb-4">
                                <v-chip :color="getStockColor" size="large" variant="tonal">
                                    <v-icon :icon="getStockIcon" start></v-icon>
                                    {{ getStockText }}
                                </v-chip>
                            </div>

                            <div v-if="!isOutOfStock" class="mb-4">
                                <label class="text-h6 mb-2 d-block">Quantity:</label>
                                <div class="d-flex align-center">
                                    <v-btn icon="mdi-minus" variant="outlined" color="primary"
                                        @click="decrementQuantity" :disabled="quantity <= 1"></v-btn>
                                    <div class="px-6 text-h5 font-weight-bold"
                                        style="min-width: 60px; text-align: center;">
                                        {{ quantity }}
                                    </div>
                                    <v-btn icon="mdi-plus" variant="outlined" color="primary" @click="incrementQuantity"
                                        :disabled="quantity >= availableStock"></v-btn>
                                </div>
                            </div>
                            <v-btn color="primary" size="x-large" block :disabled="isOutOfStock || addingToCart"
                                :loading="addingToCart" @click="handleAddToCart" class="mb-4">
                                <v-icon :icon="buttonIcon" start></v-icon>
                                {{ buttonText }}
                            </v-btn>

                            <v-divider class="my-4"></v-divider>

                            <div class="mb-4">
                                <h3 class="text-h6 font-weight-bold mb-3">Product Details</h3>
                                <v-list density="compact">
                                    <v-list-item v-if="product.attributes?.brand">
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-tag" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title>Brand</v-list-item-title>
                                        <v-list-item-subtitle>{{ product.attributes.brand }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="product.category?.name">
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-shape" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title>Category</v-list-item-title>
                                        <v-list-item-subtitle>{{ product.category.name }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="product.attributes?.material">
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-material-design" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title>Material</v-list-item-title>
                                        <v-list-item-subtitle>{{ product.attributes.material }}</v-list-item-subtitle>
                                    </v-list-item>

                                    <v-list-item v-if="product.attributes?.colors && product.attributes.colors.length">
                                        <template v-slot:prepend>
                                            <v-icon icon="mdi-palette" color="primary"></v-icon>
                                        </template>
                                        <v-list-item-title>Colors</v-list-item-title>
                                        <v-list-item-subtitle>
                                            <v-chip v-for="color in product.attributes.colors" :key="color" size="small"
                                                class="mr-1">
                                                {{ color }}
                                            </v-chip>
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12">
                        <v-card elevation="3" class="pa-6">
                            <h2 class="text-h4 font-weight-bold mb-4">Description</h2>
                            <p class="text-body-1" style="white-space: pre-line;">
                                {{ product.description }}
                            </p>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row v-else-if="error">
                    <v-col cols="12" class="text-center">
                        <v-icon icon="mdi-alert-circle" size="100" color="error"></v-icon>
                        <h2 class="text-h5 mt-4">{{ error }}</h2>
                        <v-btn color="primary" class="mt-4" @click="$router.push({ name: 'Products' })">
                            Back to Products
                        </v-btn>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
        </v-snackbar>
    </v-app>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '../components/AppNav.vue'
import productService from '../services/productService'
import { useProductStock } from '../composables/useProductStock'
import { useCart } from '../composables/useCart'
import { useNotification } from '../composables/useNotification'

export default {
    name: 'ProductDetail',
    components: {
        AppNav,
    },
    setup() {
        const route = useRoute()
        const { snackbar, showSuccess, showError } = useNotification()

        const product = ref(null)
        const loading = ref(true)
        const error = ref(null)
        const selectedImage = ref('')
        const quantity = ref(1)
        const addingToCart = ref(false)

        const { cartCount, cartItems, addToCart, updateCartItem } = useCart()
        const { isOutOfStock, availableStock, stockColor: getStockColor, stockIcon: getStockIcon, stockTextLong: getStockText } = useProductStock(product)

        const cartItem = computed(() => {
            if (!product.value || !cartItems.value) return null
            return cartItems.value.find(item => item.productId === product.value.id)
        })

        const isInCart = computed(() => !!cartItem.value)

        const buttonText = computed(() => {
            if (isOutOfStock.value) return 'Out of Stock'
            if (isInCart.value) return 'Update Cart'
            return 'Add to Cart'
        })

        const buttonIcon = computed(() => {
            if (isInCart.value) return 'mdi-cart-check'
            return 'mdi-cart-plus'
        })

        const fetchProduct = async () => {
            loading.value = true
            error.value = null

            try {
                const result = await productService.getProductById(route.params.id)

                if (result.success) {
                    product.value = result.data

                    const primaryImage = product.value.images?.find(img => img.isPrimary)
                    selectedImage.value = primaryImage?.url || product.value.images?.[0]?.url || ''
                } else {
                    error.value = result.error || 'Product not found'
                }
            } catch (err) {
                error.value = 'Failed to load product'
            } finally {
                loading.value = false
            }
        }

        watch(cartItem, (newCartItem) => {
            if (newCartItem) {
                quantity.value = newCartItem.quantity
            } else {
                quantity.value = 1
            }
        }, { immediate: true })

        onMounted(() => {
            fetchProduct()
        })

        const incrementQuantity = () => {
            if (quantity.value < availableStock.value) {
                quantity.value++
            }
        }

        const decrementQuantity = () => {
            if (quantity.value > 1) {
                quantity.value--
            }
        }

        const handleAddToCart = async () => {
            addingToCart.value = true

            let result
            if (isInCart.value) {
                result = await updateCartItem(product.value.id, quantity.value)
                if (result.success) {
                    showSuccess(`Cart updated to ${quantity.value} item(s)!`)
                } else {
                    showError(result.error || 'Failed to update cart')
                }
            } else {
                result = await addToCart(product.value.id, quantity.value)
                if (result.success) {
                    showSuccess(`Added ${quantity.value} item(s) to cart!`)
                } else {
                    showError(result.error || 'Failed to add to cart')
                }
            }

            addingToCart.value = false
        }

        return {
            product,
            loading,
            error,
            selectedImage,
            quantity,
            cartCount,
            isOutOfStock,
            availableStock,
            getStockColor,
            getStockIcon,
            getStockText,
            addingToCart,
            isInCart,
            buttonText,
            buttonIcon,
            incrementQuantity,
            decrementQuantity,
            handleAddToCart,
            snackbar,
        }
    },
}
</script>

<style scoped>
.badges {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}

.thumbnail {
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

.thumbnail:hover {
    border-color: #1976D2;
}

.thumbnail-active {
    border-color: #1976D2;
    box-shadow: 0 0 8px rgba(25, 118, 210, 0.5);
}
</style>