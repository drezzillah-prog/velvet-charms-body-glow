/* Shared script for catalogue and product pages.
   - expects catalogue.json in the same folder (catalogue-body-glow.json or catalogue-art-gifts.json)
   - catalogue page: element with id="catalogue-root"
   - product page: element with id="product-root" and ?id=PRODUCTID in URL
   - uses image fallback: first tries path from JSON, if 404 falls back to basename in root
   - implements cart + wishlist + checkout using /api/create-order
*/

(function () {
  const CHRISTMAS_IMAGES = [
    './christmaselements.png',
    './christmaselements2.png',
    './christmaselements3.png',
    './christmaselements4.png',
    './christmaselements5.png'
  ];

  // add layered background (option: layered scrolling)
  function initBackground() {
    try {
      // create two layers for parallax
      const layer1 = document.createElement('div');
      layer1.className = 'bg-layer layer-1';
      layer1.style.backgroundImage = `url("${CHRISTMAS_IMAGES[0]}")`;
      layer1.style.backgroundSize = 'cover';
      document.body.appendChild(layer1);

      const layer2 = document.createElement('div');
      layer2.className = 'bg-layer layer-2';
      layer2.style.backgroundImage = `url("${CHRISTMAS_IMAGES[1] || CHRISTMAS_IMAGES[0]}")`;
      layer2.style.backgroundSize = 'contain';
      document.body.appendChild(layer2);

      // small subtle parallax on scroll
      window.addEventListener('scroll', () => {
        const v = window.scrollY;
        layer1.style.transform = `translateY(${v * 0.04}px)`;
        layer2.style.transform = `translateY(${v * 0.08}px)`;
      });
    } catch (e) { console.warn(e); }
  }

  initBackground();

  // ----------------------
  // Helpers
  // ----------------------
  function basename(path) {
    if (!path) return path;
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  function makeImgWithFallback(srcFromJson, alt) {
    const img = document.createElement('img');
    img.alt = alt || '';
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

  // ----------------------
  // Load catalogue.json (choose the correct file present in the repo root)
  // We'll try both names: catalogue.json (if the user already uses it) then specific names.
  // ----------------------
  function fetchCatalogue() {
    const candidates = [
      'catalogue.json',
      'catalogue-body-glow.json',
      'catalogue-art-gifts.json'
    ];
    function tryFetch(idx) {
      if (idx >= candidates.length) return Promise.reject(new Error('No catalogue found'));
      return fetch(candidates[idx]).then(res => {
        if (!res.ok) throw new Error('catalogue fetch failed');
        return res.json();
      }).catch(() => tryFetch(idx + 1));
    }
    return tryFetch(0);
  }

  // ----------------------
  // Cart & wishlist
  // ----------------------
  const CART_KEY = 'velvet_cart_v1';
  const WISH_KEY = 'velvet_wish_v1';

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[]}'); } catch (e) { return {items:[]}; }
  }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function loadWish() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveWish(wish) { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); }

  function formatMoney(n){ return Number(n||0).toFixed(2); }

  function renderCartPanel(catalogue) {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    const itemsRoot = panel.querySelector('#cart-items');
    const subtotalEl = panel.querySelector('#cart-subtotal');
    itemsRoot.innerHTML = '';
    const cart = loadCart();
    let subtotal = 0;
    (cart.items || []).forEach(ci => {
      const product = findProductById(catalogue, ci.id);
      if (!product) return;
      const row = document.createElement('div');
      row.className = 'cart-row small-muted';
      row.style.marginBottom = '8px';
      const title = document.createElement('div');
      title.textContent = `${product.name} × ${ci.qty}`;
      const price = document.createElement('div');
      price.textContent = `${formatMoney((product.price||0) * ci.qty)} USD`;
      const remove = document.createElement('button');
      remove.className = 'btn small ghost';
      remove.textContent = 'Remove';
      remove.style.marginLeft = '8px';
      remove.onclick = () => {
        cart.items = cart.items.filter(x=>!(x.id===ci.id));
        saveCart(cart); renderCartPanel(catalogue);
      };
      row.appendChild(title);
      row.appendChild(price);
      row.appendChild(remove);
      itemsRoot.appendChild(row);
      subtotal += (Number(product.price||0) * Number(ci.qty||1));
    });
    subtotalEl.textContent = formatMoney(subtotal);
    panel.style.display = (cart.items && cart.items.length) ? 'block' : 'none';
  }

  function renderWishlistPanel(catalogue) {
    const panel = document.getElementById('wishlist-panel');
    if (!panel) return;
    const root = panel.querySelector('#wishlist-items');
    root.innerHTML = '';
    const wish = loadWish();
    wish.forEach(id => {
      const prod = findProductById(catalogue, id);
      if (!prod) return;
      const div = document.createElement('div');
      div.className = 'small-muted';
      div.style.marginBottom = '8px';
      div.textContent = prod.name;
      const remove = document.createElement('button');
      remove.className = 'btn small ghost';
      remove.textContent = 'Remove';
      remove.style.marginLeft = '8px';
      remove.onclick = () => {
        const w = loadWish().filter(x=>x!==id); saveWish(w); renderWishlistPanel(catalogue);
      };
      div.appendChild(remove);
      root.appendChild(div);
    });
    panel.style.display = (wish && wish.length) ? 'block' : 'none';
  }

  // ----------------------
  // Catalogue builder
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
            const img = document.createElement('img'); img.alt = p.name || ''; img.style.display='none'; imgWrap.appendChild(img);
          }
          card.appendChild(imgWrap);

          const h = document.createElement('h5'); h.textContent = p.name || 'Unnamed'; card.appendChild(h);
          const price = document.createElement('div'); price.className = 'price'; price.textContent = (p.price ? (p.price + ' USD') : 'Contact'); card.appendChild(price);

          const btns = document.createElement('div');
          const btn = document.createElement('a'); btn.className = 'btn small'; btn.href = 'product.html?id=' + encodeURIComponent(p.id); btn.textContent = 'See details';
          const wl = document.createElement('button'); wl.className='btn small ghost'; wl.textContent='I love this';
          wl.onclick = (e) => {
            e.preventDefault();
            const wish = loadWish();
            if (!wish.includes(p.id)) { wish.push(p.id); saveWish(wish); renderWishlistPanel(data); }
          };
          const add = document.createElement('button'); add.className='btn small'; add.textContent='Add to cart';
          add.onclick = (ev) => {
            ev.preventDefault();
            const cart = loadCart();
            const found = cart.items.find(x=>x.id===p.id);
            if (found) found.qty = Number(found.qty)+1;
            else cart.items.push({id:p.id, qty:1, options:{}});
            saveCart(cart); renderCartPanel(data);
            alert('Added to cart: ' + p.name);
          };
          btns.appendChild(btn); btns.appendChild(add); btns.appendChild(wl);
          card.appendChild(btns);

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

    // render cart/wishlist panels
    renderCartPanel(data);
    renderWishlistPanel(data);
    attachCheckoutHandler(data);
  }

  // ----------------------
  // Find product by id in catalogue
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
  // Render product page
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
    }

    const right = document.createElement('div'); right.className = 'prod-meta';
    const price = document.createElement('p'); price.className = 'price'; price.textContent = product.price ? (product.price + ' USD') : 'Contact for price';
    right.appendChild(price);

    const desc = document.createElement('p'); desc.className = 'desc'; desc.textContent = product.description || '';
    right.appendChild(desc);

    // Options (scent dropdown rules)
    if (product.options && product.options.scentList && product.options.scentList.length) {
      const label = document.createElement('label');
      label.textContent = 'Scent: ';
      const sel = document.createElement('select');
      sel.name = 'scent';
      product.options.scentList.forEach(s => {
        const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
      });
      label.appendChild(sel);
      right.appendChild(label);
    }

    // customization box — exact textarea + upload as requested (leave as-is)
    const custLabel = document.createElement('label');
    custLabel.style.display='block'; custLabel.style.marginTop='10px';
    custLabel.innerHTML = 'Customization / Notes (optional) <textarea id="custom-note" rows="4" placeholder="Add personalization, reference notes..."></textarea>';
    right.appendChild(custLabel);

    // file upload (optional)
    const fileLabel = document.createElement('label');
    fileLabel.style.display='block'; fileLabel.style.marginTop='8px';
    fileLabel.innerHTML = 'Upload a supporting file (optional) <input type="file" id="custom-file" accept=".png,.jpg,.jpeg,.pdf">';
    right.appendChild(fileLabel);

    // buy controls
    const buyRow = document.createElement('div'); buyRow.style.marginTop='12px';
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Add to cart';
    addBtn.onclick = () => {
      const cart = loadCart();
      const found = cart.items.find(x=>x.id===product.id);
      if (found) found.qty = Number(found.qty)+1;
      else cart.items.push({id:product.id, qty:1, options:{}});
      saveCart(cart);
      renderCartPanel(data);
      alert('Added to cart: ' + product.name);
    };
    const wishBtn = document.createElement('button'); wishBtn.className='btn ghost'; wishBtn.textContent='I love this';
    wishBtn.onclick = () => {
      const wish = loadWish();
      if (!wish.includes(product.id)) { wish.push(product.id); saveWish(wish); renderWishlistPanel(data); alert('Added to wishlist'); }
    };
    buyRow.appendChild(addBtn); buyRow.appendChild(wishBtn);

    // buy-now / paypal product link
    if (product.paymentLink) {
      const buyNow = document.createElement('a');
      buyNow.href = product.paymentLink;
      buyNow.target='_blank';
      buyNow.rel='noopener';
      buyNow.className='btn';
      buyNow.style.marginLeft='8px';
      buyNow.textContent='Buy now (PayPal)';
      buyRow.appendChild(buyNow);
    }

    right.appendChild(buyRow);
    detail.appendChild(left);
    detail.appendChild(right);
    container.appendChild(detail);
  }

  // ----------------------
  // Checkout handler (creates order via /api/create-order)
  // ----------------------
  function attachCheckoutHandler(catalogue) {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;
    checkoutBtn.onclick = async () => {
      const cart = loadCart();
      if (!cart.items || cart.items.length === 0) { alert('Your cart is empty'); return; }
      // build items for create-order (name, price, qty)
      const payload = { cart: { items: cart.items.map(ci => {
        const p = findProductById(catalogue, ci.id) || {};
        return { id: ci.id, name: p.name || ci.id, price: Number(p.price||0), qty: Number(ci.qty||1) };
      }), shipping: 0 } };

      try {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.approveUrl) {
          // redirect to PayPal approval
          window.location.href = data.approveUrl;
        } else {
          alert('Could not create PayPal order. Falling back to individual product links.');
        }
      } catch (e) {
        console.error(e); alert('Checkout failed. Try again later.');
      }
    };
  }

  // ----------------------
  // Contact form handler
  // ----------------------
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const result = document.getElementById('contact-result');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      result.textContent = 'Sending...';
      const fd = new FormData(form);
      const file = fd.get('attachment');
      let uploadedUrl = null;

      try {
        if (file && file.name) {
          // upload to /api/upload
          const formUp = new FormData();
          formUp.append('file', file);
          formUp.append('name', fd.get('name'));
          const upRes = await fetch('/api/upload', { method: 'POST', body: formUp });
          const upData = await upRes.json();
          if (upData && upData.file) {
            uploadedUrl = upData.file.path || upData.file.name || null;
          }
        }

        const payload = { name: fd.get('name'), email: fd.get('email'), message: fd.get('message'), attachmentUrl: uploadedUrl || null };
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await r.json();
        if (j && j.ok) {
          result.textContent = 'Message sent — thank you!';
          form.reset();
        } else {
          result.textContent = 'Sent (temporary) — we will check soon.';
        }
      } catch (e) {
        console.error(e);
        result.textContent = 'Sending failed — try again later.';
      }
    });
  }

  // ----------------------
  // On DOM ready, decide which page to render
  // ----------------------
  document.addEventListener('DOMContentLoaded', function () {
    fetchCatalogue().then(data => {
      const catRoot = document.getElementById('catalogue-root');
      const prodRoot = document.getElementById('product-root');

      // inject scent lists from rules (spiritual vs general)
      const spiritualList = [
        "Frankincense","Myrrh","Sage","Dragon’s Blood","Palo Santo","Unscented",
        "Copal","Benzoin","Amber Resin","Temple Incense","Lotus","White Musk",
        "Nag Champa","Sandalwood","Patchouli","Oud","Holy Basil (Tulsi)"
      ];
      const generalList = [
        "Lavender","Rose","Jasmine","Vanilla","Coconut","Cherry","Strawberry","Peach",
        "Lemon","Orange","Mint","Sandalwood","Cedarwood","Pine","Eucalyptus",
        "Cinnamon","Chocolate","Honey","Orchid","Apple","Unscented"
      ];

      // ensure product objects have options.scentList when relevant
      (data.categories||[]).forEach(cat=>{
        const assignScent = (p)=>{
          if (!p || !p.id) return;
          if (p.options && p.options.scent === 'spiritual') p.options.scentList = spiritualList;
          else if (p.options && p.options.scent === 'general') p.options.scentList = generalList;
        };
        if (cat.products) cat.products.forEach(assignScent);
        if (cat.subcategories) cat.subcategories.forEach(sc=>sc.products && sc.products.forEach(assignScent));
      });

      if (catRoot) {
        try { buildCatalogue(data); } catch (e) { console.error(e); catRoot.innerHTML = '<p style="color:white">Failed to render catalogue.</p>'; }
      }
      if (prodRoot) {
        const url = new URL(window.location.href);
        const productId = url.searchParams.get('id');
        try { renderProductPage(data, productId); } catch (e) { console.error(e); prodRoot.innerHTML = '<p style="color:white">Failed to render product.</p>'; }
      }

      initContactForm();
      // save global for debugging
      window._velvet_catalogue = data;
    }).catch(err => {
      console.error('Failed to load catalogue.json', err);
      const catRoot = document.getElementById('catalogue-root');
      const prodRoot = document.getElementById('product-root');
      if (catRoot) catRoot.innerHTML = "<p class='error' style='color:var(--muted)'>Failed to load catalogue.json</p>";
      if (prodRoot) prodRoot.innerHTML = "<p class='error' style='color:var(--muted)'>Failed to load catalogue.json</p>";
    });
  });

})();
