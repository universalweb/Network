export const stateMixin = (Base) => class extends Base {
	STATE = null;
	set state(value) { this.setState(value); }
	get state() { return this.STATE; }
	setState(state = {}) {
		this.STATE = state && typeof state === 'object' ? { ...state } : {};
		this.applyState();
		return this.STATE;
	}
	updateState(state = {}) {
		if (!this.STATE) this.STATE = {};
		if (state && typeof state === 'object' && state !== this.STATE) {
			const entries = Object.entries(state).filter(([, v]) => v !== undefined);
			if (entries.length) Object.assign(this.STATE, Object.fromEntries(entries));
		}
		this.applyState();
		return this.STATE;
	}
	onStateChange() {}
	applyState() {
		if (!this.state) return;
		this.onStateChange();
		if (this.isConnected) this.refresh();
	}
};
