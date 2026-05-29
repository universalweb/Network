import { WebComponent } from 'webcomponent';
import '../../global/dock/dock.js';
// `<global-dock>` — the Viat navigation rail. A thin composition over the
// built-in `<ui-dock>`: it supplies the six section items and owns the router
// coupling — the `dockSelect` event and `observeGlobal('routeSection')` both
// drive `<ui-dock>`'s `activeId`. The built-in never reads the router.
export class GlobalDock extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalDock: './global-dock.css',
	};
	static state = {
		dock: {
			// A complete config — `global-dock` mutates `activeId`, which
			// re-applies `.state=` on a patch pass; a re-applied `.state=`
			// wholesale-replaces, so every key the built-in needs must be here.
			activeId: '',
			orientation: 'vertical',
			showActiveBar: true,
			items: [
				{
					id: 'wallet',
					icon: 'wallet',
					tooltip: 'Wallet',
					animate: 'wallet',
					onClick: 'dockSelect',
				},
				{
					id: 'explorer',
					icon: 'compass',
					tooltip: 'Explorer',
					animate: 'explorer',
					onClick: 'dockSelect',
				},
				{
					id: 'accounts',
					icon: 'users',
					tooltip: 'Accounts',
					animate: 'accounts',
					onClick: 'dockSelect',
				},
				{
					id: 'swap',
					icon: 'repeat-2',
					tooltip: 'Swap',
					animate: 'swap',
					onClick: 'dockSelect',
				},
				{
					id: 'exchange',
					icon: 'arrow-right-left',
					tooltip: 'Exchange (Coming Soon)',
					onClick: 'dockSelect',
				},
				{
					id: 'analytics',
					icon: 'chart-line',
					tooltip: 'Analytics (Coming Soon)',
					onClick: 'dockSelect',
				},
			],
		},
	};
	onConnect() {
		// Router coupling lives here, never in the built-in. A click
		// optimistically highlights; the router's routeSection then reconciles.
		this.delegate('dockSelect', this.handleDockSelect);
		this.observeGlobal('routeSection', (sectionId) => {
			this.state.dock.activeId = sectionId || '';
		});
	}
	handleDockSelect(domEvent) {
		const source = domEvent.detail?.source;
		const id = source?.state?.id;
		if (id) {
			this.state.dock.activeId = id;
		}
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `<ui-dock .state=${this.state.dock}></ui-dock>`;
	}
}
customElements.define('global-dock', GlobalDock);
