/* src/matrix.js */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Dynamic Year for Footers
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Matrix Rain Animation
    const canvas = document.getElementById("matrix-canvas");
    if (!canvas) return; // Stop if no canvas found

    const ctx = canvas.getContext("2d");
    const fontSize = 24; 
    const fontFamily = "'Noto Sans Old Turkic', monospace";
    
    // Settings
    let lastTime = 0;
    const fps = 20; 
    const nextFrameTime = 1000 / fps;

    let width, height;
    let drops = []; 

    // Orkhon Runes Unicode Block
    const orkhonChars = [];
    for (let i = 0x10C00; i <= 0x10C4F; i++) {
        orkhonChars.push(String.fromCodePoint(i));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const columns = Math.ceil(width / fontSize);
      
      // Reset drops
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -20);
      }
    }

    function draw(timeStamp) {
      const deltaTime = timeStamp - lastTime;

      if (deltaTime >= nextFrameTime) {
          lastTime = timeStamp - (deltaTime % nextFrameTime);

          // Fade out background
          ctx.fillStyle = "rgba(0, 0, 0, 0.08)"; 
          ctx.fillRect(0, 0, width, height);

          // Font Settings
          ctx.font = fontSize + "px " + fontFamily;
          ctx.textAlign = "center";
          ctx.fillStyle = "#00FF41"; // Matrix Green

          for (let i = 0; i < drops.length; i++) {
            const text = orkhonChars[Math.floor(Math.random() * orkhonChars.length)];
            const x = (i * fontSize) + (fontSize / 2); 
            const y = drops[i] * fontSize;

            ctx.fillText(text, x, y);

            // Reset condition
            if (y > height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
      }
      requestAnimationFrame(draw);
    }

    // Init
    window.addEventListener("resize", resize);
    
    // Start after fonts load
    document.fonts.load(fontSize + "px 'Noto Sans Old Turkic'").then(() => {
        resize();
        requestAnimationFrame(draw);
    }).catch(() => {
        resize();
        requestAnimationFrame(draw);
    });
});