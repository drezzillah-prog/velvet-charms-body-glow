/* -------------------------------------------------------
   UNIVERSAL SCRIPT FOR BOTH WEBSITES (ART + BODY & GLOW)
   100% crash-proof, supports nested categories and folders
---------------------------------------------------------*/

function safe(text) {
  return String(text || "").replace(/[&<>"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"
  }[c]));
}

function getQuery(name) {
  return new URLSearchParams(location.search).get(name);
}

/* -------------------------------------------------------
   LOAD CATALOGUE.JSON
---------------------------------------------------------*/
function loadCatalogue() {
  const grid = document.getElementById("catalogue-root");
  if (!grid) return;

  fetch("catalogue.json")
    .then(r => r.json())
    .then(data => {
      let html = "";

      data.categories.forEach(cat => {
        html += `<section class="cat-block">
            <h2>${safe(cat.name)}</h2>`;

        // SUBCATEGORIES
        if (cat.subcategories) {
          cat.subcategories.forEach(sub => {
            html += `<h3>${safe(sub.name)}</h3><div class="product-grid">`;
            (sub.products || []).forEach(p => {
              html += productCard(p);
            });
            html += `</div>`;
          });
        }

        // PRODUCTS (no subcategories)
        if (cat.products) {
          html += `<div class="product-grid">`;
          cat.products.forEach(p => {
            html += productCard(p);
          });
          html += `</div>`;
        }

        html += `</section>`;
      });

      grid.innerHTML = html;
    })
    .catch(err => {
      console.error("Catalogue error:", err);
      grid.innerHTML = `<p class="error">Failed to load catalogue.</p>`;
    });
}

/* -------------------------------------------------------
   PRODUCT CARD FOR CATALOGUE
---------------------------------------------------------*/
function productCard(p) {
  const img = p.images?.[0] || "";
  return `
    <div class="product-card" onclick="location.href='product.html?id=${safe(p.id)}'">
      <img src="${img}" onerror="this.style.display='none'">
      <h4>${safe(p.name)}</h4>
      <p class="price">${p.price ? p.price + " USD" : ""}</p>
    </div>`;
}

/* -------------------------------------------------------
   FIND PRODUCT BY ID (supports nested subcategories)
---------------------------------------------------------*/
function findProduct(data, id) {
  for (const cat of data.categories) {
    // products directly inside category
    if (cat.products) {
      for (const p of cat.products) {
        if (p.id === id) return p;
      }
    }
    // products inside subcategories
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        for (const p of (sub.products || [])) {
          if (p.id === id) return p;
        }
      }
    }
  }
  return null;
}

/* -------------------------------------------------------
   LOAD PRODUCT.HTML
---------------------------------------------------------*/
function loadProductPage() {
  const root = document.getElementById("product-root");
  if (!root) return;

  fetch("catalogue.json")
    .then(r => r.json())
    .then(data => {
      const id = getQuery("id");
      const p = findProduct(data, id);

      if (!p) {
        root.innerHTML = `<p class="error">Product not found.</p>`;
        return;
      }

      let html = `<div class="product-detail">
        <h2>${safe(p.name)}</h2>
        <div class="gallery">`;

      (p.images || []).forEach(img => {
        html += `<img src="${img}" onerror="this.style.display='none'">`;
      });

      html += `</div>
        <div class="prod-meta">
          <p class="price">${p.price ? p.price + " USD" : ""}</p>
          <p>${safe(p.description || "")}</p>`;

      if (p.paymentLink) {
        html += `<p><a class="btn buy" 
                 href="${p.paymentLink}" 
                 target="_blank" rel="noopener">
                 Buy with PayPal</a></p>`;
      }

      html += `</div></div>`;
      root.innerHTML = html;
    })
    .catch(err => {
      console.error("Product load error:", err);
      root.innerHTML = `<p class="error">Failed to load product.</p>`;
    });
}

/* -------------------------------------------------------
   RUN ON PAGE LOAD
---------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  loadCatalogue();
  loadProductPage();
});
