/* Shared script for catalogue and product pages.
   - expects catalogue.json in the same folder
   - catalogue page: element with id="catalogue-root"
   - product page: element with id="product-root" and ?id=PRODUCTID in URL
   - uses image fallback: first tries path from JSON, if 404 falls back to basename in root
   - includes a customization helper (builds an email)
*/

(function () {
  // Christmas background + soft snow (only add once)
  function initBackground() {
    try {
      document.body.style.background = `
        linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.35)),
        url("./christmaselements.png")
      `;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
    } catch (e) {}
  }

  function createSnow() {
    const snow = document.createElement("div");
    snow.className = "snowflake";
    snow.style.left = Math.random() * 100 + "vw";
    snow.style.top = (-10 - Math.random() * 10) + "vh";
    snow.style.width = (6 + Math.random() * 18) + "px";
    snow.style.height = snow.style.width;
    snow.style.borderRadius = "50%";
    snow.style.background = "rgba(255,255,255," + (0.12 + Math.random()*0.6) + ")";
    snow.style.animation = `snow ${4 + Math.random()*8}s linear`;
    snow.style.opacity = Math.random() * 0.8 + 0.2;
    document.body.appendChild(snow);
    setTimeout(() => snow.remove(), 14000);
  }

  // run background init immediately
  initBackground();
  setInterval(createSnow, 300);

  // ----------------------
  // Fetch catalogue.json
  // ----------------------
  function fetchCatalogue() {
    return fetch('catalogue.json').then(res => {
      if (!res.ok) throw new Error('catalogue.json fetch failed');
      return res.json();
    });
  }

  // ----------------------
  // Helpers
  // ----------------------
  function basename(path) {
    if (!path) return path;
    const parts = path.split('/');
    return parts[parts.length - 1].trim();
  }

  function makeImgWithFallback(srcFromJson, alt) {
    const img = document.createElement('img');
    img.alt = alt || '';
    img.src = srcFromJson;
    img.onerror = function () {
      const name = basename(srcFromJson);
      if (name && (img.src.indexOf(name) === -1)) {
        img.src = './' + name;
      } else {
        img.style.display = 'none';
      }
    };
    return img;
  }

  // ----------------------
  // Build catalogue grid
  // ----------------------
  function buildCatalogue(data) {
    const root = document.getElementById('catalogue-root');
    if (!root) return;
    root.innerHTML = '';

    (data.categories || []).forEach(cat => {
      const catCard = document.createElement('section');
      catCard.className = 'cat-card';

      const title = document.createElement('h3');
      title.textContent = cat.name;
      catCard.appendChild(title);

      // optional banner
      if (cat.banner) {
        const b = document.createElement('img');
        b.src = cat.banner;
        b.alt = cat.name + ' banner';
        b.style.maxWidth = '100%';
        b.style.borderRadius = '8px';
        b.onerror = function () { this.style.display = 'none'; this.remove(); };
        catCard.appendChild(b);
      }

      function renderProductsArray(products){
        const grid = document.createElement('div');
        grid.className = 'products-grid';
        (products || []).forEach(p => {
          if (!p || !p.id) return;
          const card = document.createElement('article'); card.className = 'product-card';
          const imgWrap = document.createElement('div'); imgWrap.className = 'thumb';
          if (Array.isArray(p.images) && p.images.length) {
            const img = makeImgWithFallback(p.images[0], p.name);
            imgWrap.appendChild(img);
          } else {
            const img = document.createElement('img');
            img.alt = p.name || '';
            img.style.display = 'none';
            imgWrap.appendChild(img);
          }
          card.appendChild(imgWrap);

          const h = document.createElement('h5'); h.textContent = p.name || 'Unnamed'; card.appendChild(h);
          const price = document.createElement('div'); price.className = 'price'; price.textContent = (p.price ? (p.price + ' USD') : 'Contact'); card.appendChild(price);
          const btn = document.createElement('a'); btn.className = 'btn small';
          btn.href = 'product.html?id=' + encodeURIComponent(p.id);
          btn.textContent = 'See details';
          card.appendChild(btn);

          grid.appendChild(card);
        });
        return grid;
      }

      if (cat.subcategories && cat.subcategories.length) {
        cat.subcategories.forEach(sub => {
          const subTitle = document.createElement('h4');
          subTitle.textContent = sub.name;
          catCard.appendChild(subTitle);
          catCard.appendChild(renderProductsArray(sub.products || []));
        });
      } else {
        catCard.appendChild(renderProductsArray(cat.products || []));
      }

      root.appendChild(catCard);
    });
  }

  // ----------------------
  // Find product by id
  // ----------------------
  function findProductById(data, id) {
    if (!data || !id) return null;
    for (const cat of (data.categories || [])) {
      if (cat.products) {
        for (const p of cat.products) if (p.id === id) return p;
      }
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          for (const p of (sub.products || [])) if (p.id === id) return p;
        }
      }
    }
    return null;
  }

  // ----------------------
  // Render product page (includes customization helper)
  // ----------------------
  function renderProductPage(data, productId) {
    const container = document.getElementById('product-root');
    if (!container) return;
    container.innerHTML = '';

    const product = findProductById(data, productId);
    if (!product) {
      container.innerHTML = "<p class='error' style='color:var(--muted)'>Product not found.</p>";
      return;
    }

    const title = document.createElement('h2'); title.textContent = product.name; container.appendChild(title);

    const detail = document.createElement('div'); detail.className = 'product-detail';

    const left = document.createElement('div'); left.className = 'gallery';
    if (Array.isArray(product.images) && product.images.length) {
      product.images.forEach(imgPath => {
        const img = makeImgWithFallback(imgPath, product.name);
        left.appendChild(img);
      });
    } else {
      const placeholder = document.createElement('div'); placeholder.textContent = 'No image';
      left.appendChild(placeholder);
    }

    const right = document.createElement('div'); right.className = 'prod-meta';
    const price = document.createElement('p'); price.className = 'price'; price.textContent = product.price ? (product.price + ' USD') : 'Contact for price';
    right.appendChild(price);

    // description
    const desc = document.createElement('p'); desc.className = 'desc'; desc.textContent = product.description || '';
    right.appendChild(desc);

    // options if present
    if (product.options) {
      const optWrap = document.createElement('div');
      optWrap.className = 'options';
      for (const k in product.options) {
        const vals = product.options[k];
        const label = document.createElement('div'); label.style.marginTop='8px';
        label.innerHTML = '<strong>' + k.charAt(0).toUpperCase()+k.slice(1) + ':</strong>';
        const select = document.createElement('select');
        select.name = k;
        if (Array.isArray(vals)) {
          vals.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; select.appendChild(o); });
        }
        optWrap.appendChild(label);
        optWrap.appendChild(select);
      }
      right.appendChild(optWrap);
    }

    // buy button
    if (product.paymentLink) {
      const buy = document.createElement('p');
      const a = document.createElement('a');
      a.className = 'btn buy';
      a.href = product.paymentLink;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Buy with PayPal';
      buy.appendChild(a);
      right.appendChild(buy);
    }

    // customization box (notes + one file input) - note: file won't be uploaded to server
    const customTitle = document.createElement('h4'); customTitle.textContent = 'Customization / Commission';
    right.appendChild(customTitle);
    const textarea = document.createElement('textarea'); textarea.className='custom'; textarea.placeholder='Add notes: color, size, text, reference IDs...';
    right.appendChild(textarea);
    const fileLabel = document.createElement('label'); fileLabel.style.display='block'; fileLabel.style.marginTop='8px';
    fileLabel.textContent = 'Attach one supporting file (optional) — customers will be emailed instructions for upload.';
    right.appendChild(fileLabel);
    const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept='image/*,application/pdf'; fileInput.style.marginTop='6px';
    right.appendChild(fileInput);

    const sendReq = document.createElement('button'); sendReq.className='btn'; sendReq.style.display='block'; sendReq.style.marginTop='12px'; sendReq.textContent='Send customization request';
    sendReq.onclick = function(){
      const bodyParts = [];
      bodyParts.push('Product: ' + product.name);
      bodyParts.push('Price: ' + (product.price ? product.price + ' USD' : 'Contact'));
      bodyParts.push('');
      bodyParts.push('Customer notes:');
      bodyParts.push(textarea.value || '[no notes]');
      bodyParts.push('');
      bodyParts.push('If you attached a file, please reply to the email with the file attached or message us on Instagram with files.');
      const mailto = 'mailto:velvetcharmsofficial@example.com'
        + '?subject=' + encodeURIComponent('Customization request: ' + product.name)
        + '&body=' + encodeURIComponent(bodyParts.join('\n'));
      window.open(mailto);
    };
    right.appendChild(sendReq);

    detail.appendChild(left);
    detail.appendChild(right);
    container.appendChild(detail);
  }

  // ----------------------
  // On DOM ready, decide which page to render
  // ----------------------
  document.addEventListener('DOMContentLoaded', function () {
    const catRoot = document.getElementById('catalogue-root');
    const prodRoot = document.getElementById('product-root');

    fetchCatalogue().then(data => {
      if (catRoot) {
        try { buildCatalogue(data); } catch (e) { console.error(e); catRoot.innerHTML = '<p style="color:white">Failed to render catalogue.</p>'; }
      }
      if (prodRoot) {
        const url = new URL(window.location.href);
        const productId = url.searchParams.get('id');
        try { renderProductPage(data, productId); } catch (e) { console.error(e); prodRoot.innerHTML = '<p style="color:white">Failed to render product.</p>'; }
      }
      window._velvet_catalogue = data;
    }).catch(err => {
      console.error('Failed to load catalogue.json', err);
      if (catRoot) catRoot.innerHTML = "<p class='error' style='color:var(--muted)'>Failed to load catalogue.json</p>";
      if (prodRoot) prodRoot.innerHTML = "<p class='error' style='color:var(--muted)'>Failed to load catalogue.json</p>";
    });
  });

})();
