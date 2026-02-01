/* src/game.js */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- GAME CONFIGURATION ---
    const config = {
        speed: 8,           // Movement speed
        milestoneGap: 1000, // Distance between milestones (pixels)
        triggerDist: 200    // Distance to trigger popup info
    };

    // --- CV DATA (MILESTONES) ---
    // Extracted from your PDF
    const careerPath = [
        {
            year: "2021",
            title: "Started University",
            desc: "B.S. Computer Engineering at Çankaya University (Full Scholarship). GPA: 3.68.",
            icon: "fa-university"
        },
        {
            year: "2022",
            title: "Teaching Assistant",
            desc: "Undergraduate TA for coding labs. Helped students with algorithms & assignments.",
            icon: "fa-chalkboard-teacher"
        },
        {
            year: "2023",
            title: "GameDev Internship",
            desc: "C++ Developer Intern at Gamelab Istanbul. Worked on GlistEngine optimization.",
            icon: "fa-gamepad"
        },
        {
            year: "2023",
            title: "Transfer to Hacettepe University",
            desc: "Started B.S. Computer Science at Hacettepe University.",
            icon: "fa-graduation-cap"
        },
        {
            year: "2024",
            title: "Part-time Researcher at TÜBİTAK",
            desc: "Candidate Researcher at TÜBİTAK SAGE (Defense Industries).",
            icon: "fa-flask"
        },
        {
            year: "2024",
            title: "Internship at HAVELSAN",
            desc: "Software Engineering Intern at Turkey's leading defense company.",
            icon: "fa-shield-alt"
        },
        {
            year: "2024-25",
            title: "Erasmus in Germany",
            desc: "Data Science program at Philipps-Universität Marburg.",
            icon: "fa-plane-departure"
        }
    ];

    // --- DOM ELEMENTS ---
    const world = document.getElementById('world-layer');
    const player = document.getElementById('player');
    const container = document.getElementById('milestones-container');
    const distCounter = document.getElementById('dist-counter');
    const hintText = document.getElementById('hint-text');

    // --- STATE VARIABLES ---
    let position = 0;       // Current world position (x)
    let isMovingLeft = false;
    let isMovingRight = false;
    let animationId;
    
    // --- INITIALIZATION ---
    function init() {
        renderMilestones();
        gameLoop();
    }

    // --- RENDER MILESTONES ---
    function renderMilestones() {
        careerPath.forEach((item, index) => {
            // Calculate position: Start at 800px, add gap for each
            const xPos = 800 + (index * config.milestoneGap);
            
            const el = document.createElement('div');
            el.className = 'milestone';
            el.style.left = `${xPos}px`;
            el.dataset.x = xPos; // Store x position for collision check

            // Inner HTML for Pole, Icon, and Info Card
            el.innerHTML = `
                <div class="info-card">
                    <div class="text-xl font-bold text-white mb-1">${item.year}</div>
                    <div class="text-lg font-bold mb-2 border-b border-green-900 pb-1">${item.title}</div>
                    <div class="text-sm opacity-90">${item.desc}</div>
                </div>
                <div class="milestone-icon"><i class="fas ${item.icon}"></i></div>
                <div class="milestone-pole"></div>
            `;
            
            container.appendChild(el);
        });
    }

    // --- INPUT HANDLING ---
    
    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (e.key === "ArrowRight" || e.key === "d") isMovingRight = true;
        if (e.key === "ArrowLeft" || e.key === "a") isMovingLeft = true;
        
        // Hide hint on first move
        if (isMovingRight || isMovingLeft) hintText.style.display = 'none';
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === "ArrowRight" || e.key === "d") isMovingRight = false;
        if (e.key === "ArrowLeft" || e.key === "a") isMovingLeft = false;
    });

    // Mobile Touch
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    if (btnLeft && btnRight) {
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingLeft = true; hintText.style.display = 'none'; });
        btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); isMovingLeft = false; });
        
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); isMovingRight = true; hintText.style.display = 'none'; });
        btnRight.addEventListener('touchend', (e) => { e.preventDefault(); isMovingRight = false; });
    }

    // --- GAME LOOP ---
    function gameLoop() {
        // 1. Update Position
        if (isMovingRight) {
            position += config.speed;
            player.classList.add('walking');
            player.style.transform = "scaleX(1)"; // Face Right
        } else if (isMovingLeft && position > 0) {
            position -= config.speed;
            player.classList.add('walking');
            player.style.transform = "scaleX(-1)"; // Face Left
        } else {
            player.classList.remove('walking');
        }

        // 2. Move World (Camera Effect)
        // We move the world layer to the left as player moves right
        world.style.transform = `translateX(-${position}px)`;
        
        // 3. Update UI
        distCounter.innerText = Math.floor(position / 10);

        // 4. Check Collisions (Milestones)
        checkMilestones();

        // 5. Next Frame
        requestAnimationFrame(gameLoop);
    }

    // --- COLLISION LOGIC ---
    function checkMilestones() {
        // Player's world x position is roughly 'position + screen_width/5' 
        // But simpler logic: The world moves left, so an element at x=1000 comes into view when position nears 1000.
        // Actually, since player is fixed at left: 20vw, we need to account for that offset.
        // Let's assume player effective X is `position + 200` (roughly).
        
        // Better approach: Calculate distance relative to the moving world.
        const playerWorldX = position + (window.innerWidth * 0.2); 

        const milestones = document.querySelectorAll('.milestone');
        
        milestones.forEach(ms => {
            const msX = parseInt(ms.dataset.x);
            const dist = Math.abs(playerWorldX - msX);
            const card = ms.querySelector('.info-card');

            // If close enough, show the card
            if (dist < config.triggerDist) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    // Start
    init();
});