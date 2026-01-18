<template>
    <v-card class="product-card" hover @click="handleClick" elevation="3">
        <v-img :src="productImage" :alt="product.name" height="250" cover class="product-image">
            <div class="badges">
                <v-chip v-if="product.flags?.onSale" color="error" size="small" class="ma-2">
                    -{{ product.price?.discountPercent }}%
                </v-chip>
                <v-chip v-if="product.flags?.featured" color="warning" size="small" class="ma-2">
                    <v-icon icon="mdi-star" start></v-icon>
                    Featured
                </v-chip>
            </div>

            <div v-if="isOutOfStock" class="out-of-stock-overlay">
                <v-chip color="error" size="large">
                    Out of Stock
                </v-chip>
            </div>
        </v-img>

        <v-card-text>
            <h3 class="text-h6 font-weight-bold mb-2 text-truncate">
                {{ product.name }}
            </h3>

            <div v-if="product.rating" class="d-flex align-center mb-2">
                <v-rating :model-value="product.rating.avg" readonly density="compact" size="small" color="warning"
                    half-increments></v-rating>
                <span class="text-caption ml-2 text-medium-emphasis">
                    ({{ product.rating.count }})
                </span>
            </div>

            <div class="d-flex align-center justify-space-between">
                <div>
                    <span v-if="product.flags?.onSale" class="text-decoration-line-through text-medium-emphasis mr-2">
                        €{{ product.price?.base?.toFixed(2) }}
                    </span>
                    <span class="text-h6 font-weight-bold text-primary">
                        €{{ product.price?.value?.toFixed(2) }}
                    </span>
                </div>
            </div>

            <div class="mt-2">
                <v-chip v-if="!isOutOfStock" :color="stockColor" size="x-small" variant="tonal">
                    {{ stockText }}
                </v-chip>
            </div>
        </v-card-text>

        <v-card-actions v-if="!adminMode">
            <v-btn color="primary" variant="tonal" block :disabled="isOutOfStock"
                @click.stop="$emit('add-to-cart', product)">
                <v-icon icon="mdi-cart-plus" start></v-icon>
                Add to Cart
            </v-btn>
        </v-card-actions>

        <v-card-actions v-else class="pa-2">
            <v-btn color="warning" variant="text" size="small" @click.stop="$emit('manage-stock', product)">
                <v-icon icon="mdi-package-variant" start></v-icon>
                Stock
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" size="small" @click.stop="$emit('delete', product)">
                <v-icon icon="mdi-delete"></v-icon>
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import { computed, toRef } from 'vue'
import { useProductStock } from '../composables/useProductStock'

export default {
    name: 'ProductCard',
    props: {
        product: {
            type: Object,
            required: true,
        },
        adminMode: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['click', 'add-to-cart', 'edit', 'delete', 'manage-stock'],
    setup(props, { emit }) {
        const productRef = toRef(props, 'product')
        const { isOutOfStock, stockColor, stockText } = useProductStock(productRef)

        const productImage = computed(() => {
            const primaryImage = props.product.images?.find(img => img.isPrimary)
            return primaryImage?.url || props.product.images?.[0]?.url || 'https://via.placeholder.com/300'
        })

        const handleClick = () => {
            if (props.adminMode) {
                emit('edit', props.product)
            } else {
                emit('click', props.product.id)
            }
        }

        return {
            productImage,
            isOutOfStock,
            stockColor,
            stockText,
            handleClick,
        }
    },
}
</script>

<style scoped>
.product-card {
    cursor: pointer;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.product-image {
    position: relative;
}

.badges {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}

.out-of-stock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}
</style>