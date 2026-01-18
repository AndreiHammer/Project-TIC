<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800"
        persistent>
        <v-card>
            <v-card-title class="bg-primary text-white pa-4">
                <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
                {{ isEditMode ? 'Edit Product' : 'Add New Product' }}
            </v-card-title>

            <v-card-text class="pa-6">
                <v-form ref="formRef" v-model="valid">
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="formData.name" label="Product Name" variant="outlined"
                                :rules="[rules.required]" prepend-inner-icon="mdi-tag"></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="formData.description" label="Description" variant="outlined"
                                :rules="[rules.required]" rows="4" prepend-inner-icon="mdi-text"></v-textarea>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model.number="formData.price.base" label="Base Price (€)" variant="outlined"
                                type="number" :rules="[rules.required, rules.positive]"
                                prepend-inner-icon="mdi-currency-eur"></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model.number="formData.price.discountPercent" label="Discount (%)"
                                variant="outlined" type="number" :rules="[rules.percentage]"
                                prepend-inner-icon="mdi-percent"></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model.number="formData.stock.quantity" label="Stock Quantity"
                                variant="outlined" type="number" :rules="[rules.required, rules.nonNegative]"
                                prepend-inner-icon="mdi-package-variant"></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="formData.category.name" label="Category" variant="outlined"
                                prepend-inner-icon="mdi-shape"></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="formData.attributes.brand" label="Brand" variant="outlined"
                                prepend-inner-icon="mdi-domain"></v-text-field>
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="formData.attributes.material" label="Material" variant="outlined"
                                prepend-inner-icon="mdi-material-design"></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-combobox v-model="formData.attributes.colors" label="Colors" variant="outlined" chips
                                closable-chips multiple prepend-inner-icon="mdi-palette"
                                hint="Press Enter to add colors"></v-combobox>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field v-model="newImageUrl" label="Image URL" variant="outlined"
                                prepend-inner-icon="mdi-image" append-icon="mdi-plus" @click:append="addImage"
                                @keyup.enter="addImage" hint="Add product image URLs"></v-text-field>
                        </v-col>

                        <v-col cols="12" v-if="formData.images.length > 0">
                            <v-chip v-for="(image, index) in formData.images" :key="index" closable
                                @click:close="removeImage(index)" class="mr-2 mb-2">
                                <v-icon icon="mdi-image" start></v-icon>
                                Image {{ index + 1 }} {{ image.isPrimary ? '(Primary)' : '' }}
                            </v-chip>
                        </v-col>

                        <v-col cols="12">
                            <v-divider class="my-2"></v-divider>
                            <h4 class="mb-3">Product Flags</h4>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-switch v-model="formData.flags.featured" label="Featured" color="warning"
                                hide-details></v-switch>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-switch v-model="formData.flags.onSale" label="On Sale" color="error"
                                hide-details></v-switch>
                        </v-col>

                        <v-col cols="12" md="4">
                            <v-switch v-model="formData.flags.newArrival" label="New Arrival" color="success"
                                hide-details></v-switch>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn color="grey" variant="outlined" @click="handleCancel" :disabled="loading">
                    Cancel
                </v-btn>
                <v-btn color="primary" variant="elevated" @click="handleSubmit" :loading="loading" :disabled="!valid">
                    {{ isEditMode ? 'Update Product' : 'Create Product' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'

export default {
    name: 'ProductForm',
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
        const newImageUrl = ref('')

        const isEditMode = computed(() => !!props.product)

        const defaultFormData = () => ({
            name: '',
            description: '',
            price: {
                base: 0,
                discountPercent: 0,
                value: 0,
            },
            stock: {
                quantity: 0,
                reserved: 0,
            },
            category: {
                id: '',
                name: '',
            },
            attributes: {
                brand: '',
                material: '',
                colors: [],
            },
            images: [],
            flags: {
                featured: false,
                onSale: false,
                newArrival: false,
            },
            rating: {
                avg: 0,
                count: 0,
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        })

        const formData = reactive(defaultFormData())

        const rules = {
            required: (v) => !!v || v === 0 || 'This field is required',
            positive: (v) => v > 0 || 'Must be greater than 0',
            nonNegative: (v) => v >= 0 || 'Must be 0 or greater',
            percentage: (v) => (v >= 0 && v <= 100) || 'Must be between 0 and 100',
        }

        watch(() => props.product, (newProduct) => {
            if (newProduct) {
                Object.assign(formData, {
                    ...defaultFormData(),
                    ...newProduct,
                    price: { ...defaultFormData().price, ...newProduct.price },
                    stock: { ...defaultFormData().stock, ...newProduct.stock },
                    category: { ...defaultFormData().category, ...newProduct.category },
                    attributes: { ...defaultFormData().attributes, ...newProduct.attributes },
                    flags: { ...defaultFormData().flags, ...newProduct.flags },
                    rating: { ...defaultFormData().rating, ...newProduct.rating },
                })
            } else {
                Object.assign(formData, defaultFormData())
            }
        }, { immediate: true })

        watch(() => [formData.price.base, formData.price.discountPercent], () => {
            if (formData.price.discountPercent > 0) {
                formData.price.value = formData.price.base * (1 - formData.price.discountPercent / 100)
            } else {
                formData.price.value = formData.price.base
            }
        })

        const addImage = () => {
            if (newImageUrl.value.trim()) {
                formData.images.push({
                    url: newImageUrl.value.trim(),
                    alt: formData.name || 'Product image',
                    isPrimary: formData.images.length === 0,
                })
                newImageUrl.value = ''
            }
        }

        const removeImage = (index) => {
            const wasPrimary = formData.images[index].isPrimary
            formData.images.splice(index, 1)
            if (wasPrimary && formData.images.length > 0) {
                formData.images[0].isPrimary = true
            }
        }

        const handleSubmit = async () => {
            const { valid: isValid } = await formRef.value.validate()
            if (isValid) {
                const submitData = {
                    ...formData,
                    metadata: {
                        ...formData.metadata,
                        updatedAt: new Date().toISOString(),
                    },
                }
                emit('submit', submitData)
            }
        }

        const handleCancel = () => {
            emit('update:modelValue', false)
            formRef.value?.reset()
        }

        return {
            formRef,
            valid,
            formData,
            rules,
            isEditMode,
            newImageUrl,
            addImage,
            removeImage,
            handleSubmit,
            handleCancel,
        }
    },
}
</script>