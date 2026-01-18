<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500"
        persistent>
        <v-card>
            <v-card-title class="bg-primary text-white pa-4">
                <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
                Manage Stock
            </v-card-title>

            <v-card-text class="pa-6">
                <h3 class="text-h6 mb-4">{{ product?.name }}</h3>

                <v-row>
                    <v-col cols="6">
                        <v-card color="primary" variant="tonal">
                            <v-card-text>
                                <div class="text-body-2">Current Stock</div>
                                <div class="text-h4 font-weight-bold">{{ product?.stock?.quantity || 0 }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="6">
                        <v-card color="warning" variant="tonal">
                            <v-card-text>
                                <div class="text-body-2">Reserved</div>
                                <div class="text-h4 font-weight-bold">{{ product?.stock?.reserved || 0 }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12">
                        <v-card color="success" variant="tonal">
                            <v-card-text>
                                <div class="text-body-2">Available</div>
                                <div class="text-h4 font-weight-bold">{{ availableStock }}</div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <v-form ref="formRef" v-model="valid">
                    <div class="d-flex align-center mb-4">
                        <v-btn-toggle v-model="changeType" mandatory color="primary" variant="outlined" divided
                            class="mr-3">
                            <v-btn value="add" size="small">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                            <v-btn value="remove" size="small">
                                <v-icon>mdi-minus</v-icon>
                            </v-btn>
                        </v-btn-toggle>

                        <v-text-field v-model.number="quantityInput" label="Quantity" variant="outlined" type="number"
                            density="comfortable" :rules="[rules.required, rules.positive]" hide-details
                            min="1"></v-text-field>
                    </div>

                    <div class="text-caption text-medium-emphasis mb-4">
                        {{ changeType === 'add' ? 'Add' : 'Remove' }} {{ quantityInput || 0 }} unit(s) {{ changeType ===
                            'add' ? 'to' : 'from' }} stock
                    </div>

                    <v-alert v-if="newStockPreview !== null" :type="newStockPreview >= 0 ? 'success' : 'error'"
                        variant="tonal" class="mt-4">
                        <div class="d-flex align-center justify-space-between">
                            <div>
                                <div class="text-body-2">New Stock After Update:</div>
                                <div class="text-h5 font-weight-bold mt-1">{{ newStockPreview }}</div>
                            </div>
                            <v-icon v-if="newStockPreview >= 0" icon="mdi-check-circle" size="large"></v-icon>
                            <v-icon v-else icon="mdi-alert-circle" size="large"></v-icon>
                        </div>
                    </v-alert>

                    <v-alert v-if="newStockPreview < 0" type="error" variant="outlined" class="mt-2">
                        Cannot remove more stock than available!
                    </v-alert>
                </v-form>
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="outlined" @click="handleCancel" :disabled="loading">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="elevated" @click="handleSubmit" :loading="loading"
                    :disabled="!valid || newStockPreview < 0 || !quantityInput">
                    Update Stock
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
    name: 'StockManager',
    props: {
        modelValue: {
            type: Boolean,
            required: true,
        },
        product: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:modelValue', 'submit'],
    setup(props, { emit }) {
        const formRef = ref(null)
        const valid = ref(false)
        const quantityInput = ref(1)
        const changeType = ref('add')

        const rules = {
            required: (v) => v !== null && v !== '' && v !== undefined || 'This field is required',
            positive: (v) => v > 0 || 'Must be greater than 0',
        }

        const availableStock = computed(() => {
            return (props.product?.stock?.quantity || 0) - (props.product?.stock?.reserved || 0)
        })

        const actualChange = computed(() => {
            const qty = Math.abs(quantityInput.value || 0)
            return changeType.value === 'add' ? qty : -qty
        })

        const newStockPreview = computed(() => {
            if (!quantityInput.value || quantityInput.value === 0) return null
            return (props.product?.stock?.quantity || 0) + actualChange.value
        })

        watch(() => props.modelValue, (isOpen) => {
            if (isOpen) {
                quantityInput.value = 1
                changeType.value = 'add'
            }
        })

        const handleSubmit = async () => {
            const { valid: isValid } = await formRef.value.validate()
            if (isValid && newStockPreview.value >= 0) {
                emit('submit', {
                    productId: props.product.id,
                    quantityChange: actualChange.value,
                })
            }
        }

        const handleCancel = () => {
            emit('update:modelValue', false)
            quantityInput.value = 1
            changeType.value = 'add'
        }

        return {
            formRef,
            valid,
            quantityInput,
            changeType,
            rules,
            availableStock,
            newStockPreview,
            handleSubmit,
            handleCancel,
        }
    },
}
</script>