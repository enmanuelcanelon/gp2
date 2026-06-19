// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.3,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential ease
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.95
    });

    // Update ScrollTrigger on scroll
    lenis.on('scroll', ScrollTrigger.update);

    // Sync Lenis with GSAP's requestAnimationFrame
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Disable lag smoothing for instant synchronization
    gsap.ticker.lagSmoothing(0);

    initZoomGalleryTimeline();
    initMouseParallax();
    initFloatingEmbers();
});

/* ==========================================================================
   1. MASTER ZOOM & HORIZONTAL GALLERY TIMELINE
   ========================================================================== */
function initZoomGalleryTimeline() {
    // Center layers initially
    gsap.set(".layer", { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    
    const layerFondo = document.getElementById('layer-fondo');
    const layerCielo = document.getElementById('layer-cielo');
    const layerCruz = document.getElementById('layer-cruz');
    const layerNubes = document.getElementById('layer-nubes');
    const galleryContainer = document.querySelector('.gallery-container');

    // Initialize vertical alignment in GSAP to avoid transform conflicts
    gsap.set(galleryContainer, { yPercent: -50 });

    // Master timeline driven by scrolling through the hero section wrapper
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".hero-section",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6, // Smooth scroll tracking
        }
    });

    // A. Zoom and fade out the cross (0.0 to 0.5 of the scroll duration)
    tl.to(layerCruz, {
        scale: 16,
        duration: 0.5,
        ease: "power1.in"
    }, 0);

    tl.to(layerCruz, {
        opacity: 0,
        duration: 0.35,
        ease: "power1.out"
    }, 0.15);

    // B. Transition background from waves (fondo) to sky (cielo) (0.15 to 0.55 of scroll)
    tl.to(layerFondo, {
        opacity: 0,
        scale: 1.1,
        duration: 0.4,
        ease: "power1.out"
    }, 0.15);

    tl.fromTo(layerCielo, {
        opacity: 0,
        scale: 1.0
    }, {
        opacity: 1,
        scale: 1.15,
        duration: 0.45,
        ease: "power1.out"
    }, 0.15);

    // Keep cielo slowly zooming after transition is complete
    tl.to(layerCielo, {
        scale: 1.25,
        duration: 0.4,
        ease: "none"
    }, 0.6);

    // C. Transition foreground clouds (nubes) rising up slightly (0.25 to 0.65 of scroll)
    tl.fromTo(layerNubes, {
        opacity: 0,
        y: "15vh",
        scale: 1.2
    }, {
        opacity: 1,
        y: "0vh",
        scale: 1.0,
        duration: 0.4,
        ease: "power1.out"
    }, 0.25);

    // D. Horizontal slide of the floating gallery cards (0.35 to 1.0 of scroll)
    tl.fromTo(galleryContainer, {
        x: 0,
        opacity: 0
    }, {
        x: () => {
            // Translate the container to the left until the last card is fully on screen
            return -(galleryContainer.offsetWidth - window.innerWidth);
        },
        opacity: 1,
        duration: 0.65,
        ease: "none" // Set to none for accurate scroll mapping in containerAnimation
    }, 0.35);

    // E. Dynamic 3D rotation and floating wave path for each card as they scroll horizontally
    const cards = gsap.utils.toArray('.art-card');
    cards.forEach((card) => {
        // Dynamically wrap card in a wrapper to isolate scroll transforms from hover transforms
        const wrapper = document.createElement('div');
        wrapper.className = 'art-card-wrapper';
        card.parentNode.insertBefore(wrapper, card);
        wrapper.appendChild(card);

        // Animate the wrapper's 3D rotation (Y-axis tilt), 2D rotation (Z-axis lean) and vertical drift
        gsap.fromTo(wrapper, {
            rotationY: 10,   // Face slightly right when entering
            rotationZ: 5,    // Lean right when entering
            y: 35            // Sink slightly when entering
        }, {
            rotationY: -10,  // Face slightly left when leaving
            rotationZ: -5,   // Lean left when leaving
            y: -35,          // Rise slightly when leaving
            ease: "sine.inOut",
            scrollTrigger: {
                trigger: wrapper,
                containerAnimation: tl, // Bind progress to the horizontal scroll progress of tl
                start: "left right",    // When left of wrapper enters viewport right
                end: "right left",      // When right of wrapper leaves viewport left
                scrub: true
            }
        });
    });
}

/* ==========================================================================
   2. INTERACTIVE MOUSE PARALLAX (TILT EFFECT)
   ========================================================================== */
