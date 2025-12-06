(function () {

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

  for (let i=0;i<6;i++) setTimeout(createSnow, i*350);
  setInterval(createSnow, 700);

  // CORRECTED — THIS IS THE FIX
  function fetchCatalogue() {
    return fetch('catalogue-body-glow.json', { cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error('Body Glow catalogue load failed: ' + res.status);
        return res.json();
      });
  }
