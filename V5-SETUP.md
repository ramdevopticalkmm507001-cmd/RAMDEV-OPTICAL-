# Ramdev Opticals V5

V5 adds a real Node.js + SQLite backend scaffold and an admin panel.

## Structure
- Existing V4 customer website
- `backend/` API + SQLite database
- `admin/` order/product dashboard

## Next production steps
1. Deploy backend/database.
2. Add secure admin authentication.
3. Connect checkout to POST /api/orders.
4. Configure a payment provider such as Razorpay with server-side secrets.
5. Configure production WhatsApp Business/API if automated messaging is required.
6. Add HTTPS, backups, logging, validation and rate limiting.

The WhatsApp number in the customer checkout remains 8008564974.
