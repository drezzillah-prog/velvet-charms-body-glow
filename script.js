// script.js for Velvet Charms sites (art-gifts)
(function(){
  // Lightweight helper to add multiple snowflakes (non-blocking)
  createSnow(24);

  function createSnow(count){
    for(let i=0;i<count;i++){
      const s = document.createElement('div');
      s.className = 'snowflake';
      s.style.left = (Math.random()*100)+'%';
      s.style.top = (-20 - Math.random()*30)+'vh';
      s.style.width = (6 + Math.random()*18)+'px';
      s.style.height = s.style.width;
      s.style.backgroundImage = 'url("christmaselements.png")';
      s.style.backgroundSize = '200px';
      s.style.opacity = 0.8 + Math.random()*0.2;
      s.style.animation = 'snow '+(8+Math.random()*12)+'s linear infinite';
      s.style.zIndex = 1;
      document.body.appendChild(s);
    }
  }

  // nothing else needed globally; catalogue pages have their own fetch logic included inline
})();
