const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "CHANGE_ME_BEFORE_DEPLOYMENT";
const UPI_ID = "rajeshrajpurohith@ybl";
const WHATSAPP = "918008564974";

app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));

const db = new Database(path.join(__dirname, "ramdev.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  items_json TEXT NOT NULL,
  total REAL NOT NULL,
  payment_method TEXT DEFAULT 'PHONEPE_UPI',
  payment_status TEXT DEFAULT 'pending',
  payment_order_id TEXT,
  payment_id TEXT,
  order_status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT,
  active INTEGER DEFAULT 1
);
`);

function ensureColumn(sql) { try { db.exec(sql); } catch (_) {} }
ensureColumn("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'PHONEPE_UPI'");
ensureColumn("ALTER TABLE orders ADD COLUMN payment_order_id TEXT");
ensureColumn("ALTER TABLE orders ADD COLUMN payment_id TEXT");

function requireAdmin(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!token || token!==ADMIN_TOKEN || ADMIN_TOKEN==="CHANGE_ME_BEFORE_DEPLOYMENT")
    return res.status(401).json({error:"Admin authentication required"});
  next();
}

app.get("/api/health",(req,res)=>res.json({
  ok:true, version:"6.0.0", payment:"PHONEPE_UPI", cod:false
}));

app.get("/api/config",(req,res)=>res.json({
  paymentMethod:"PHONEPE_UPI",
  upiId:UPI_ID,
  whatsapp:WHATSAPP,
  cod:false
}));

app.post("/api/orders",(req,res)=>{
  const {customer_name,mobile,address,note,items,total,payment_status,payment_order_id,payment_id}=req.body;
  if(!customer_name || !mobile || !address || !Array.isArray(items) || !items.length || total==null)
    return res.status(400).json({error:"Missing required order fields"});
  const numericTotal=Number(total);
  if(!Number.isFinite(numericTotal) || numericTotal<=0)
    return res.status(400).json({error:"Invalid order total"});

  const info=db.prepare(`
    INSERT INTO orders
    (customer_name,mobile,address,note,items_json,total,payment_method,payment_status,payment_order_id,payment_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    String(customer_name).slice(0,120),
    String(mobile).slice(0,30),
    String(address).slice(0,1000),
    String(note||"").slice(0,1000),
    JSON.stringify(items),
    numericTotal,
    "PHONEPE_UPI",
    payment_status || "pending",
    payment_order_id || null,
    payment_id || null
  );
  res.status(201).json({id:info.lastInsertRowid,payment_status:payment_status||"pending"});
});

app.post("/api/payments/create-upi",(req,res)=>{
  const amount=Number(req.body.amount);
  if(!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:"Invalid amount"});
  const paymentOrderId="RAMDEV_"+Date.now()+"_"+crypto.randomBytes(3).toString("hex");
  const upiUrl=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Ramdev Opticals")}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(paymentOrderId)}&tn=${encodeURIComponent("Ramdev Opticals order")}`;
  res.json({paymentOrderId,upiId:UPI_ID,amount,currency:"INR",upiUrl});
});

// This endpoint records a payment only when an authorized admin confirms it.
// Automatic PhonePe verification requires a PhonePe merchant API and credentials.
app.post("/api/payments/admin-confirm",requireAdmin,(req,res)=>{
  const {orderId,paymentId}=req.body;
  if(!orderId) return res.status(400).json({error:"Order ID required"});
  const info=db.prepare(`
    UPDATE orders SET payment_status='paid', payment_id=COALESCE(?,payment_id)
    WHERE id=?
  `).run(paymentId||null,orderId);
  if(!info.changes) return res.status(404).json({error:"Order not found"});
  res.json({ok:true,payment_status:"paid"});
});

app.get("/api/orders",requireAdmin,(req,res)=>{
  const rows=db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
  res.json(rows.map(r=>({...r,items:JSON.parse(r.items_json)})));
});

app.patch("/api/orders/:id/status",requireAdmin,(req,res)=>{
  const {order_status,payment_status}=req.body;
  if(order_status) db.prepare("UPDATE orders SET order_status=? WHERE id=?").run(order_status,req.params.id);
  if(payment_status) db.prepare("UPDATE orders SET payment_status=? WHERE id=?").run(payment_status,req.params.id);
  const row=db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
  if(!row) return res.status(404).json({error:"Order not found"});
  res.json(row);
});

app.get("/api/products",requireAdmin,(req,res)=>{
  res.json(db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id DESC").all());
});

app.post("/api/products",requireAdmin,(req,res)=>{
  const {name,category,price,image}=req.body;
  if(!name||!category||price==null) return res.status(400).json({error:"Missing product fields"});
  const info=db.prepare("INSERT INTO products(name,category,price,image) VALUES(?,?,?,?)")
    .run(name,category,Number(price),image||"");
  res.status(201).json({id:info.lastInsertRowid});
});

app.delete("/api/products/:id",requireAdmin,(req,res)=>{
  db.prepare("UPDATE products SET active=0 WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.listen(PORT,()=>console.log(`Ramdev Opticals V6 running on http://localhost:${PORT}`));
