(() => {
    'use strict';

    /**
     * Configuration Constants
     */
    const CONFIG = {
        GRADUATION_ISO: '2025-12-31T12:00:00', // Ensure this is ISO 8601 compliant
        UPDATE_INTERVAL_MS: 1000,
        ANIMATION: {
            MAX_CONFETTI: 200,
            MAX_BALLOONS: 25,
            MAX_FIREWORK_ROCKETS: 5,
            MAX_FIREWORK_SPARKS: 500 // Limit total sparks for performance
        },
        COLORS: {
            CONFETTI: ['#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF4500', '#FFFFFF', '#BA55D3', '#FFA500'],
            FIREWORK: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'],
            BALLOON: ['#FF6347', '#4682B4', '#3CB371', '#FFD700', '#DB7093', '#87CEEB', '#90EE90']
        }
    };

    /**
     * Utility Functions
     */
    const Utils = {
        randItem: arr => arr[Math.floor(Math.random() * arr.length)],
        clamp: (val, min, max) => Math.min(Math.max(val, min), max),
        padTime: num => String(num).padStart(2, '0'),
        // Robust date parsing handling timezones if needed, though Date constructor is usually fine for ISO
        parseDate: (isoString) => new Date(isoString).getTime()
    };

    /**
     * Object Pool Pattern
     * Reuses objects to prevent Garbage Collection stuttering.
     */
    class ObjectPool {
        constructor(createFn, maxSize) {
            this.createFn = createFn;
            this.pool = [];
            this.active = [];
            this.maxSize = maxSize;
        }

        get() {
            if (this.pool.length > 0) {
                const obj = this.pool.pop();
                this.active.push(obj);
                return obj;
            }
            if (this.active.length < this.maxSize) {
                const obj = this.createFn();
                this.active.push(obj);
                return obj;
            }
            return null; // Pool exhausted
        }

        release(obj) {
            const index = this.active.indexOf(obj);
            if (index > -1) {
                this.active.splice(index, 1);
                this.pool.push(obj);
            }
        }

        // Iterate only over active objects
        forEachActive(callback) {
            // Iterate backwards to allow safe removal during iteration
            for (let i = this.active.length - 1; i >= 0; i--) {
                callback(this.active[i], i);
            }
        }
    }

    /**
     * Particle Classes
     */
    class ConfettiParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.size = Math.random() * 10 + 5;
            this.heightScale = Math.random() * 0.5 + 0.5;
            this.x = Math.random() * window.innerWidth;
            this.y = initial ? Math.random() * window.innerHeight : -this.size - Math.random() * 40;
            this.color = Utils.randItem(CONFIG.COLORS.CONFETTI);
            this.weight = Math.random() * 0.5 + 0.2;
            this.angle = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
            this.opacity = 1;
            this.drift = Math.random() * 2 - 1;
            this.active = true;
        }

        update(ctx) {
            if (!this.active) return;
            this.y += this.weight * 3;
            this.x += Math.sin(this.angle + this.y * 0.05) + this.drift;
            this.angle += this.rotationSpeed;
            this.weight += 0.004;
            this.opacity -= 0.003;

            if (this.y > window.innerHeight + this.size || this.opacity <= 0) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * this.heightScale);
            ctx.restore();
        }
    }

    class FireworkSpark {
        constructor() {
            this.reset(0, 0, '#fff');
        }

        reset(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.1;
            this.lifespan = Math.random() * 60 + 60;
            this.maxLifespan = this.lifespan;
            this.size = Math.random() * 2 + 1;
            this.color = color;
            this.opacity = 1;
            this.active = true;
        }

        update() {
            if (!this.active) return;
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.lifespan--;
            this.opacity = Utils.clamp(this.lifespan / 100, 0, 1);

            if (this.lifespan <= 0) {
                this.active = false; // Mark for release
            }
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class FireworkRocket {
        constructor(sparkPool) {
            this.sparkPool = sparkPool;
            this.reset();
        }

        reset() {
            this.x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
            this.y = window.innerHeight;
            this.targetY = Math.random() * (window.innerHeight / 2) + (window.innerHeight / 10);
            this.speed = Math.random() * 3 + 4;
            this.color = Utils.randItem(CONFIG.COLORS.FIREWORK);
            this.size = 3;
            this.trail = []; // Keep simple array for trail, short lived
            this.active = true;
        }

        update() {
            if (!this.active) return;
            this.y -= this.speed;
            this.trail.push({ x: this.x, y: this.y, opacity: 1 });

            if (this.trail.length > 10) this.trail.shift();

            this.trail.forEach(t => (t.opacity -= 0.1));
            // Filter in place or just let them fade visually? Filter is okay for small array (10 items)
            this.trail = this.trail.filter(t => t.opacity > 0);

            if (this.y <= this.targetY) {
                this.explode();
                this.reset(); // Auto restart for continuous show
            }
        }

        explode() {
            const count = Math.floor(Math.random() * 50) + 50; // Reduced count per explosion for perf
            for (let i = 0; i < count; i++) {
                const spark = this.sparkPool.get();
                if (spark) {
                    spark.reset(this.x, this.y, this.color);
                }
            }
        }

        draw(ctx) {
            if (!this.active) return;
            this.trail.forEach(p => {
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = this.color;
                ctx.fillRect(p.x - this.size / 2, p.y - this.size / 2, this.size, this.size);
            });

            ctx.globalAlpha = 1;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        }
    }

    class Balloon {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * window.innerWidth;
            this.y = initial
                ? Math.random() * window.innerHeight
                : window.innerHeight + Math.random() * 120 + 50;
            this.radiusX = Math.random() * 20 + 25;
            this.radiusY = this.radiusX * (Math.random() * 0.2 + 1.1);
            this.speedY = Math.random() * 1 + 1;
            this.swayFactor = Math.random() * 0.02 + 0.01;
            this.swayOffset = Math.random() * Math.PI * 2;
            this.color = Utils.randItem(CONFIG.COLORS.BALLOON);
            this.stringLength = Math.random() * 50 + 50;
            this.opacity = 0.85;
            this.lifespan = Math.random() * 300 + 300;
            this.active = true;
        }

        update() {
            if (!this.active) return;
            this.y -= this.speedY;
            this.x += Math.sin(this.swayOffset + this.y * this.swayFactor) * 1.5;
            this.lifespan--;

            if (this.y < -this.radiusY * 2 || this.lifespan <= 0) {
                this.reset();
            }
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;

            // Balloon body
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.ellipse(this.x - this.radiusX * 0.3, this.y - this.radiusY * 0.4, this.radiusX * 0.3, this.radiusY * 0.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fill();

            // String
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.radiusY * 0.9);
            const endX = this.x + Math.sin(this.swayOffset + this.y * this.swayFactor * 2) * 10;
            ctx.lineTo(endX, this.y + this.radiusY + this.stringLength);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        }
    }

    /**
     * Particle System Manager
     */
    class ParticleSystem {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d', { alpha: true }); // Optimize context
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.isRunning = false;
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Pools
            this.confettiPool = new ObjectPool(() => new ConfettiParticle(), CONFIG.ANIMATION.MAX_CONFETTI);
            this.sparkPool = new ObjectPool(() => new FireworkSpark(), CONFIG.ANIMATION.MAX_FIREWORK_SPARKS);
            this.rocketPool = new ObjectPool(() => new FireworkRocket(this.sparkPool), CONFIG.ANIMATION.MAX_FIREWORK_ROCKETS);
            this.balloonPool = new ObjectPool(() => new Balloon(), CONFIG.ANIMATION.MAX_BALLOONS);

            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        start() {
            if (this.reducedMotion) return; // Don't animate if reduced motion is preferred
            this.isRunning = true;
            this.loop();

            // Initialize particles
            for (let i = 0; i < CONFIG.ANIMATION.MAX_CONFETTI; i++) this.confettiPool.get();
            for (let i = 0; i < CONFIG.ANIMATION.MAX_FIREWORK_ROCKETS; i++) this.rocketPool.get();
            for (let i = 0; i < CONFIG.ANIMATION.MAX_BALLOONS; i++) this.balloonPool.get();
        }

        stop() {
            this.isRunning = false;
        }

        loop() {
            if (!this.isRunning) return;

            this.ctx.clearRect(0, 0, this.width, this.height);

            // Draw Sparks (Lighter blend mode)
            this.ctx.globalCompositeOperation = 'lighter';
            this.sparkPool.forEachActive((spark) => {
                spark.update();
                spark.draw(this.ctx);
                if (!spark.active) this.sparkPool.release(spark);
            });

            // Draw others (Source Over)
            this.ctx.globalCompositeOperation = 'source-over';

            this.rocketPool.forEachActive((rocket) => {
                rocket.update();
                rocket.draw(this.ctx);
            });

            this.confettiPool.forEachActive((p) => {
                p.update(this.ctx);
                p.draw(this.ctx);
            });

            this.balloonPool.forEachActive((b) => {
                b.update(this.ctx);
                b.draw(this.ctx);
            });

            requestAnimationFrame(() => this.loop());
        }
    }

    /**
     * Countdown Logic
     */
    class CountdownTimer {
        constructor(targetDate, onTick, onComplete) {
            this.targetTime = Utils.parseDate(targetDate);
            this.onTick = onTick;
            this.onComplete = onComplete;
            this.timerId = null;
        }

        start() {
            this.tick();
            // Use setInterval for simplicity, but check drift in tick
            this.timerId = setInterval(() => this.tick(), CONFIG.UPDATE_INTERVAL_MS);
            
            // Handle tab visibility to save resources
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(this.timerId);
                } else {
                    this.tick(); // Immediate update
                    this.timerId = setInterval(() => this.tick(), CONFIG.UPDATE_INTERVAL_MS);
                }
            });
        }

        tick() {
            const now = Date.now();
            const diff = this.targetTime - now;

            if (diff <= 0) {
                this.stop();
                this.onComplete();
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            this.onTick({ days, hours, minutes, seconds });
        }

        stop() {
            if (this.timerId) clearInterval(this.timerId);
        }
    }

    /**
     * UI Manager
     */
    class UIManager {
        constructor() {
            this.dom = {
                header: document.getElementById('countdown-header'),
                countdownSection: document.getElementById('countdown'),
                graduationMessageSection: document.getElementById('graduation-message'),
                days: document.getElementById('countdown-days'),
                hours: document.getElementById('countdown-hours'),
                minutes: document.getElementById('countdown-minutes'),
                seconds: document.getElementById('countdown-seconds'),
                body: document.body
            };
        }

        updateTime({ days, hours, minutes, seconds }) {
            this.dom.days.textContent = Utils.padTime(days);
            this.dom.hours.textContent = Utils.padTime(hours);
            this.dom.minutes.textContent = Utils.padTime(minutes);
            this.dom.seconds.textContent = Utils.padTime(seconds);
        }

        showCelebration() {
            this.dom.header.classList.add('is-hidden');
            this.dom.countdownSection.classList.add('is-hidden');
            this.dom.graduationMessageSection.classList.remove('is-hidden');
            
            // Trigger background animation
            this.dom.body.style.background = 'linear-gradient(135deg, var(--gradient-end), var(--gradient-mid), #FFD700)';
            this.dom.body.style.backgroundSize = '400% 400%';
            this.dom.body.style.animation = 'gradientAnimation 10s ease infinite alternate';
        }
    }

    /**
     * Main Application
     */
    class App {
        constructor() {
            this.ui = new UIManager();
            this.particles = new ParticleSystem('confetti-canvas');
            this.timer = new CountdownTimer(
                CONFIG.GRADUATION_ISO,
                (time) => this.ui.updateTime(time),
                () => this.startCelebration()
            );
        }

        init() {
            this.timer.start();
        }

        startCelebration() {
            this.ui.showCelebration();
            this.particles.start();
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });

})();
