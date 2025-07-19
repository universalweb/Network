// --- Canvas Setup ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
function isMobile() {
	// The /i flag makes the search case-insensitive.
	if (navigator?.userAgentData?.mobile) {
		return true;
	} else {
		const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
		return mobileRegex.test(navigator.userAgent);
	}
}
// --- Configuration ---
const INITIAL_SHAPE_COUNT = isMobile() ? 5 : 20; // How many shape-clusters to generate initially
const BASE_SHAPE_SIZE = isMobile() ? 10 : 30; // The initial size of the shapes before they break apart
const PERSPECTIVE = 600; // The virtual distance from the viewer to the screen
const POINT_BASE_SPEED = 0.1; // The base speed for individual points
const DRIFT_FACTOR = 0.3; // How quickly shapes break apart. Higher = faster.
const MAX_LINK_DISTANCE = 90; // The max 3D distance to connect two points with a line
let points = []; // This will hold ALL points from all shapes
// --- Shape Definitions (used as templates) ---
const t = (1.0 + Math.sqrt(5.0)) / 2.0; // Golden ratio
const ICOSAHEDRON = {
	points: [
		{
			x: -1,
			y: t,
			z: 0,
		}, {
			x: 1,
			y: t,
			z: 0,
		}, {
			x: -1,
			y: -t,
			z: 0,
		}, {
			x: 1,
			y: -t,
			z: 0,
		}, {
			x: 0,
			y: -1,
			z: t,
		}, {
			x: 0,
			y: 1,
			z: t,
		}, {
			x: 0,
			y: -1,
			z: -t,
		}, {
			x: 0,
			y: 1,
			z: -t,
		}, {
			x: t,
			y: 0,
			z: -1,
		}, {
			x: t,
			y: 0,
			z: 1,
		}, {
			x: -t,
			y: 0,
			z: -1,
		}, {
			x: -t,
			y: 0,
			z: 1,
		},
	],
	edges: [
		[0, 11], [0, 5], [0, 1], [0, 7], [0, 10], [1, 5], [1, 7], [1, 8], [1, 9], [2, 3], [2, 4], [2, 6], [2, 10], [2, 11], [3, 4], [3, 6], [3, 8], [3, 9], [4, 5], [4, 9], [4, 11], [5, 9], [5, 11], [6, 7], [6, 8], [6, 10], [7, 8], [7, 10], [8, 9], [10, 11],
	],
};
const CUBE = {
	points: [
		{
			x: -1,
			y: -1,
			z: -1,
		}, {
			x: 1,
			y: -1,
			z: -1,
		}, {
			x: 1,
			y: 1,
			z: -1,
		}, {
			x: -1,
			y: 1,
			z: -1,
		}, {
			x: -1,
			y: -1,
			z: 1,
		}, {
			x: 1,
			y: -1,
			z: 1,
		}, {
			x: 1,
			y: 1,
			z: 1,
		}, {
			x: -1,
			y: 1,
			z: 1,
		},
	],
};
const MERKABAH = {
	points: [
		{
			x: 1,
			y: 1,
			z: 1,
		}, {
			x: 1,
			y: -1,
			z: -1,
		}, {
			x: -1,
			y: 1,
			z: -1,
		}, {
			x: -1,
			y: -1,
			z: 1,
		}, {
			x: -1,
			y: -1,
			z: -1,
		}, {
			x: -1,
			y: 1,
			z: 1,
		}, {
			x: 1,
			y: -1,
			z: 1,
		}, {
			x: 1,
			y: 1,
			z: -1,
		},
	],
};
const phi = (1 + Math.sqrt(5)) / 2;
const BUCKYBALL = {
	points: [
		{
			x: 0,
			y: 1,
			z: 3 * phi,
		}, {
			x: 0,
			y: 1,
			z: -3 * phi,
		}, {
			x: 0,
			y: -1,
			z: 3 * phi,
		}, {
			x: 0,
			y: -1,
			z: -3 * phi,
		}, {
			x: 1,
			y: 3 * phi,
			z: 0,
		}, {
			x: 1,
			y: -3 * phi,
			z: 0,
		}, {
			x: -1,
			y: 3 * phi,
			z: 0,
		}, {
			x: -1,
			y: -3 * phi,
			z: 0,
		}, {
			x: 2 * phi,
			y: phi,
			z: 0,
		}, {
			x: 2 * phi,
			y: -phi,
			z: 0,
		}, {
			x: -2 * phi,
			y: phi,
			z: 0,
		}, {
			x: -2 * phi,
			y: -phi,
			z: 0,
		}, {
			x: phi,
			y: 0,
			z: 2 * phi,
		}, {
			x: phi,
			y: 0,
			z: -2 * phi,
		}, {
			x: -phi,
			y: 0,
			z: 2 * phi,
		}, {
			x: -phi,
			y: 0,
			z: -2 * phi,
		}, {
			x: 0,
			y: 2 * phi,
			z: phi,
		}, {
			x: 0,
			y: 2 * phi,
			z: -phi,
		}, {
			x: 0,
			y: -2 * phi,
			z: phi,
		}, {
			x: 0,
			y: -2 * phi,
			z: -phi,
		}, {
			x: 1,
			y: 2 + phi,
			z: 2 * phi,
		}, {
			x: 1,
			y: 2 + phi,
			z: -2 * phi,
		}, {
			x: 1,
			y: -(2 + phi),
			z: 2 * phi,
		}, {
			x: 1,
			y: -(2 + phi),
			z: -2 * phi,
		}, {
			x: -1,
			y: 2 + phi,
			z: 2 * phi,
		}, {
			x: -1,
			y: 2 + phi,
			z: -2 * phi,
		}, {
			x: -1,
			y: -(2 + phi),
			z: 2 * phi,
		}, {
			x: -1,
			y: -(2 + phi),
			z: -2 * phi,
		}, {
			x: 2 * phi,
			y: 1 + 2 * phi,
			z: phi,
		}, {
			x: 2 * phi,
			y: 1 + 2 * phi,
			z: -phi,
		}, {
			x: 2 * phi,
			y: -(1 + 2 * phi),
			z: phi,
		}, {
			x: 2 * phi,
			y: -(1 + 2 * phi),
			z: -phi,
		}, {
			x: -2 * phi,
			y: 1 + 2 * phi,
			z: phi,
		}, {
			x: -2 * phi,
			y: 1 + 2 * phi,
			z: -phi,
		}, {
			x: -2 * phi,
			y: -(1 + 2 * phi),
			z: phi,
		}, {
			x: -2 * phi,
			y: -(1 + 2 * phi),
			z: -phi,
		}, {
			x: 1 + 2 * phi,
			y: phi,
			z: 1 + phi,
		}, {
			x: 1 + 2 * phi,
			y: phi,
			z: -(1 + phi),
		}, {
			x: 1 + 2 * phi,
			y: -phi,
			z: 1 + phi,
		}, {
			x: 1 + 2 * phi,
			y: -phi,
			z: -(1 + phi),
		}, {
			x: -(1 + 2 * phi),
			y: phi,
			z: 1 + phi,
		}, {
			x: -(1 + 2 * phi),
			y: phi,
			z: -(1 + phi),
		}, {
			x: -(1 + 2 * phi),
			y: -phi,
			z: 1 + phi,
		}, {
			x: -(1 + 2 * phi),
			y: -phi,
			z: -(1 + phi),
		}, {
			x: phi,
			y: 1 + phi,
			z: 1 + 2 * phi,
		}, {
			x: phi,
			y: 1 + phi,
			z: -(1 + 2 * phi),
		}, {
			x: phi,
			y: -(1 + phi),
			z: 1 + 2 * phi,
		}, {
			x: phi,
			y: -(1 + phi),
			z: -(1 + 2 * phi),
		}, {
			x: -phi,
			y: 1 + phi,
			z: 1 + 2 * phi,
		}, {
			x: -phi,
			y: 1 + phi,
			z: -(1 + 2 * phi),
		}, {
			x: -phi,
			y: -(1 + phi),
			z: 1 + 2 * phi,
		}, {
			x: -phi,
			y: -(1 + phi),
			z: -(1 + 2 * phi),
		}, {
			x: 1 + phi,
			y: 1 + 2 * phi,
			z: 0,
		}, {
			x: 1 + phi,
			y: -(1 + 2 * phi),
			z: 0,
		}, {
			x: -(1 + phi),
			y: 1 + 2 * phi,
			z: 0,
		}, {
			x: -(1 + phi),
			y: -(1 + 2 * phi),
			z: 0,
		},
	].map((p) => {
		const d = 1 / (3 * phi);
		return {
			x: p.x * d,
			y: p.y * d,
			z: p.z * d,
		};
	}),
};
const SHAPE_TEMPLATES = [
	CUBE, MERKABAH, BUCKYBALL, ICOSAHEDRON,
];
// --- Utility Functions ---
function setCanvasSize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
// --- Point Class (replaces Shape class) ---
class Point {
	constructor(x, y, z, vx, vy, vz) {
		this.x = x; this.y = y; this.z = z;
		this.vx = vx; this.vy = vy; this.vz = vz;
		this.projected = {}; // Will hold 2D projected coordinates
	}
	update() {
		this.x += this.vx; this.y += this.vy; this.z += this.vz;
		// Bounce off the walls of the 3D space
		if (this.x < -canvas.width / 2 || this.x > canvas.width / 2) {
			this.vx *= -1;
		}
		if (this.y < -canvas.height / 2 || this.y > canvas.height / 2) {
			this.vy *= -1;
		}
		if (this.z < -PERSPECTIVE || this.z > PERSPECTIVE) {
			this.vz *= -1;
		}
	}
	project() {
		const scale = PERSPECTIVE / (PERSPECTIVE + this.z);
		this.projected = {
			x: this.x * scale + canvas.width / 2,
			y: this.y * scale + canvas.height / 2,
			scale,
		};
	}
	draw() {
		const p = this.projected;
		const opacity = Math.max(0, p.scale * 0.9).toFixed(2);
		const pointSize = Math.max(0, p.scale * 2.5);
		ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
		ctx.beginPath();
		ctx.arc(p.x, p.y, pointSize, 0, Math.PI * 2);
		ctx.fill();
	}
}
// --- Core Logic ---
function init() {
	setCanvasSize();
	points = [];
	// Create initial shape clusters
	for (let i = 0; i < INITIAL_SHAPE_COUNT; i++) {
		const shapeTemplate = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
		// Cluster center and base velocity
		const cx = (Math.random() - 0.5) * canvas.width * 0.5;
		const cy = (Math.random() - 0.5) * canvas.height * 0.5;
		const cz = (Math.random() - 0.5) * PERSPECTIVE;
		const base_vx = (Math.random() - 0.5) * POINT_BASE_SPEED;
		const base_vy = (Math.random() - 0.5) * POINT_BASE_SPEED;
		const base_vz = (Math.random() - 0.5) * POINT_BASE_SPEED;
		// Create points from the chosen template
		shapeTemplate.points.forEach((p_template) => {
			const x = cx + p_template.x * BASE_SHAPE_SIZE;
			const y = cy + p_template.y * BASE_SHAPE_SIZE;
			const z = cz + p_template.z * BASE_SHAPE_SIZE;
			// Give each point an outward "drift" velocity from its shape's center
			const vx = base_vx + p_template.x * DRIFT_FACTOR;
			const vy = base_vy + p_template.y * DRIFT_FACTOR;
			const vz = base_vz + p_template.z * DRIFT_FACTOR;
			points.push(new Point(x, y, z, vx, vy, vz));
		});
	}
}
function connectPoints() {
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			const p1 = points[i];
			const p2 = points[j];
			const dx = p1.x - p2.x;
			const dy = p1.y - p2.y;
			const dz = p1.z - p2.z;
			const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
			if (distance < MAX_LINK_DISTANCE) {
				const opacity = 1 - (distance / MAX_LINK_DISTANCE);
				ctx.beginPath();
				ctx.moveTo(p1.projected.x, p1.projected.y);
				ctx.lineTo(p2.projected.x, p2.projected.y);
				ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}
	}
}
function animate() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Update, project, and draw each individual point
	points.forEach((p) => {
		p.update();
		p.project();
		p.draw();
	});
	// Connect nearby points
	connectPoints();
	requestAnimationFrame(animate);
}
// --- Event Listeners and Execution ---
// if (!isMobile()) {
// 	window.addEventListener('resize', init);
// 	init();
// 	animate();
// }
window.addEventListener('resize', init);
init();
animate();
