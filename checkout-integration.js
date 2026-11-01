/*
V5.1 checkout integration contract:

POST /api/orders
{
  "customer_name": "Customer",
  "mobile": "9876543210",
  "address": "Full address",
  "note": "",
  "items": [...cart items...],
  "total": 1999
}

The response returns { id, message }.
The customer-facing checkout should call this endpoint before opening WhatsApp.
Payment gateway integration is intentionally not hard-coded without merchant credentials.
*/