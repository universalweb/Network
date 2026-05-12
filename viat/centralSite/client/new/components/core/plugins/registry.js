// User-facing plugin registry for app-level extension points (analytics,
// telemetry, custom services). Framework subsystems (environment, etc.)
// self-init via side-effect imports — they don't go through this.
const plugins = new Map();
const ran = new WeakSet();
export function registerPlugin(name, plugin) {
	if (typeof name !== 'string' || !name) {
		throw new TypeError('registerPlugin: name must be a non-empty string');
	}
	if (!plugin || typeof plugin.init !== 'function') {
		throw new TypeError('registerPlugin: plugin must have an init() function');
	}
	plugins.set(name, plugin);
}
export function getPlugin(name) {
	return plugins.get(name) ?? null;
}
export function listPlugins() {
	return [...plugins.keys()];
}
export async function runPlugins() {
	for (const [, plugin] of plugins) {
		if (ran.has(plugin)) {
			continue;
		}
		ran.add(plugin);
		await plugin.init();
	}
}
