/*
	DESCRIPTION: Preview-only carry-down showcase.
	Top owns ONE shared object (`shared.label`) and passes it down by reference
	via `.state=`. A root write flows down every descendant. A child primitive
	write (`this.state.label = …`) mirrors UP to the source and back down to
	siblings. Tree order does not matter — leaf is mounted before mid.
*/
import '../../global/button/button.js';
import '../../global/chip/chip.js';
import '../../global/input/input.js';
import { isString } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
export class DemoCarryLeaf extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		label: '',
	};
	render() {
		this.html`
			<div class="cd-pane" data-role="leaf">
				<span class="cd-kicker">leaf · first in tree · text only</span>
				<span class="cd-readout">${this.state.label}</span>
			</div>
		`;
	}
}
customElements.define('demo-carry-leaf', DemoCarryLeaf);
export class DemoCarryMid extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		label: '',
	};
	handleLabelInput(domEvent) {
		const next = domEvent.detail?.data?.value;
		if (!isString(next)) {
			return;
		}
		this.state.label = next;
	}
	render() {
		this.html`
			<div class="cd-pane" data-role="mid">
				<span class="cd-kicker">mid · child primitive write mirrors up</span>
				<ui-input
					.state.value=${this.state.label}
					.state.placeholder=${'Edit in the child'}
					@input:input=${this.handleLabelInput}></ui-input>
				<ui-chip .state.label=${this.state.label} .state.tone=${'accent'}></ui-chip>
				<span class="cd-readout">${this.state.label}</span>
			</div>
		`;
	}
}
customElements.define('demo-carry-mid', DemoCarryMid);
export class DemoCarryTop extends WebComponent {
	static url = import.meta.url;
	static styles = {
		carryDownDemo: './carry-down-demo.css',
	};
	static state = {
		shared: {
			label: 'Wallet',
		},
	};
	handleRootInput(domEvent) {
		const next = domEvent.detail?.data?.value;
		if (!isString(next)) {
			return;
		}
		this.state.shared.label = next;
	}
	handleSetAlpha() {
		this.state.shared.label = 'Alpha';
	}
	handleSetBeta() {
		this.state.shared.label = 'Beta';
	}
	render() {
		this.html`
			<div class="cd-demo">
				<div class="cd-pane" data-role="root">
					<span class="cd-kicker">root · ancestor write flows down</span>
					<ui-input
						.state.value=${this.state.shared.label}
						.state.placeholder=${'Edit at the root'}
						@input:input=${this.handleRootInput}></ui-input>
					<div class="cd-controls">
						<ui-button .state.label=${'Set Alpha'} .state.size=${'sm'} .state.tone=${'primary'} @button:click=${this.handleSetAlpha}></ui-button>
						<ui-button .state.label=${'Set Beta'} .state.size=${'sm'} .state.tone=${'neutral'} .state.variant=${'outline'} @button:click=${this.handleSetBeta}></ui-button>
					</div>
					<span class="cd-source">top source · shared.label = <b>${this.state.shared.label}</b></span>
				</div>
				<demo-carry-leaf .state=${this.state.shared}></demo-carry-leaf>
				<demo-carry-mid .state=${this.state.shared}></demo-carry-mid>
			</div>
		`;
	}
}
customElements.define('demo-carry-top', DemoCarryTop);
