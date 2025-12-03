// script.js - Velvet Charms Body & Glow
// Expects catalogue.json in the same folder.
// Renders catalogue.html and product.html.

function fetchJSON(path) {
    return fetch(path).then(r => {
        if (!r.ok) throw new Error("Failed to load " + path);
        return r.json();
    });
}

// ---------------------- Catalogue rendering ----------------------
function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function createEl(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
}

function showMessage(container, text) {
    const p = createEl('p', null, text);
    container.appendChild(p);
}

function renderProductCard(p) {
    const card = createEl('div', 'product-card');
    const img = createEl('img');
    img.src = p.images && p.images.length ? p.images[0] : 'placeholder.png';
    img.alt = p.name;
    card.appendChild(img);

    const title = createEl('h4', null, p.name);
    card.appendChild(title);

    const price = createEl('div', 'price', `${p.price} USD`);
    card.appendChild(price);

    const a = createEl('a', null, 'See details');
    a.href = `product.html?id=${encodeURIComponent(p.id)}`;
    card.appendChild(a);

    return card;
}

function renderCatalogue(data, containerId = 'catalogue-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    clear(container);

    if (!data || !Array.isArray(data.categories) || data.categories.length === 0) {
        showMessage(container, "No categories found.");
        return;
    }

    data.categories.forEach(cat => {
        // Category header
        const catWrap = createEl('div', 'category-block');
        const catTitle = createEl('h2', null, cat.name);
        catWrap.appendChild(catTitle);

        if (cat.banner) {
            const bimg = createEl('img', 'category-banner');
            bimg.src = cat.banner;
            bimg.alt = cat.name;
            catWrap.appendChild(bimg);
        }

        // subcategories
        if (Array.isArray(cat.subcategories) && cat.subcategories.length) {
            cat.subcategories.forEach(sub => {
                const subTitle = createEl('h3', null, sub.name);
                catWrap.appendChild(subTitle);

                const grid = createEl('div', 'product-grid');
                if (Array.isArray(sub.products) && sub.products.length) {
                    sub.products.forEach(p => {
                        grid.appendChild(renderProductCard(p));
                    });
                } else {
                    showMessage(catWrap, 'No products in this subcategory.');
                }

                catWrap.appendChild(grid);
            });
        } else {
            showMessage(catWrap, 'No subcategories in this category.');
        }

        container.appendChild(catWrap);
    });
}

// ---------------------- Product page rendering ----------------------
function renderProductPage(product) {
    const cont = document.getElementById('product-container');
    if (!cont) return;
    clear(cont);

    const title = createEl('h2', null, product.name);
    cont.appendChild(title);

    // Image gallery (simple)
    if (product.images && product.images.length) {
        const gallery = createEl('div', 'product-gallery');
        product.images.forEach(src => {
            const im = createEl('img');
            im.src = src;
            im.alt = product.name;
            im.style.maxWidth = '260px';
            im.style.margin = '8px';
            gallery.appendChild(im);
        });
        cont.appendChild(gallery);
    }

    const desc = createEl('p', null, product.description || '');
    cont.appendChild(desc);

    // Options (if any)
    if (product.options) {
        Object.keys(product.options).forEach(optName => {
            const opts = product.options[optName];
            const label = createEl('label', null, `${optName}: `);
            const sel = createEl('select', null);
            sel.id = `opt-${optName}`;
            opts.forEach(o => {
                const op = document.createElement('option');
                op.value = o;
                op.textContent = o;
                sel.appendChild(op);
            });
            cont.appendChild(label);
            cont.appendChild(sel);
            cont.appendChild(createEl('br'));
        });
    }

    // Price
    const price = createEl('div', 'price', `${product.price} USD`);
    cont.appendChild(price);

    // PayPal button (open in new tab)
    const buy = createEl('a', 'pay-btn', 'Buy via PayPal');
    buy.href = product.paymentLink || '#';
    buy.target = '_blank';
    buy.rel = 'noopener noreferrer';
    cont.appendChild(buy);

    // Extra: Show product id for debugging
    const pid = createEl('div', 'product-id', `Product ID: ${product.id}`);
    pid.style.opacity = 0.6;
    pid.style.marginTop = '12px';
    cont.appendChild(pid);
}

// ---------------------- Loader helpers ----------------------
function loadCatalogue(file) {
    fetchJSON(file)
        .then(data => renderCatalogue(data))
        .catch(err => {
            console.error(err);
            const cont = document.getElementById('catalogue-container');
            if (cont) {
                clear(cont);
                showMessage(cont, 'Failed to load catalogue. Check file name and JSON structure.');
            }
        });
}

function findProductById(data, id) {
    if (!data || !Array.isArray(data.categories)) return null;
    let found = null;
    data.categories.forEach(cat => {
        if (!cat.subcategories) return;
        cat.subcategories.forEach(sub => {
            if (!sub.products) return;
            sub.products.forEach(p => {
                if (p.id === id) found = p;
            });
        });
    });
    return found;
}

function loadProduct(file = 'catalogue.json') {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        const cont = document.getElementById('product-container');
        if (cont) showMessage(cont, 'No product selected.');
        return;
    }

    fetchJSON(file)
        .then(data => {
            const product = findProductById(data, id);
            if (!product) {
                const cont = document.getElementById('product-container');
                if (cont) {
                    clear(cont);
                    showMessage(cont, 'Product not found.');
                }
                return;
            }
            renderProductPage(product);
        })
        .catch(err => {
            console.error(err);
            const cont = document.getElementById('product-container');
            if (cont) {
                clear(cont);
                showMessage(cont, 'Failed to load product.');
            }
        });
}

// ---------------------- Auto-run when catalogue page loads without inline call ----------------------
document.addEventListener('DOMContentLoaded', function() {
    // If catalogue container exists and script wasn't called inline, attempt to load.
    if (document.getElementById('catalogue-container')) {
        // Some pages call loadCatalogue('catalogue.json') inline. If not, we call default.
        // Use catalogue.json by default.
        if (typeof window._catalogueLoaded === 'undefined') {
            loadCatalogue('catalogue.json');
            window._catalogueLoaded = true;
        }
    }
});
