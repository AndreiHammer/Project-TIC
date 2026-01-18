const db = require('../db');

const productsCollection = db.collection('products');

const getAllProductsFromDb = async (offset = 0, limit = 12, filters = {}) => {
    try {
        const { minPrice, maxPrice, search, sortBy, sortOrder } = filters;

        let query = productsCollection;

        const snapshot = await query.get();

        let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        if (minPrice > 0 || maxPrice < Infinity) {
            products = products.filter(p => {
                const price = p.price?.value || 0;
                return price >= minPrice && price <= maxPrice;
            });
        }

        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p => {
                const nameMatch = p.name?.toLowerCase().includes(searchLower);
                const descMatch = p.description?.toLowerCase().includes(searchLower);
                return nameMatch || descMatch;
            });
        }

        products.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'price':
                    aValue = a.price?.value || 0;
                    bValue = b.price?.value || 0;
                    break;
                case 'name':
                    aValue = a.name?.toLowerCase() || '';
                    bValue = b.name?.toLowerCase() || '';
                    break;
                case 'rating':
                    aValue = a.rating?.avg || 0;
                    bValue = b.rating?.avg || 0;
                    break;
                case 'createdAt':
                default:
                    aValue = a.metadata?.createdAt || '';
                    bValue = b.metadata?.createdAt || '';
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        const totalProducts = products.length;

        const endIndex = offset + limit;
        const paginatedProducts = products.slice(offset, endIndex);

        return {
            products: paginatedProducts,
            totalProducts
        };
    } catch (error) {
        throw error;
    }
};

const getProductByIdFromDb = async (productId) => {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
        return null;
    }
    return {
        id: productDoc.id,
        ...productDoc.data()
    };
};

const createProductInDb = async (productData) => {
    const docRef = await productsCollection.add(productData);
    return docRef;
};

const updateProductInDb = async (productId, productData) => {
    const productRef = productsCollection.doc(productId);
    await productRef.update(productData);
    return productRef;
};

const deleteProductInDb = async (productId) => {
    const productRef = productsCollection.doc(productId);
    await productRef.delete();
    return;
};

const updateProductStockInDb = async (productId, quantityChange, reservedChange = 0) => {
    const productRef = productsCollection.doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
        throw new Error('Product not found');
    }

    const currentProduct = productDoc.data();
    const currentQuantity = currentProduct.stock?.quantity || 0;
    const currentReserved = currentProduct.stock?.reserved || 0;

    const newQuantity = Math.max(0, currentQuantity + quantityChange);
    const newReserved = Math.max(0, currentReserved + reservedChange);

    const finalReserved = Math.min(newReserved, newQuantity);

    await productRef.update({
        'stock.quantity': newQuantity,
        'stock.reserved': finalReserved,
        'metadata.updatedAt': new Date().toISOString()
    });

    return {
        id: productDoc.id,
        stock: {
            quantity: newQuantity,
            reserved: finalReserved
        }
    };
};

module.exports = {
    getAllProductsFromDb,
    getProductByIdFromDb,
    createProductInDb,
    updateProductInDb,
    deleteProductInDb,
    updateProductStockInDb
};