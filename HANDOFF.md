# E-commerce Project Handoff

## 1. Project purpose

This is a full-stack e-commerce application. Customers can register, authenticate, browse products, manage a shopping cart, place orders, and review or cancel their own orders. Administrators can manage products, inventory, and order status, and can view all customer orders.

The API behavior documented here was verified against the source code and the Postman collection `project TIC.postman_collection.json`.

## 2. Technology and architecture

- Frontend: Vue 3, Vue Router, Vuex, Vuetify, Axios
- Backend: Node.js, Express 5
- Database: Firebase Admin SDK with Cloud Firestore
- Authentication: JWT tokens and bcrypt password hashing
- Validation: express-validator
- Security middleware: Helmet, CORS, and rate limiting
- Backend entry point: `api/app.js`
- Frontend entry point: `client/`

The backend is organized into:

- `api/routes`: HTTP route definitions and middleware
- `api/controllers`: request handling and business workflows
- `api/models`: Firestore access and data operations
- `api/validators`: request validation rules
- `api/utils/jwtUtils.js`: password and token utilities

## 3. User roles

### Customer

Customers can:

- Register and log in
- Browse products
- View and modify their cart
- Create orders
- View their order history
- View their own order details
- Cancel eligible orders

### Administrator

Administrators can do everything a customer can do, plus:

- Create, edit, and delete products
- Update product stock
- View all customer orders
- Update order status through the delivery workflow
- View and manage administrative information

Admin access is checked by loading the user from Firestore and verifying `admin: true`.

## 4. Main business workflows

### Registration and authentication

1. A customer registers with a username, email, password, and confirmation password.
2. The backend validates the input and hashes the password.
3. A JWT is returned after successful registration or login.
4. Protected requests send the token using:

```http
Authorization: Bearer <jwt-token>
```

Admin registration additionally requires `ADMIN_SECRET_KEY` and can receive the secret in the request body or `x-admin-secret` header.

### Product browsing

Products can be retrieved publicly. The list endpoint supports:

- Offset and limit pagination
- Minimum and maximum price
- Text search against name and description
- Sorting by price, name, rating, or creation date
- Ascending or descending order

### Cart and inventory

Each customer has a cart identified by their user ID. Cart items store a product snapshot, quantity, price, product name, and image. Cart totals include subtotal, item count, and total.

The available quantity is calculated as:

```text
available stock = stock.quantity - stock.reserved
```

The cart rejects additions or updates that exceed available stock.

### Order creation

When a customer creates an order:

1. Product IDs and quantities are validated.
2. Product existence, active status, and available stock are checked.
3. Reserved stock is increased.
4. Product prices are copied into the order items.
5. The total is calculated server-side.
6. The order starts with status `pending`.
7. The customer cart is cleared.

### Order status lifecycle

The supported status flow is:

```text
pending -> confirmed -> processing -> shipped -> delivered
```

Orders may be cancelled from eligible states. Stock and payment status are updated when an order is cancelled or moves into fulfillment.

## 5. API reference

The Postman collection uses `{{baseUrl}}`. For local development, use:

```text
http://localhost:8080
```

### Users

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/users/register` | Public | Register a customer |
| POST | `/api/users/register-admin` | Admin secret | Register an administrator |
| POST | `/api/users/login` | Public | Authenticate and receive a JWT |
| GET | `/api/users/count` | Admin JWT | Count non-admin users |

Registration requires a valid email, a password from 8–64 characters containing lowercase, uppercase, number, and special character, a valid username, and matching confirmation password.

### Products

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | List, filter, sort, and paginate products |
| GET | `/api/products/:id` | Public | Get one product |
| POST | `/api/products` | Admin JWT | Create a product |
| PUT | `/api/products/:id` | Admin JWT | Replace/update product data |
| DELETE | `/api/products/:id` | Admin JWT | Delete a product |
| PATCH | `/api/products/:id/stock` | Authenticated JWT in current code | Change quantity/reserved stock |

Product creation and update validate name, description, price, currency, and stock fields.

Useful list query parameters include:

```text
offset, limit, minPrice, maxPrice, search, sortBy, sortOrder
```

### Cart

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/cart` | JWT | Get the current user cart |
| POST | `/api/cart` | JWT | Add a product; body contains `productId` and `quantity` |
| PUT | `/api/cart/:productId` | JWT | Set an item quantity |
| DELETE | `/api/cart/:productId` | JWT | Remove one product |
| DELETE | `/api/cart` | JWT | Clear the cart |

