document.addEventListener("DOMContentLoaded", () => {

  /* -----------------------------
     CHRISTMAS BACKGROUND
  ----------------------------- */
  document.body.style.background = `
    linear-gradient(
      rgba(0, 0, 0, 0.25),
      rgba(0, 0, 0, 0.35)
    ),
    url("./christmaselements.png")
  `;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundAttachment = "fixed";

  /* -----------------------------
     SOFT FALLING SNOWFLAKES
  ----------------------------- */
  function createSnow() {
    const snow = document.createElement("div");
    snow.classList.add("snowflake");

    snow.style.left = Math.random() * 100 + "vw";
    snow.style.animationDuration = 4 + Math.random() * 7 + "s"; 
    snow.style.opacity = Math.random() * 0.7 + 0.3;

    document.body.appendChild(snow);

    setTimeout(() => snow.remove(), 12000);
  }

  setInterval(createSnow, 250);

  /* -----------------------------
     LOAD CATALOGUE DYNAMICALLY
  ----------------------------- */
  const catalogueContainer = document.getElementById("catalogue-container");
  const productContainer = document.getElementById("product-container");

  if (catalogueContainer) {
    fetch("./catalogue.json")
      .then(res => res.json())
      .then(data => renderCatalogue(data))
      .catch(err => {
        console.error("Catalogue loading error:", err);
        catalogueContainer.innerHTML =
          "<p style='color:white;text-align:center;'>Failed to load catalogue.</p>";
      });
  }

  if (productContainer) {
    const url = new URL(window.location.href);
    const productId = url.searchParams.get("id");

    fetch("./catalogue.json")
      .then(res => res.json())
      .then(data => renderProduct(data, productId))
      .catch(err => {
        console.error("Product loading error:", err);
        productContainer.innerHTML =
          "<p style='color:white;text-align:center;'>Failed to load product.</p>";
      });
  }

});

/* -----------------------------
   RENDER CATALOGUE
----------------------------- */
function renderCatalogue(data) {
  const container = document.getElementById("catalogue-container");
  container.innerHTML = "";

  data.categories.forEach(category => {
    const categoryDiv = document.createElement("div");
    categoryDiv.classList.add("category");

    categoryDiv.innerHTML = `
      <h2>${category.name}</h2>
    `;

    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(sub => {
        const subDiv = document.createElement("div");
        subDiv.classList.add("subcategory");

        subDiv.innerHTML = `<h3>${sub.name}</h3>`;

        if (sub.products && sub.products.length > 0) {
          sub.products.forEach(prod => {
            let imgSrc = prod.images && prod.images.length > 0 ? prod.images[0] : "christmaselements.png";

            const prodDiv = document.createElement("div");
            prodDiv.classList.add("product-card");

            prodDiv.innerHTML = `
              <img src="./${imgSrc}" alt="${prod.name}">
              <h4>${prod.name}</h4>
              <p>${prod.price} USD</p>
              <a href="product.html?id=${prod.id}">See details</a>
            `;

            subDiv.appendChild(prodDiv);
          });
        } else {
          subDiv.innerHTML += `<p>No products.</p>`;
        }

        categoryDiv.appendChild(subDiv);
      });

    } else {
      categoryDiv.innerHTML += `<p>No subcategories.</p>`;
    }

    container.appendChild(categoryDiv);
  });
}

/* -----------------------------
   RENDER PRODUCT PAGE
----------------------------- */
function renderProduct(data, productId) {
  let product = null;

  data.categories.forEach(category => {
    category.subcategories.forEach(sub => {
      const found = sub.products.find(p => p.id === productId);
      if (found) product = found;
    });
  });

  const container = document.getElementById("product-container");

  if (!product) {
    container.innerHTML = "<p style='color:white;'>Product not found.</p>";
    return;
  }

  let imagesHTML = "";
  product.images.forEach(img => {
    imagesHTML += `<img src="./${img}" class="product-image">`;
  });

  container.innerHTML = `
    <h2>${product.name}</h2>
    <div class="product-gallery">${imagesHTML}</div>
    <p>${product.description}</p>
    <p class="price">${product.price} USD</p>
    <a href="${product.paymentLink}" class="buy-button">Buy Now</a>
  `;
}
