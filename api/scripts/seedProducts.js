const { faker } = require('@faker-js/faker');
const db = require('../db');

const productsCollection = db.collection('products');

async function generateProducts(count = 50) {
    const products = [];

    for (let i = 0; i < count; i++) {
        const basePrice = Number(faker.commerce.price({ min: 20, max: 800 }));
        const onSale = faker.datatype.boolean({ probability: 0.3 });
        const discountPercent = onSale
            ? faker.number.int({ min: 10, max: 40 })
            : 0;

        const finalPrice = basePrice * (1 - discountPercent / 100);

        const product = {
            name: faker.commerce.productName(),
            slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),

            description: (() => {
                let desc = faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 }));
                if (desc.length < 10) {
                    desc = faker.lorem.sentences({ min: 3, max: 5 });
                }
                return desc.substring(0, 1000);
            })(),

            price: {
                value: Number(finalPrice.toFixed(2)),
                currency: 'EUR',
                base: basePrice,
                discountPercent
            },

            stock: {
                quantity: faker.number.int({ min: 0, max: 300 }),
                reserved: faker.number.int({ min: 0, max: 20 })
            },

            category: {
                name: faker.commerce.department(),
                slug: faker.helpers
                    .slugify(faker.commerce.department())
                    .toLowerCase()
            },

            attributes: {
                brand: faker.company.name(),
                sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
                colors: faker.helpers.arrayElements(
                    ['black', 'white', 'blue', 'red', 'green'],
                    faker.number.int({ min: 1, max: 3 })
                ),
                material: faker.commerce.productMaterial()
            },

            images: faker.helpers.arrayElements(
                Array.from({ length: 5 }, () => faker.image.url({ width: 800, height: 800 })),
                faker.number.int({ min: 1, max: 3 })
            ).map((url, idx) => ({
                url,
                isPrimary: idx === 0
            })),

            flags: {
                active: faker.datatype.boolean({ probability: 0.9 }),
                featured: faker.datatype.boolean({ probability: 0.15 }),
                onSale
            },

            rating: faker.datatype.boolean({ probability: 0.7 })
                ? {
                      avg: Number(
                          faker.number.float({ min: 3, max: 5, fractionDigits: 1 }).toFixed(1)
                      ),
                      count: faker.number.int({ min: 1, max: 300 })
                  }
                : null,

            metadata: {
                createdAt: faker.date.past({ years: 1 }).toISOString(),
                updatedAt: faker.date.recent({ days: 30 }).toISOString()
            }
        };

        products.push(product);
    }

    return products;
}


async function seedProducts(total = 50) {
    const products = await generateProducts(total);

    for (const product of products) {
        await productsCollection.add(product);
    }

    console.log(`Seeded ${products.length} products`);
}

const total = Number(process.argv[2]) || 50;

seedProducts(total).catch(err => {
    console.error('Seeding failed:', err);
});

