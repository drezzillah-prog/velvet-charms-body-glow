/* shared script.js - Velvet Charms
   - expects catalogue.json in same folder
   - renders catalogue and product pages
   - layered background + snow + image fallback
*/

(function () {
  // === Background & Snow ===
  const LAYER_OPACITY = [0.28,0.35,0.4,0.55,0.75]; // applied by CSS pseudo-element; keep for future use
  function createSnow() {
    const snow = document.createElement("div");
    snow.className = "snowflake";
    snow.style.left = Math.random() * 100 + "vw";
    snow.style.top = (-10 - Math.random() * 10) + "vh";
    const size = (6 + Math.random() * 18);
    snow.style.width = size + "px";
    snow.style.height = size + "px";
    snow.style.borderRadius = "50%";
    snow.style.background = "rgba(255,255,255," + (0.7 + Math.random()*0.3) + ")";
    snow.style.animation = `snow ${6 + Math.random()*8}s linear`;
    snow.style.opacity = Math.random() * 0.6 + 0.4;
    snow.style.zIndex = 2;
    document.body.appendChild(snow);
    setTimeout(() => snow.remove(), 16000);
  }
  // create modest amount of snow
  for (let i=0;i<6;i++) setTimeout(createSnow, i*350);

  setInterval(createSnow, 700);

  // --- load catalogue.json ---
  function fetchCatalogue() {
    return fetch('catalogue.json').then(res => {
      if (!res.ok) throw new Error('catalogue.json fetch failed: ' + res.status);
      return res.json();
    });
  }

  function basename(path) { if (!path) return path; const parts = path.split('/'); return parts[parts.length - 1]; }

  function makeImgWithFallback(srcFromJson, alt) {
    const img = document.createElement('img');
    img.alt = alt || '';
    img.loading = 'lazy';
    img.src = srcFromJson;
    img.onerror = function () {
      const name = basename(srcFromJson);
      if (name && img.src.indexOf(name) === -1) {
        img.src = './' + name;
      } else {
        img.style.display = 'none';
      }
    };
    return img;
  }

  // render catalogue
  function buildCatalogue(data) {
    const root = document.getElementById('catalogue-root');
    if (!root) return;
    root.innerHTML = '';
    (data.categories || []).forEach(cat => {
      const catCard = document.createElement('section');
      catCard.className = 'cat-card';
      const title = document.createElement('h3'); title.textContent = cat.name; catCard.appendChild(title);

      if (cat.banner) {
        const b = document.createElement('img');
        b.src = cat.banner;
        b.alt = cat.name + ' banner';
        b.style.maxWidth = '100%';
        b.style.borderRadius = '8px';
        b.onerror = function () { this.remove(); };
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

  // find product
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

  function createScentSelect(options, fieldId){
    const sel = document.createElement('select');
    sel.name = fieldId || 'scent';
    (options || []).forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      sel.appendChild(o);
    });
    return sel;
  }

  // render product
  function renderProductPage(data, productId) {
    const container = document.getElementById('product-root');
    if (!container) return;
    container.innerHTML = '';

    const product = findProductById(data, productId);
    if (!product) {
      container.innerHTML = "<p class='error'>Product not found.</p>";
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
      const ph = document.createElement('div'); ph.textContent = 'No image';
      left.appendChild(ph);
    }

    const right = document.createElement('div'); right.className = 'prod-meta';
    const price = document.createElement('p'); price.className = 'price'; price.textContent = product.price ? (product.price + ' USD') : 'Contact for price';
    right.appendChild(price);

    const desc = document.createElement('p'); desc.className = 'desc'; desc.textContent = product.description || '';
    right.appendChild(desc);

    // scents if available
    if (product.options && product.options.scent && Array.isArray(product.options.scent)) {
      const label = document.createElement('label'); label.textContent = 'Choose scent:';
      right.appendChild(label);
      right.appendChild(createScentSelect(product.options.scent, 'scent'));
    }

    // intensity if present
    if (product.options && product.options.intensity) {
      const label2 = document.createElement('label'); label2.textContent = 'Scent intensity:';
      right.appendChild(label2);
      right.appendChild(createScentSelect(product.options.intensity, 'intensity'));
    }

    // customization box (left EXACTLY as it is)
    const customLabel = document.createElement('label'); customLabel.textContent = 'Customization / Notes';
    right.appendChild(customLabel);
    const custom = document.createElement('textarea'); custom.className = 'custom-box'; custom.name = 'customization'; custom.placeholder = 'Add notes for customization (colors, initials, reference link)';
    right.appendChild(custom);

    // file upload hint (we keep box but don't implement upload server here)
    const uploadHint = document.createElement('p'); uploadHint.style.fontSize='13px'; uploadHint.style.color='var(--muted)'; uploadHint.textContent = 'You can attach 1 file (image/pdf) — if you need more, message on Instagram or use Contact form.';
    right.appendChild(uploadHint);

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

    detail.appendChild(left);
    detail.appendChild(right);
    container.appendChild(detail);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const catRoot = document.getElementById('catalogue-root');
    const prodRoot = document.getElementById('product-root');

    fetchCatalogue().then(data => {
      if (catRoot) {
        try { buildCatalogue(data); } catch (e) { console.error(e); catRoot.innerHTML = '<p class="error">Failed to render catalogue.</p>'; }
      }
      if (prodRoot) {
        const url = new URL(window.location.href);
        const productId = url.searchParams.get('id');
        try { renderProductPage(data, productId); } catch (e) { console.error(e); prodRoot.innerHTML = '<p class="error">Failed to render product.</p>'; }
      }

      // expose for debugging
      window._velvet_catalogue = data;
    }).catch(err => {
      console.error('Failed to load catalogue.json', err);
      if (catRoot) catRoot.innerHTML = "<p class='error'>Failed to load catalogue.json</p>";
      if (prodRoot) prodRoot.innerHTML = "<p class='error'>Failed to load catalogue.json</p>";
    });

  });

})();
