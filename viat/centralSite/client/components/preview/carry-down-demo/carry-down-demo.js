import { WebComponent } from 'webcomponent';
/*
 * Carry-down showcase — mirrors the live GlobalDock → UIDock → DockIconButton
 * chain. `demo-carry-top` owns ONE shared object (`payload.items`) and passes it
 * down by reference via `.state=`; `demo-carry-mid` renders that array through
 * `this.list()`. A button mutates `payload.items[N].tooltip` at the TOP — an
 * ANCESTOR-origin deep write — and the leaf two boundaries below re-renders,
 * proving the `.state=` carrier bridges deep mutations to every component that
 * holds the shared object (without it, only the top's own readout would update).
 */
export class DemoCarryLeaf extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		id: '',
		tooltip: '',
	};
	render() {
		this.html`<span class="cd-leaf">${this.state.tooltip}</span>`;
	}
}
customElements.define('demo-carry-leaf', DemoCarryLeaf);
export class DemoCarryMid extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		items: [],
	};
	render() {
		this.html`<div class="cd-row">${this.list('items', DemoCarryLeaf)}</div>`;
	}
}
customElements.define('demo-carry-mid', DemoCarryMid);
export class DemoCarryTop extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		payload: {
			items: [
				{
					id: 'wallet',
					tooltip: 'Wallet',
				},
				{
					id: 'explorer',
					tooltip: 'Explorer',
				},
				{
					id: 'swap',
					tooltip: 'Swap',
				},
			],
		},
		bumps: 0,
	};
	bumpFirst() {
		const next = this.state.bumps + 1;
		/* Ancestor-origin deep write into the SHARED object — the carrier forwards
		   it to demo-carry-mid's list spot, which force-assigns the leaf. */
		this.state.payload.items[0].tooltip = `Wallet ${next}`;
		this.state.bumps = next;
	}
	bumpAll() {
		const next = this.state.bumps + 1;
		const items = this.state.payload.items;
		for (let index = 0; index < items.length; index += 1) {
			items[index].tooltip = `${items[index].id} ${next}`;
		}
		this.state.bumps = next;
	}
	readFirst() {
		return this.state.payload.items[0].tooltip;
	}
	render() {
		this.html`
			<div class="cd-demo">
				<div class="cd-controls">
					<button class="cd-btn" @click=${this.bumpFirst}>mutate items[0] at the top</button>
					<button class="cd-btn" @click=${this.bumpAll}>mutate all</button>
				</div>
				<div class="cd-source">top source · items[0].tooltip = <b>${this.readFirst}</b></div>
				<demo-carry-mid .state=${this.state.payload}></demo-carry-mid>
			</div>
		`;
	}
}
customElements.define('demo-carry-top', DemoCarryTop);
