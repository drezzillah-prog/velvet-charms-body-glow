/* script.js - Velvet Charms Body Glow (single-page app) */
"use strict";

const CATALOG_URL = "catalogue.json"; // should be at repo root

let CATALOG = null;
let cart = JSON.parse(localStorage.getItem("vc_cart") || "[]");

/* Helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Routing */
function showPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if(page) page.classList.add("active");
  // highlight nav
  $$("a.nav-link").forEach(a => a.classList.toggle("active", a.dataset.route === id));
}

/* Load catalogue.json and render */
async function loadCatalogue(){
  try {
    const res = await fetch(CATALOG_URL + "?v=" + Date.now());
    if(!res.ok) throw new Error("catalogue.json not found");
    CATALOG = await res.json();
    renderCategories();
    renderProducts();
    renderFeatured();
    populateSubcategories();
  } catch (e) {
    console.error("Failed to load catalogue:", e);
    document.getElementById("products-grid").innerHTML = "<div class='card'>Catalogue file missing. Upload catalogue.json to the site root.</div>";
  }
}

/* Render categories (only categories that exist in catalogue) */
function renderCategories(){
  const catList = $("#category-list");
  catList.innerHTML = "";
  if(!CATALOG) return;
  // map categories by id and only show those present in products
  const present = new Set(CATALOG.products.map(p => p.category));
  CATALOG.categories.forEach(cat => {
    if(present.has(cat.id)){
      const li = document.createElement("li");
      li.innerHTML = `<button class="btn small ghost cat-btn" data-cat="${cat.id}">${cat.name}</button>`;
      catList.appendChild(li);
    }
  });
  // click
  $$(".cat-btn").forEach(b => b.addEventListener("click", e => {
    const id = e.currentTarget.dataset.cat;
    filterByCategory(id);
  }));
}

/* Subcategory dropdown */
function populateSubcategories(){
  const sel = $("#subcategory-filter");
  sel.innerHTML = "<option value=''>All subcategories</option>";
  const present = new Set(CATALOG.products.map(p => p.subcategory || ""));
  CATALOG.subcategories.forEach(sc => {
    if(present.has(sc.id)){
      const opt = document.createElement("option");
      opt.value = sc.id;
      opt.textContent = sc.name;
      sel.appendChild(opt);
    }
  });
  sel.addEventListener("change", () => renderProducts());
}

