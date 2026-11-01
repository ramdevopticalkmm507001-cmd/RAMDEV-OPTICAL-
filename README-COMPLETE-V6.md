# Ramdev Opticals Complete V6

This is the consolidated build requested as one complete package.

Customer side:
- Home + eyewear catalog
- Search
- Frame configuration
- Lens families/products/prices from the supplied Eyeconic catalog data
- Prescription fields
- Cart
- Checkout
- PhonePe/UPI-only payment
- COD removed
- WhatsApp order flow to 8008564974

Business side:
- Node/Express backend
- SQLite order database
- Admin login via ADMIN_TOKEN
- Order status management
- Manual payment confirmation
- Product management

Payment:
- UPI ID: rajeshrajpurohith@ybl
- UPI deep link is supported where the customer's phone/browser permits it.
- Automatic PhonePe payment verification is not included because it requires the business's PhonePe merchant integration credentials.

Before public launch:
- Set a strong ADMIN_TOKEN
- Deploy backend with HTTPS
- Configure backups and monitoring
- Add official PhonePe merchant API verification if automatic payment confirmation is required
- Test orders/payment/WhatsApp on the actual production domain
