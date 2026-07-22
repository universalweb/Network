import { WebComponent } from '../../core/index.js';
export class UISurface extends WebComponent {
	static url = import.meta.url;
	static styles = {
		surface: './surface.css',
	};
	static state = {
		tone: 'panel',
		padding: 'md',
		radius: 'md',
		elevation: '0',
		border: false,
		interactive: false,
	};
	render() {
		/* Enumerated dims → data-* ATTRIBUTES. This supersedes the old `sf-`
		   class-prefix workaround: an attribute selector can't be matched by the
		   uwc.util `.surface`/`.tone-*` class utilities at all, so the tones are
		   self-owned without needing a private namespace. (util's `[data-tone]`
		   rules set only `--tone-fill`, which surface ignores — no conflict.) */
		this.html`
			<div
				class="sf"
				data-tone=${this.state.tone}
				data-pad=${this.state.padding}
				data-radius=${this.state.radius}
				data-elev=${this.state.elevation}
				?data-border=${this.state.border}
				?data-interactive=${this.state.interactive}>
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-surface', UISurface);