/* Render product grid with optional filters */
function renderProducts(filter = {}){
  const grid = $("#products-grid");
  grid.innerHTML = "";
  if(!CATALOG) return;
  const q = $("#search").value.trim().toLowerCase();
  const selectedSub = $("#subcategory-filter").value;

  const list = CATALOG.products.filter(p => {
    // only body-glow categories for this site: candles, soaps, bodycare, perfumes, hair, bundles
    const allowed = ["candles","soaps","bodycare","perfumes","hair","bundles"];
    if(!allowed.includes(p.category)) return false;
    if(filter.category && p.category !== filter.category) return false;
    if(selectedSub && p.subcategory !== selectedSub) return false;
    if(q){
      const hay = (p.name + " " + (p.description || "")).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });

  if(list.length === 0){
    grid.innerHTML = `<div class="card"><p>No products found.</p></div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card product-card";
    const img = document.createElement("img");
    img.alt = p.name;
    img.src = p.images && p.images.length ? p.images[0] : "top banner picture for candles.png";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = p.name;
    const desc = document.createElement("div");
    desc.className = "tiny";
    desc.textContent = p.description || "";
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `${p.price} ${p.currency || "USD"}`;
    const footer = document.createElement("div");
    footer.className = "card-footer";

    const view = document.createElement("button");
    view.className = "btn small";
    view.textContent = "View";
    view.addEventListener("click", () => openProductModal(p.id));

    const quickBuy = document.createElement("button");
    quickBuy.className = "btn small gold";
    quickBuy.textContent = "Buy";
    quickBuy.addEventListener("click", () => {
      // open PayPal link directly (prompt user to add customization in notes)
      window.open(p.paypalLink, "_blank");
      alert("When completing the PayPal checkout, please paste any customization note into PayPal's 'note to seller' field.");
    });

    footer.appendChild(view);
    footer.appendChild(quickBuy);

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(price);
    card.appendChild(footer);
    grid.appendChild(card);
  });
}

/* render featured (first 4 products of allowed categories) */
function renderFeatured(){
  const cont = $("#featured-grid");
  cont.innerHTML = "";
  if(!CATALOG) return;
  const allowed = ["candles","soaps","bodycare","perfumes","hair","bundles"];
  const featured = CATALOG.products.filter(p => allowed.includes(p.category)).slice(0,4);
  featured.forEach(p => {
    const el = document.createElement("div");
    el.className = "card product-card";
    el.innerHTML = `
      <img src="${p.images && p.images.length ? p.images[0] : "top banner picture for candles.png"}" alt="${p.name}" />
      <div class="name">${p.name}</div>
      <div class="tiny">${p.description ? p.description.slice(0,70) + "…" : ""}</div>
      <div class="price">${p.price} ${p.currency || "USD"}</div>
      <div style="margin-top:8px"><button class="btn small" data-id="${p.id}">View</button></div>
    `;
    cont.appendChild(el);
  });
  $$("#featured-grid .btn").forEach(b => b.addEventListener("click", e => openProductModal(e.currentTarget.dataset.id)));
}

/* filters */
function filterByCategory(catId){
  $("#catalogue-title").textContent = CATALOG.categories.find(c=>c.id===catId)?.name || "Products";
  renderProducts({category:catId});
}

/* product modal */
function openProductModal(id){
  const product = CATALOG.products.find(p => p.id === id);
  if(!product) return alert("Product not found");
  const modal = $("#product-modal");
  $("#modal-title").textContent = product.name;
  $("#modal-desc").textContent = product.description || "";
  $("#modal-price").textContent = `${product.price} ${product.currency || "USD"}`;

  // gallery
  const gallery = $("#modal-gallery");
  gallery.innerHTML = "";
  (product.images && product.images.length ? product.images : ["top banner picture for candles.png"]).forEach(src=>{
    const img = document.createElement("img");
    img.src = src;
    gallery.appendChild(img);
  });

  // actions
  $("#add-to-cart").onclick = () => {
    const note = $("#modal-note").value.trim();
    cart.push({id: product.id, name: product.name, price: product.price, currency: product.currency, paypalLink: product.paypalLink, note});
    saveCart();
    updateCartUI();
    closeModal();
    alert("Added to cart. Open the cart to checkout or add more items.");
  };

  $("#buy-now").onclick = () => {
    const note = $("#modal-note").value.trim();
    // open paypal link
    window.open(product.paypalLink, "_blank");
    // suggest user copies note into PayPal
    if(note) setTimeout(()=>alert("Please paste your customization note into PayPal's 'note to seller' field when checking out."), 600);
    closeModal();
  };

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

/* modal close */
function closeModal(){
  const modal = $("#product-modal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  $("#modal-note").value = "";
}

/* cart handling */
function saveCart(){ localStorage.setItem("vc_cart", JSON.stringify(cart)); }
function updateCartUI(){
  const el = $("#cart-contents");
  if(cart.length === 0){ el.textContent = "Cart is empty"; return; }
  el.innerHTML = `${cart.length} item(s) — <span class="tiny">${cart.reduce((s,i)=>s+i.price,0)} USD</span>`;
}

/* show cart modal */
function openCartModal(){
  const modal = $("#cart-modal");
  const itemsCont = $("#cart-items");
  itemsCont.innerHTML = "";
  if(cart.length === 0){
    itemsCont.innerHTML = "<div class='tiny'>Your cart is empty.</div>";
    $("#cart-total").textContent = "";
    modal.classList.remove("hidden");
    return;
  }

  cart.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:700">${it.name}</div>
        <div class="tiny">Notes: ${it.note ? it.note : "—"}</div>
      </div>
      <div style="text-align:right">
        <div>${it.price} ${it.currency || "USD"}</div>
        <div style="margin-top:8px">
          <button class="btn small" data-idx="${idx}">Remove</button>
          <button class="btn small gold" data-checkout="${idx}">Pay</button>
        </div>
      </div>
    `;
    itemsCont.appendChild(row);
  });

  $("#cart-total").textContent = "Total: " + cart.reduce((s,i)=>s+i.price,0) + " USD";

  // remove handlers
  $$("#cart-items button[data-idx]").forEach(b => b.addEventListener("click", (e)=>{
    const i = Number(e.currentTarget.dataset.idx);
    cart.splice(i,1); saveCart(); updateCartUI(); openCartModal();
  }));

  $$("#cart-items button[data-checkout]").forEach(b => b.addEventListener("click", (e)=>{
    const i = Number(e.currentTarget.dataset.checkout);
    const item = cart[i];
    // open PayPal link and advise about notes
    window.open(item.paypalLink, "_blank");
    if(item.note) setTimeout(()=>alert("Please paste your customization note into PayPal's 'note to seller' field when checking out."), 600);
  }));

  modal.classList.remove("hidden");
}

/* checkout per-item (open all PayPal links in new tabs) */
function checkoutAll(){
  if(cart.length === 0){ alert("Cart is empty"); return; }
  cart.forEach(item => window.open(item.paypalLink, "_blank"));
  alert("PayPal tabs opened. Please add customization notes in each PayPal window if needed.");
}

/* init events */
function initUI(){
  // nav links
  $$("a.nav-link").forEach(a => a.addEventListener("click", e => {
    const route = e.currentTarget.dataset.route;
    showPage(route);
    window.scrollTo(0,0);
  }));

  // search
  $("#search").addEventListener("input", () => renderProducts());

  // modal close
  $("#modal-close").addEventListener("click", closeModal);
  $("#product-modal").addEventListener("click", (e) => {
    if(e.target === $("#product-modal")) closeModal();
  });

  // cart
  $("#view-cart").addEventListener("click", openCartModal);
  $("#cart-close").addEventListener("click", ()=> $("#cart-modal").classList.add("hidden"));
  $("#clear-cart").addEventListener("click", ()=> { cart=[]; saveCart(); updateCartUI(); alert("Cart cleared"); });

  $("#checkout-paypal").addEventListener("click", checkoutAll);

  // contact form – client-side only (no server)
  $("#contact-form").addEventListener("submit", (e)=> {
    e.preventDefault();
    alert("Message captured. We'll respond to the email you provided. (This demo site does not send email yet.)");
    $("#contact-form").reset();
  });

  // featured view buttons
  document.addEventListener("click", (e)=>{
    if(e.target.matches(".card .btn[data-id]")){
      openProductModal(e.target.dataset.id);
    }
  });

  updateCartUI();
}

/* start */
initUI();
loadCatalogue();
