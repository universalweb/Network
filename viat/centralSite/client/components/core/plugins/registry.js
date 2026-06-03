/*
 * User-facing plugin registry for app-level extension points (analytics,
 * telemetry, custom services). Framework subsystems (environment, etc.)
 * self-init via side-effect imports — they don't go through this.
 */
const plugins = new Map();
const ran = new WeakSet();
export function registerPlugin(pluginName, plugin) {
	if (typeof pluginName !== 'string' || !pluginName) {
		throw new TypeError('registerPlugin: pluginName must be a non-empty string');
	}
	if (!plugin || typeof plugin.init !== 'function') {
		throw new TypeError('registerPlugin: plugin must have an init() function');
	}
	plugins.set(pluginName, plugin);
}
export function getPlugin(pluginName) {
	return plugins.get(pluginName) ?? null;
}
export function listPlugins() {
	return [...plugins.keys()];
}
export async function runPlugins() {
	const pluginList = [...plugins.values()];
	for (let i = 0; i < pluginList.length; i++) {
		const plugin = pluginList[i];
		if (ran.has(plugin)) {
			continue;
		}
		ran.add(plugin);
		await plugin.init();
	}
}
