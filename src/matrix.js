/* src/matrix.js */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Update Footer Year
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Matrix Canvas Setup
    const canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const body = document.body; 
    
    // Select Profile Image for dynamic switching
    const profileImg = document.querySelector('.profile-avatar img');

    // Preload images to prevent flickering during glitch
    const imgNormal = new Image(); imgNormal.src = 'assets/pp.png';
    const imgBlue = new Image();   imgBlue.src = 'assets/pp_blue.jpg';
    const imgRed = new Image();    imgRed.src = 'assets/pp_red.png';

    // --- SETTINGS ---
    const baseFontSize = 24;  // Size for Runes
    const glitchFontSize = 30; // Larger size for Latin/Matrix
    
    // Opacity for the trail effect
    const fadeOpacity = "0.08"; 

    // Fonts
    const fontOrkhon = "'Noto Sans Old Turkic', monospace"; 
    const fontLatin = "'VT323', monospace"; 
    const fontMatrix = "monospace"; 

    // Timing & FPS Control
    let lastTime = 0;
    const fps = 20; 
    const nextFrameTime = 1000 / fps;

    let width, height;
    let drops = []; 

    // --- CHARACTER SETS ---
    
    // Set 1: Old Turkic Runes (Normal Mode)
    const orkhonChars = [];
    for (let i = 0x10C00; i <= 0x10C4F; i++) {
        orkhonChars.push(String.fromCodePoint(i));
    }

    // Set 2: Latin Characters (Blue Glitch Mode)
    const latinChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

    // Set 3: Matrix/Katakana Characters (Red Glitch Mode)
    const matrixChars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ"; 

    // --- GLITCH CONTROL VARIABLES ---
    let isGlitching = false;
    let glitchEndTime = 0;
    
    let nextGlitchTime = performance.now() + 5000; 
    let currentGlitchMode = 0; // 0: Latin (Blue), 1: Matrix (Red)

    // Function to trigger the screen shake effect
    function triggerShakeEffect() {
        canvas.classList.add("canvas-glitch");
        setTimeout(() => {
            canvas.classList.remove("canvas-glitch");
        }, 500); 
    }

    // Function to apply the color theme AND switch profile picture
    function setGlitchTheme(active, mode) {
        // Remove old theme classes
        body.classList.remove("glitch-mode-blue", "glitch-mode-red");

        if (active) {
            if (mode === 0) {
                // --- BLUE MODE ---
                body.classList.add("glitch-mode-blue"); 
                // Switch to Blue Profile Picture
                if (profileImg) profileImg.src = imgBlue.src;
            } else {
                // --- RED MODE ---
                body.classList.add("glitch-mode-red"); 
                // Switch to Red Profile Picture
                if (profileImg) profileImg.src = imgRed.src;
            }
        } else {
            // --- NORMAL MODE ---
            // Revert to Original Profile Picture
            if (profileImg) profileImg.src = imgNormal.src;
        }
    }

    // Handle Window Resize
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const columns = Math.ceil(width / baseFontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -20);
      }
    }

    // Main Animation Loop
    function draw(timeStamp) {
      const deltaTime = timeStamp - lastTime;

      if (deltaTime >= nextFrameTime) {
          lastTime = timeStamp - (deltaTime % nextFrameTime);

          // --- LOGIC SECTION ---
          
          // Start Glitch
          if (!isGlitching && timeStamp > nextGlitchTime) {
              isGlitching = true;
              glitchEndTime = timeStamp + 5000; 
              
              currentGlitchMode = Math.random() < 0.5 ? 0 : 1;
              
              setGlitchTheme(true, currentGlitchMode);
              triggerShakeEffect();
          }

          // End Glitch
          if (isGlitching && timeStamp > glitchEndTime) {
              isGlitching = false;
              nextGlitchTime = timeStamp + 10000 + Math.random() * 20000;
              
              setGlitchTheme(false, 0); 
              triggerShakeEffect();
          }

          // --- DRAWING SECTION ---

          // Clear Background
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`; 
          ctx.fillRect(0, 0, width, height);

          // Prepare Font Settings
          ctx.textAlign = "center";
          let charSet, color, font, currentSize;

          if (isGlitching) {
              currentSize = glitchFontSize;
              if (currentGlitchMode === 0) {
                  // BLUE MODE
                  charSet = latinChars;
                  color = "#0088FF"; 
                  font = fontLatin;
              } else {
                  // RED MODE
                  charSet = matrixChars;
                  color = "#FF0000"; 
                  font = fontMatrix;
              }
          } else {
              // NORMAL MODE
              currentSize = baseFontSize;
              charSet = orkhonChars;
              color = "#00FF41";
              font = fontOrkhon;
          }

          ctx.font = currentSize + "px " + font;
          ctx.fillStyle = color;

          // Draw Columns
          for (let i = 0; i < drops.length; i++) {
            const text = charSet[Math.floor(Math.random() * charSet.length)];
            const x = (i * baseFontSize) + (baseFontSize / 2); 
            const y = drops[i] * baseFontSize;

            ctx.fillText(text, x, y);

            if (y > height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
      }
      requestAnimationFrame(draw);
    }

    // Initialize
    window.addEventListener("resize", resize);
    document.fonts.ready.then(() => {
        resize();
        requestAnimationFrame(draw);
    });

    // --- SPOTIFY WIDGET LOGIC (REWRITTEN) ---
    const spotifyWidget = document.getElementById('spotify-widget');
    const toggleBtn = document.getElementById('spotify-toggle');
    const minimizeBtn = document.getElementById('spotify-minimize');

    if (spotifyWidget && toggleBtn && minimizeBtn) {
        
        // 1. Initial State: Closed on Mobile, Open on Desktop
        if (window.innerWidth < 768) {
            spotifyWidget.classList.add('closed');
        }

        // 2. Open Action (Clicking the Big Music Icon)
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent glitches
            spotifyWidget.classList.remove('closed');
        });

        // 3. Close Action (Clicking the Small Minus Icon)
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent glitches
            spotifyWidget.classList.add('closed');
        });
    }
});