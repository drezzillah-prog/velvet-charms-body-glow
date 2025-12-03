// Body Glow site script
const ADMIN_EMAIL = ''; // set to your email if you want mailto behavior

async function loadProducts(){
  try{
    const res = await fetch('products.json');
    const data = await res.json();
    const grid = document.getElementById('products-grid');
    const included = ['Candles','Body Care','Soaps','Perfumes','Knitted & Braided Wool Creations','Hair Accessories','Phone Cases','Bundles'];
    const items = [];
    data.categories.forEach(cat=>{
      if(included.includes(cat.name)){
        (cat.subcategories || []).forEach(sub=>{
          (sub.products || []).forEach(p=>items.push({...p,category:cat.name,subcategory:sub.name}));
        });
        (cat.products || []).forEach(p=>items.push({...p,category:cat.name}));
      }
    });
    grid.innerHTML = items.map(p => productCard(p)).join('');
    attachDetailListeners();
  }catch(e){
    console.error('loadProducts error', e);
    document.getElementById('products-grid').innerHTML = '<p>Failed to load catalogue — ensure products.json is present.</p>';
  }
}

function productCard(p){
  const img = (p.images && p.images.length) ? `images/${p.images[0]}` : 'images/placeholder.png';
  const priceText = p.price ? `${p.price} USD` : '';
  const desc = p.description ? `<p>${escapeHtml(p.description)}</p>` : '';
  const link = p.paymentLink || '#';
  return `
  <div class="card" data-id="${escapeHtml(p.id || '')}">
    <img src="${img}" alt="${escapeHtml(p.name)}">
    <h3>${escapeHtml(p.name)}</h3>
    ${desc}
    <div class="price">${escapeHtml(priceText)}</div>
    <div class="btn-row">
      <a class="btn buy" href="${link}" target="_blank" rel="noopener noreferrer">Buy</a>
      <button class="btn details" data-id="${escapeHtml(p.id || '')}">Details</button>
    </div>
  </div>`;
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function attachDetailListeners(){
  document.querySelectorAll('.btn.details').forEach(btn=>{
    btn.addEventListener('click', async ()=> {
      const id = btn.getAttribute('data-id');
      showDetailsById(id);
    });
  });
}

async function showDetailsById(id){
  try{
    const res = await fetch('products.json');
    const data = await res.json();
    let found = null;
    data.categories.forEach(cat=>{
      (cat.subcategories||[]).forEach(sub=>(sub.products||[]).forEach(p=>{ if(p.id===id) found = p }));
      (cat.products||[]).forEach(p=>{ if(p.id===id) found = p });
    });
    if(!found) return alert('Product not found.');
    let imgs = (found.images || []).slice(0,8).map(i=>`images/${i}`);
    const body = `${found.name}\n\nPrice: ${found.price ? found.price + ' USD' : '—'}\n\n${found.description || ''}\n\nPayment Link: ${found.paymentLink || '—'}`;
    // simple details popup
    alert(body);
  }catch(e){ console.error(e) }
}

// Contact form behavior
document.getElementById('prepare-message').addEventListener('click', ()=>{
  const f = document.getElementById('contact-form');
  const form = new FormData(f);
  const name = form.get('name'), email = form.get('email'), message = form.get('message');
  const prepared = `From: ${name} <${email}>\n\n${message}`;
  const out = document.getElementById('prepared'); out.hidden = false; out.textContent = prepared;
  if(ADMIN_EMAIL){
    const subject = encodeURIComponent('Velvet Charms enquiry from ' + name);
    const body = encodeURIComponent(prepared);
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  }
});

// Snow animation (canvas)
(function initSnow(){
  const container = document.getElementById('snow');
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%'; canvas.style.height = '100%';
  canvas.width = innerWidth; canvas.height = innerHeight; container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let flakes = [];
  function reset(){ flakes = Array.from({length:80}, ()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*3+1,v:Math.random()*0.6+0.2})); }
  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(255,255,255,0.95)';
    flakes.forEach(f=>{ ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); f.y += f.v; f.x += Math.sin(f.y/50); if(f.y>canvas.height){ f.y=0; f.x=Math.random()*canvas.width; }});
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', ()=>{ canvas.width = innerWidth; canvas.height = innerHeight; reset(); });
  reset(); loop();
})();

loadProducts();
