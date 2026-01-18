<template>
    <v-app>
        <AppNav title="Product Management" icon="mdi-package-variant" :show-cart="false" />

        <v-main>
            <v-container fluid class="pa-6">
                <v-row class="mb-4">
                    <v-col cols="12" class="d-flex justify-space-between align-center">
                        <div>
                            <h1 class="text-h4 font-weight-bold">Product Management</h1>
                            <p class="text-medium-emphasis">Manage your product catalog</p>
                        </div>
                        <v-btn color="primary" size="large" @click="openAddDialog">
                            <v-icon icon="mdi-plus" start></v-icon>
                            Add Product
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row class="mb-4">
                    <v-col cols="12">
                        <ProductFilters :filters="filters" :price-range="priceRange" @update:filters="updateFilters"
                            @update:price-range="updatePriceRange" @apply="applyFilters" />
                    </v-col>
                </v-row>

                <v-row v-if="!loading && products.length > 0">
                    <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
                        <ProductCard :product="product" admin-mode @edit="openEditDialog" @delete="confirmDelete"
                            @manage-stock="openStockDialog" />
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
                        <p class="text-medium-emphasis mb-4">Start by adding your first product</p>
                        <v-btn color="primary" @click="openAddDialog">
                            <v-icon icon="mdi-plus" start></v-icon>
                            Add Product
                        </v-btn>
                    </v-col>
                </v-row>

                <div ref="infiniteScrollTrigger" style="height: 1px;"></div>
            </v-container>

            <v-fab v-show="showBackToTop" icon="mdi-chevron-up" location="bottom end" color="primary" size="large" app
                @click="scrollToTop" :style="{ marginBottom: '24px', marginRight: '24px' }"></v-fab>
        </v-main>

        <ProductForm v-model="showProductDialog" :product="selectedProduct" :loading="formLoading"
            @submit="handleProductSubmit" />

        <StockManager v-model="showStockDialog" :product="selectedProduct" :loading="stockLoading"
            @submit="handleStockUpdate" />

        <v-dialog v-model="showDeleteDialog" max-width="500" persistent>
            <v-card>
                <v-card-title class="bg-error text-white pa-4">
                    <v-icon icon="mdi-alert" class="mr-2"></v-icon>
                    Confirm Delete
                </v-card-title>
                <v-card-text class="pa-6">
                    <p class="text-h6">Are you sure you want to delete this product?</p>
                    <p class="mt-2"><strong>{{ selectedProduct?.name }}</strong></p>
                    <v-alert type="warning" variant="tonal" class="mt-4">
                        This action cannot be undone.
                    </v-alert>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="outlined" @click="showDeleteDialog = false" :disabled="deleteLoading">
                        Cancel
                    </v-btn>
                    <v-btn color="error" variant="elevated" @click="handleDelete" :loading="deleteLoading">
                        Delete Product
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
            <template v-slot:actions>
                <v-btn color="white" variant="text" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script>
import { ref } from 'vue'
import AppNav from '../components/AppNav.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductFilters from '../components/ProductFilters.vue'
import ProductForm from '../components/ProductForm.vue'
import StockManager from '../components/StockManager.vue'
import productService from '../services/productService'
import { useProducts } from '../composables/useProducts'
import { useNotification } from '../composables/useNotification'

export default {
    name: 'AdminProductManagement',
    components: {
        AppNav,
        ProductCard,
        ProductFilters,
        ProductForm,
        StockManager,
    },
    setup() {
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
            refreshProducts,
            notifyProductsUpdated,
        } = useProducts({
            enableInfiniteScroll: true,
        })

        const { snackbar, showSuccess, showError } = useNotification()

        const showProductDialog = ref(false)
        const showStockDialog = ref(false)
        const showDeleteDialog = ref(false)
        const selectedProduct = ref(null)
        const formLoading = ref(false)
        const stockLoading = ref(false)
        const deleteLoading = ref(false)

        const openAddDialog = () => {
            selectedProduct.value = null
            showProductDialog.value = true
        }

        const openEditDialog = (product) => {
            selectedProduct.value = { ...product }
            showProductDialog.value = true
        }

        const openStockDialog = (product) => {
            selectedProduct.value = { ...product }
            showStockDialog.value = true
        }

        const confirmDelete = (product) => {
            selectedProduct.value = product
            showDeleteDialog.value = true
        }

        const handleProductSubmit = async (productData) => {
            formLoading.value = true
            try {
                let result
                if (selectedProduct.value?.id) {
                    result = await productService.updateProduct(selectedProduct.value.id, productData)
                } else {
                    result = await productService.createProduct(productData)
                }

                if (result.success) {
                    showSuccess(
                        selectedProduct.value?.id ? 'Product updated successfully' : 'Product created successfully'
                    )
                    showProductDialog.value = false
                    notifyProductsUpdated()
                    await refreshProducts()
                } else {
                    showError(result.error)
                }
            } catch (error) {
                showError('Error saving product')
            } finally {
                formLoading.value = false
            }
        }

        const handleStockUpdate = async ({ productId, quantityChange }) => {
            stockLoading.value = true
            try {
                const result = await productService.updateProductStock(productId, quantityChange)

                if (result.success) {
                    showSuccess('Stock updated successfully')
                    showStockDialog.value = false
                    notifyProductsUpdated()
                    await refreshProducts()
                } else {
                    showError(result.error)
                }
            } catch (error) {
                showError('Error updating stock')
            } finally {
                stockLoading.value = false
            }
        }

        const handleDelete = async () => {
            deleteLoading.value = true
            try {
                const result = await productService.deleteProduct(selectedProduct.value.id)

                if (result.success) {
                    showSuccess('Product deleted successfully')
                    showDeleteDialog.value = false
                    notifyProductsUpdated()
                    await refreshProducts()
                } else {
                    showError(result.error)
                }
            } catch (error) {
                showError('Error deleting product')
            } finally {
                deleteLoading.value = false
            }
        }

        return {
            products,
            loading,
            loadingMore,
            filters,
            priceRange,
            infiniteScrollTrigger,
            showBackToTop,
            showProductDialog,
            showStockDialog,
            showDeleteDialog,
            selectedProduct,
            formLoading,
            stockLoading,
            deleteLoading,
            snackbar,
            updateFilters,
            updatePriceRange,
            applyFilters,
            openAddDialog,
            openEditDialog,
            openStockDialog,
            confirmDelete,
            handleProductSubmit,
            handleStockUpdate,
            handleDelete,
            scrollToTop,
        }
    },
}
</script>