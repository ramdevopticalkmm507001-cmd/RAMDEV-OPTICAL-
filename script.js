let products = [];

let cart = JSON.parse(localStorage.getItem("ramdevCartV3") || "[]");

const money = n => "₹" + Number(n).toLocaleString("en-IN");

function save(){
  localStorage.setItem("ramdevCartV3", JSON.stringify(cart));
  renderCart();
  count();
}

function count(){
  document.getElementById("cartCount").textContent =
    cart.reduce((a,x) => a + x.qty, 0);
}

function render(list = products){
  document.getElementById("grid").innerHTML = list.map(p => `
    <article class="card">
      <div class="pic">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`
          : (p.category === "Sunglasses" ? "😎" : "👓")
        }
      </div>

      <div class="body">
        <h3>${p.name}</h3>
        <div class="muted">${p.category}</div>
        <div class="price">${money(p.price)}</div>

        <a class="btn" href="product.html?id=${p.id}">
          Choose lenses
        </a>
      </div>
    </article>
  `).join("");
}

function renderCart(){
  let b = document.getElementById("cartItems");

  if(!cart.length){
    b.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("cartTotal").textContent = "₹0";
    return;
  }

  b.innerHTML = cart.map((x,i) => `
    <div class="cartrow">
      <div class="cartinfo">
        <b>${x.frame}</b>
        <div class="muted">${x.lens}</div>
        <div class="muted">
          ${x.prescription ? "Prescription added" : ""}
        </div>
      </div>

      <div class="qty">
        <button onclick="qty(${i},-1)">−</button>
        ${x.qty}
        <button onclick="qty(${i},1)">+</button>
      </div>

      <b>${money(x.total * x.qty)}</b>
    </div>
  `).join("");

  document.getElementById("cartTotal").textContent =
    money(cart.reduce((a,x) => a + x.total * x.qty, 0));
}

function qty(i,d){
  cart[i].qty += d;

  if(cart[i].qty < 1){
    cart.splice(i,1);
  }

  save();
}

async function loadProducts(){

  try{

    const response = await fetch("/api/products");

    if(!response.ok){
      throw new Error("Products API failed");
    }

    products = await response.json();

    render(products);

  }catch(error){

    console.error("Product loading error:", error);

    document.getElementById("grid").innerHTML = `
      <p style="color:#dc2626">
        Products could not be loaded. Please try again.
      </p>
    `;
  }
}

document.getElementById("search").oninput = e => {

  let q = e.target.value.toLowerCase();

  render(
    products.filter(p =>
      (p.name + " " + p.category)
        .toLowerCase()
        .includes(q)
    )
  );

};

document.getElementById("checkout").onclick = () => {

  alert(
    cart.length
      ? "Checkout will be added next. Your configured order is saved."
      : "Your cart is empty."
  );

};

renderCart();
count();
loadProducts();
