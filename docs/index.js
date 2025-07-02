// --- Canvas and Particle Animation Logic --
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
// --- Configuration ---
const PARTICLE_COUNT = 150;
const MAX_LINK_DISTANCE = 100;
const PARTICLE_SPEED = 0.7;
const PARTICLE_COLOR = 'rgba(255, 0, 255, 0.9)';
const LINE_COLOR_BASE = 'rgba(0, 255, 255, 0.5)';
let particles = [];
// --- Utility Functions ---
function setCanvasSize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
// --- Particle Class ---
class Particle {
	constructor() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.vx = (Math.random() - 0.5) * PARTICLE_SPEED;
		this.vy = (Math.random() - 0.5) * PARTICLE_SPEED;
		this.size = Math.random() * 2 + 1;
	}
	// Update particle position and handle wall collisions
	update() {
		this.x += this.vx;
		this.y += this.vy;
		// Bounce off edges
		if (this.x < 0 || this.x > canvas.width) {
			this.vx *= -1;
		}
		if (this.y < 0 || this.y > canvas.height) {
			this.vy *= -1;
		}
	}
	// Draw the particle on the canvas as a square
	draw() {
		ctx.fillStyle = PARTICLE_COLOR;
		// Use fillRect to draw squares instead of circles (arc)
		ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
	}
}
// --- Core Animation Logic ---
// Initialize particles
function init() {
	setCanvasSize();
	particles = [];
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		particles.push(new Particle());
	}
}
// Connect particles with lines if they are close enough
function connectParticles() {
	for (let i = 0; i < particles.length; i++) {
		for (let j = i + 1; j < particles.length; j++) {
			const dx = particles[i].x - particles[j].x;
			const dy = particles[i].y - particles[j].y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance < MAX_LINK_DISTANCE) {
				// Calculate opacity based on distance
				const opacity = 1 - (distance / MAX_LINK_DISTANCE);
				ctx.beginPath();
				ctx.moveTo(particles[i].x, particles[i].y);
				ctx.lineTo(particles[j].x, particles[j].y);
				// Add a 'glitchy' flicker effect to the lines
				ctx.strokeStyle = `${LINE_COLOR_BASE}${opacity * Math.random() + 0.1})`;
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}
	}
}
// The main animation loop
function animate() {
	// Clear the canvas for the next frame
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Update and draw each particle
	particles.forEach((p) => {
		p.update();
		p.draw();
	});
	// Draw the connecting lines
	connectParticles();
	// Request the next frame
	requestAnimationFrame(animate);
}
// --- Event Listeners ---
// Handle window resizing
window.addEventListener('resize', () => {
	// Re-initialize on resize to adjust particle positions
	init();
});
function isMobile() {
	// The /i flag makes the search case-insensitive.
	const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
	return mobileRegex.test(navigator.userAgent);
}
if (!isMobile()) {
	init();
	animate();
}
