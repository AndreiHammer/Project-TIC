<template>
    <v-card elevation="2">
        <v-card-text class="pa-4">
            <v-row align="center">
                <v-col cols="12" md="3">
                    <v-text-field v-model="localFilters.search" label="Search products..."
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" clearable hide-details
                        @update:model-value="debouncedSearch"></v-text-field>
                </v-col>

                <v-col cols="12" md="3">
                    <div class="price-filter-wrapper">
                        <div class="d-flex justify-space-between align-center mb-1">
                            <span class="text-body-2 text-medium-emphasis">Price Range (€)</span>
                            <span class="text-body-2 font-weight-bold">
                                €{{ localPriceRange[0] }} - €{{ localPriceRange[1] }}
                            </span>
                        </div>
                        <v-range-slider v-model="localPriceRange" :min="0" :max="1000" :step="10" color="primary"
                            hide-details @end="emitChanges"></v-range-slider>
                    </div>
                </v-col>

                <v-col cols="12" md="3">
                    <v-select v-model="localFilters.sortBy" :items="sortOptions" label="Sort By" variant="outlined"
                        density="comfortable" hide-details @update:model-value="emitChanges"></v-select>
                </v-col>

                <v-col cols="12" md="3" class="d-flex align-center justify-center">
                    <v-switch v-model="localFilters.inStockOnly" label="In Stock Only" color="success" hide-details
                        @update:model-value="emitChanges"></v-switch>
                </v-col>
            </v-row>

            <v-row v-if="hasActiveFilters" class="mt-2">
                <v-col cols="12">
                    <v-divider class="mb-3"></v-divider>
                    <div class="d-flex flex-wrap align-center">
                        <span class="text-body-2 text-medium-emphasis mr-2">Active Filters:</span>
                        <v-chip v-if="localFilters.search" closable @click:close="clearSearch" class="mr-2 mb-2"
                            size="small">
                            <v-icon icon="mdi-magnify" start size="small"></v-icon>
                            {{ localFilters.search }}
                        </v-chip>
                        <v-chip v-if="localPriceRange[0] > 0 || localPriceRange[1] < 1000" closable
                            @click:close="clearPriceFilter" class="mr-2 mb-2" size="small">
                            <v-icon icon="mdi-currency-eur" start size="small"></v-icon>
                            €{{ localPriceRange[0] }} - €{{ localPriceRange[1] }}
                        </v-chip>
                        <v-chip v-if="localFilters.inStockOnly" closable @click:close="clearInStockFilter"
                            class="mr-2 mb-2" size="small" color="success">
                            <v-icon icon="mdi-check-circle" start size="small"></v-icon>
                            In Stock Only
                        </v-chip>
                        <v-btn v-if="hasActiveFilters" variant="text" size="small" color="error"
                            @click="clearAllFilters" class="ml-2">
                            Clear All
                        </v-btn>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
    name: 'ProductFilters',
    props: {
        filters: {
            type: Object,
            required: true,
        },
        priceRange: {
            type: Array,
            default: () => [0, 1000],
        },
    },
    emits: ['update:filters', 'update:priceRange', 'apply'],
    setup(props, { emit }) {
        const localFilters = ref({ ...props.filters })
        const localPriceRange = ref([...props.priceRange])

        const sortOptions = [
            { title: 'Newest First', value: 'createdAt' },
            { title: 'Price: Low to High', value: 'price-asc' },
            { title: 'Price: High to Low', value: 'price-desc' },
            { title: 'Name: A-Z', value: 'name-asc' },
            { title: 'Highest Rated', value: 'rating' },
        ]

        const hasActiveFilters = computed(() => {
            return localFilters.value.search ||
                localPriceRange.value[0] > 0 ||
                localPriceRange.value[1] < 1000 ||
                localFilters.value.inStockOnly
        })

        let searchTimeout = null

        const emitChanges = () => {
            emit('update:filters', { ...localFilters.value })
            emit('update:priceRange', [...localPriceRange.value])
            emit('apply')
        }

        const debouncedSearch = () => {
            clearTimeout(searchTimeout)
            searchTimeout = setTimeout(() => {
                emitChanges()
            }, 500)
        }

        const clearSearch = () => {
            localFilters.value.search = ''
            emitChanges()
        }

        const clearPriceFilter = () => {
            localPriceRange.value = [0, 1000]
            emitChanges()
        }

        const clearInStockFilter = () => {
            localFilters.value.inStockOnly = false
            emitChanges()
        }

        const clearAllFilters = () => {
            localFilters.value.search = ''
            localFilters.value.inStockOnly = false
            localPriceRange.value = [0, 1000]
            emitChanges()
        }

        watch(() => props.filters, (newFilters) => {
            localFilters.value = { ...newFilters }
        }, { deep: true })

        watch(() => props.priceRange, (newPriceRange) => {
            localPriceRange.value = [...newPriceRange]
        }, { deep: true })

        return {
            localFilters,
            localPriceRange,
            sortOptions,
            hasActiveFilters,
            emitChanges,
            debouncedSearch,
            clearSearch,
            clearPriceFilter,
            clearInStockFilter,
            clearAllFilters,
        }
    },
}
</script>