/*
	DESCRIPTION: armLazy / onLazyVisible / syncLazy — one helper for media
	components that withhold construction or src until first onVisible.
	state.lazy default true; flipping lazy off loads now. Loaded never unloads.
	── USAGE ────────────────────────────────────────────────────────────
	  static state = { lazy: true, loaded: false, … };
	  onConnect() { this.observe('lazy', this.onLazyFlag); armLazy(this); }
	  onVisible() { onLazyVisible(this); }
	  onLazyFlag() { syncLazy(this); }
	─────────────────────────────────────────────────────────────────────
*/
export function armLazy(component) {
	if (component.state.lazy === false || component.state.loaded === true) {
		component.state.loaded = true;
	}
}
export function onLazyVisible(component) {
	if (component.state.loaded !== true) {
		component.state.loaded = true;
	}
}
export function syncLazy(component) {
	if (component.state.lazy === false) {
		component.state.loaded = true;
	}
}