function initMouseParallax() {
    let mouseX = 0;
    let mouseY = 0;
    
    // Listen for mouse movements
    window.addEventListener('mousemove', (e) => {
        // Normalize coordinates relative to window center (-0.5 to 0.5)
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
        
        updateLayersParallax();
    });
    
    // Smooth translation quickTo variables for lag/inertia physics
    const xToFondo = gsap.quickTo("#layer-fondo", "x", { duration: 0.6, ease: "power1.out" });
    const yToFondo = gsap.quickTo("#layer-fondo", "y", { duration: 0.6, ease: "power1.out" });
    
    const xToCielo = gsap.quickTo("#layer-cielo", "x", { duration: 0.6, ease: "power1.out" });
    const yToCielo = gsap.quickTo("#layer-cielo", "y", { duration: 0.6, ease: "power1.out" });
    
    const xToCruz = gsap.quickTo("#layer-cruz", "x", { duration: 0.8, ease: "power1.out" });
    const yToCruz = gsap.quickTo("#layer-cruz", "y", { duration: 0.8, ease: "power1.out" });

    const xToNubes = gsap.quickTo("#layer-nubes", "x", { duration: 1.0, ease: "power1.out" });
    const yToNubes = gsap.quickTo("#layer-nubes", "y", { duration: 1.0, ease: "power1.out" });

    function updateLayersParallax() {
        // Shift backgrounds slightly opposite to mouse movement to create depth
        xToFondo(mouseX * -15);
        yToFondo(mouseY * -15);
        
        xToCielo(mouseX * -12);
        yToCielo(mouseY * -12);
        
        // Shift cross in the direction of the mouse to make it float forward
        xToCruz(mouseX * 25);
        yToCruz(mouseY * 25);

        // Shift foreground clouds in direction of the mouse to make them float very close to camera
        xToNubes(mouseX * 35);
        yToNubes(mouseY * 35);
    }
}

/* ==========================================================================
   3. FLOATING EMBERS CANVAS BACKGROUND
   ========================================================================== */
function initFloatingEmbers() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Capture real mouse position in pixels for repulsion physics
    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    const particles = [];
    const count = 45; // Increased slightly for richer density
    
    class Ember {
        constructor() {
            this.reset();
            this.y = Math.random() * height;
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 20;
            this.vx = 0;
            this.vy = 0;
            this.size = Math.random() * 2.2 + 0.6;
            this.speedY = Math.random() * 0.45 + 0.15;
            this.opacity = Math.random() * 0.6 + 0.2;
            
            // Mix colors matching card borders: Cyan, Pink, Gold/Yellow, Green
            const colors = [
                'rgba(6, 182, 212,',  // Cyan
                'rgba(168, 85, 247,', // Pink/Purple
                'rgba(234, 179, 8,',  // Gold/Yellow
                'rgba(16, 185, 129,'  // Green
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            this.isStar = Math.random() > 0.6; // 40% are magical 4-point stars
            this.oscillationSpeed = Math.random() * 0.02 + 0.005;
            this.oscillationWidth = Math.random() * 1.2;
            this.angle = Math.random() * Math.PI;
        }
        
        update() {
            // Mouse Repulsion Physics
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 180) {
                const force = (180 - dist) / 180;
                const forceAngle = Math.atan2(dy, dx);
                // Push particles away gently
                this.vx += Math.cos(forceAngle) * force * 1.6;
                this.vy += Math.sin(forceAngle) * force * 1.6;
            }
            
            // Apply air friction/drag
            this.vx *= 0.93;
            this.vy *= 0.93;
            
            // Upward drift movement
            this.y -= this.speedY;
            
            // Apply velocities
            this.x += this.vx;
            this.y += this.vy;
            
            // Wave oscillation
            this.angle += this.oscillationSpeed;
            this.x += Math.sin(this.angle) * this.oscillationWidth;
            
            // Speed up particles slightly as scroll depth increases
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            this.y -= this.speedY * (scrollPercent * 3.0);
            
            // Recycle if particle exits top or sides of screen
            if (this.y < -20 || this.x < -20 || this.x > width + 20) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.shadowColor = this.color + '0.6)';
            ctx.shadowBlur = this.size * (this.isStar ? 3.5 : 2.5);
            
            if (this.isStar) {
                // Draw 4-point glowing star
                const s = this.size;
                ctx.moveTo(this.x, this.y - s * 2.2);
                ctx.quadraticCurveTo(this.x, this.y, this.x + s * 2.2, this.y);
                ctx.quadraticCurveTo(this.x, this.y, this.x, this.y + s * 2.2);
                ctx.quadraticCurveTo(this.x, this.y, this.x - s * 2.2, this.y);
                ctx.quadraticCurveTo(this.x, this.y, this.x, this.y - s * 2.2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw standard glowing circular ember
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Create embers
    for(let i = 0; i < count; i++) {
        particles.push(new Ember());
    }
    
    function loop() {
        ctx.clearRect(0, 0, width, height);
        ctx.shadowBlur = 0;
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(loop);
    }
    
    loop();
}