### Orders

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | JWT | Create an order |
| GET | `/api/orders` | JWT | Get the current user’s orders, or all orders for an admin |
| GET | `/api/orders/:id` | JWT | Get an order if owned by the user or if the requester is an admin |
| POST | `/api/orders/:id/cancel` | JWT | Cancel an eligible order |
| PATCH | `/api/orders/:id/status` | Admin JWT | Move an order through the status lifecycle |

An order request contains `items`, `shipping`, and `payment`. The current validator accepts payment methods `card` and `cash_on_delivery`.

Example shape:

```json
{
  "items": [{ "productId": "product-id", "quantity": 2 }],
  "shipping": {
    "name": "Customer Name",
    "address": "Example Address 10",
    "city": "Bucharest",
    "postalCode": "100000",
    "country": "Romania",
    "phone": "0700000000"
  },
  "payment": {
    "method": "card",
    "status": "pending"
  }
}
```

## 6. Running the project

Install backend dependencies:

```powershell
cd api
npm install
```

Install frontend dependencies in a second terminal:

```powershell
cd client
npm install
```

Run the backend:

```powershell
cd api
npm run dev
```

Run the frontend:

```powershell
cd client
npm run serve
```

The API runs on `http://localhost:8080` by default. The Vue development server normally runs on `http://localhost:8081`.

Required local configuration:

- `api/.env`: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `ADMIN_SECRET_KEY`, and valid Google/Firebase credentials
- `client/.env`: `VUE_APP_API_URL`, normally `http://localhost:8080/api`

The Firestore credential file must not be committed. Use `GOOGLE_APPLICATION_CREDENTIALS` or another supported Firebase Admin credential configuration.

## 7. Testing

The backend uses Node’s built-in test runner. Tests use an in-memory Firestore fake for model tests, so they do not modify the real database.

Run all backend tests:

```powershell
cd api
npm test
```

Run model tests only:

```powershell
cd api
node --test test/models.test.js
```

The current suite covers API smoke behavior, JWT utilities, validators, and Cart, Product, Order, and User models.

## 8. Postman collection notes

The collection is useful for demonstrating the main user, product, cart, and order workflows, but it needs cleanup before being used as a shared team artifact:

- It contains hard-coded passwords, admin secrets, and bearer tokens. Rotate any credentials that were real and replace them with Postman variables.
- Several bearer tokens are historical and may be expired.
- Product, cart, and order IDs are hard-coded examples and may not exist in a new database.
- The collection’s order example uses `credit_card`, but the current backend validator accepts `card` or `cash_on_delivery`. Use `card` unless the product decision is to expand the validator.
- The collection labels stock updates as admin operations, but the current route requires authentication and does not currently call `requireAdmin`. Confirm whether this is intended before release.
- The delete-cart example includes a quantity body, but the backend ignores it because clearing the cart does not require a body.
- The collection has no visible `baseUrl` variable; add an environment variable such as `http://localhost:8080`.

## 9. Suggested Agile project breakdown

### Epic A — Identity and access

- Customer registration and login
- Admin registration protection
- JWT session handling
- Role-based authorization

### Epic B — Product catalog

- Product listing and search
- Product detail view
- Admin product CRUD
- Inventory and stock reservation

### Epic C — Shopping cart

- Add products to cart
- Update and remove cart items
- Cart totals
- Available-stock validation

### Epic D — Checkout and orders

- Shipping and payment form
- Order creation
- Stock reservation and finalization
- Customer order history
- Order cancellation

### Epic E — Administration and quality

- Admin order dashboard
- Status transition controls
- Postman collection cleanup
- Automated tests and deployment documentation

## 10. Suggested first sprint

1. Make local setup reproducible and document Firebase credentials safely.
2. Replace Postman secrets with environment variables.
3. Verify registration/login and product browsing end-to-end.
4. Fix the payment-method mismatch in the collection or validator.
5. Decide whether stock updates must be admin-only and add the required middleware if so.
6. Demonstrate the customer path: login → browse → add to cart → checkout → view order.
7. Demonstrate the admin path: login → manage product → view orders → update status.

## 11. Definition of Done for a feature

A feature is ready when:

- The user story and acceptance criteria are clear.
- Input validation and authorization are implemented.
- Success and failure cases are tested.
- The endpoint is documented in Postman without real secrets.
- The frontend workflow handles loading and error states.
- The backend test suite passes.
- The change is reviewed and can be demonstrated locally.

