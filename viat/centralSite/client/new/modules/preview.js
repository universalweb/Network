import '../components/index.js';
import { WebComponent } from '../components/core/index.js';
class PreviewView extends WebComponent {
	static id = 'preview-view';
	static url = import.meta.url;
	static styles = {
		preview: './preview.css',
	};
	static state = {
		emailValue: '',
		searchValue: '',
		amountValue: '',
		clickCount: 0,
		spinDemo: false,
		badgeCount: 1,
	};
	static async create(state, config) {
		const view = new this(await state, config);
		await WebComponent.preRender(view, document.body);
		return view;
	}
	bumpClick() {
		this.state.clickCount = this.state.clickCount + 1;
	}
	bumpBadge() {
		this.state.badgeCount = this.state.badgeCount + 1;
	}
	toggleSpin() {
		this.state.spinDemo = !this.state.spinDemo;
	}
	syncEmail(domEvent) {
		this.state.emailValue = domEvent.detail.data.value;
	}
	syncSearch(domEvent) {
		this.state.searchValue = domEvent.detail.data.value;
	}
	syncAmount(domEvent) {
		this.state.amountValue = domEvent.detail.data.value;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="preview">
				<header class="preview-head">
					<ui-text variant="display" tone="accent">UI Component Preview</ui-text>
					<ui-text variant="caption" tone="muted">tier-0 atoms · viat / universal-web-components</ui-text>
				</header>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UISurface</ui-text>
						<ui-text variant="caption" tone="muted">tones · padding · radius · elevation · interactive</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<div class="grid">
							<ui-surface .state=${{ tone: 'panel',  padding: 'md', radius: 'md' }}><ui-text variant="caption" tone="muted">panel</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'subtle', padding: 'md', radius: 'md' }}><ui-text variant="caption" tone="muted">subtle</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'popup',  padding: 'md', radius: 'md' }}><ui-text variant="caption" tone="muted">popup</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'success', padding: 'md', radius: 'md' }}><ui-text variant="caption" tone="muted">success</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'danger',  padding: 'md', radius: 'md' }}><ui-text variant="caption" tone="muted">danger</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'accent', padding: 'md', radius: 'md', elevation: '2' }}><ui-text variant="caption" tone="muted">accent · elev 2</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'panel', padding: 'md', radius: 'md', elevation: '3', border: true }}><ui-text variant="caption" tone="muted">panel · elev 3 · border</ui-text></ui-surface>
							<ui-surface .state=${{ tone: 'panel', padding: 'md', radius: 'md', interactive: true, border: true }}><ui-text variant="caption" tone="muted">interactive · hover</ui-text></ui-surface>
						</div>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIStack</ui-text>
						<ui-text variant="caption" tone="muted">flex layout · direction · gap · align · justify</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<div class="cluster">
							<ui-surface .state=${{ tone: 'subtle', padding: 'md', radius: 'md' }}>
								<ui-stack .state=${{ direction: 'row', gap: 'sm' }}>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{ tone: 'subtle', padding: 'md', radius: 'md' }}>
								<ui-stack .state=${{ direction: 'column', gap: 'md' }}>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{ tone: 'subtle', padding: 'md', radius: 'md' }}>
								<ui-stack .state=${{ direction: 'row', gap: 'lg', justify: 'between' }}>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{ tone: 'accent', padding: 'sm', radius: 'sm' }}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
						</div>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIText</ui-text>
						<ui-text variant="caption" tone="muted">variants · tones</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'column', gap: 'sm' }}>
							<ui-text variant="display">Display heading</ui-text>
							<ui-text variant="h1">Heading 1</ui-text>
							<ui-text variant="h2">Heading 2</ui-text>
							<ui-text variant="h3" tone="accent">Heading 3 · accent</ui-text>
							<ui-text variant="body">Body copy stays readable at the comfortable default size.</ui-text>
							<ui-text variant="caption" tone="muted">Caption · muted tone for secondary info</ui-text>
							<ui-text variant="overline" tone="accent">overline · uppercase tracker</ui-text>
							<ui-text variant="mono">monospace_for_addresses_and_codes</ui-text>
							<ui-text variant="body" tone="success">success</ui-text>
							<ui-text variant="body" tone="warning">warning</ui-text>
							<ui-text variant="body" tone="danger">danger</ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIIcon</ui-text>
						<ui-text variant="caption" tone="muted">sizes · tones · spin</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'row', gap: 'lg', align: 'center', wrap: true }}>
							<ui-icon .state=${{ name: 'star', size: 'xs', tone: 'accent' }}></ui-icon>
							<ui-icon .state=${{ name: 'star', size: 'sm', tone: 'accent' }}></ui-icon>
							<ui-icon .state=${{ name: 'star', size: 'md', tone: 'accent' }}></ui-icon>
							<ui-icon .state=${{ name: 'star', size: 'lg', tone: 'accent' }}></ui-icon>
							<ui-icon .state=${{ name: 'star', size: 'xl', tone: 'accent' }}></ui-icon>
							<ui-icon .state=${{ name: 'circle-check', size: 'lg', tone: 'success' }}></ui-icon>
							<ui-icon .state=${{ name: 'triangle-alert', size: 'lg', tone: 'warning' }}></ui-icon>
							<ui-icon .state=${{ name: 'circle-x', size: 'lg', tone: 'danger' }}></ui-icon>
							<ui-icon .state=${{ name: 'loader-circle', size: 'lg', spin: this.state.spinDemo }}></ui-icon>
							<ui-button .state=${{ label: this.state.spinDemo ? 'Stop' : 'Spin', tone: 'primary', variant: 'outline', size: 'sm' }} @buttonClick=${this.toggleSpin}></ui-button>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIButton</ui-text>
						<ui-text variant="caption" tone="muted">tones × variants × sizes · tap snap built in</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'column', gap: 'md' }}>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', wrap: true, align: 'center' }}>
								<ui-button .state=${{ label: 'Solid neutral' }}></ui-button>
								<ui-button .state=${{ label: 'Solid primary', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'Solid success', tone: 'success' }}></ui-button>
								<ui-button .state=${{ label: 'Solid danger',  tone: 'danger' }}></ui-button>
								<ui-button .state=${{ label: 'Solid warning', tone: 'warning' }}></ui-button>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', wrap: true, align: 'center' }}>
								<ui-button .state=${{ label: 'Outline neutral', variant: 'outline' }}></ui-button>
								<ui-button .state=${{ label: 'Outline primary', variant: 'outline', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'Outline danger',  variant: 'outline', tone: 'danger' }}></ui-button>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', wrap: true, align: 'center' }}>
								<ui-button .state=${{ label: 'Ghost', variant: 'ghost' }}></ui-button>
								<ui-button .state=${{ label: 'Ghost primary', variant: 'ghost', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'Link', variant: 'link', tone: 'primary' }}></ui-button>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', wrap: true, align: 'center' }}>
								<ui-button .state=${{ label: 'XS', size: 'xs', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'SM', size: 'sm', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'MD', size: 'md', tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'LG', size: 'lg', tone: 'primary' }}></ui-button>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', wrap: true, align: 'center' }}>
								<ui-button .state=${{ label: 'Disabled', disabled: true }}></ui-button>
								<ui-button .state=${{ label: 'Loading',  loading: true, tone: 'primary' }}></ui-button>
								<ui-button .state=${{ label: 'With leading',  tone: 'primary', leadicon: 'arrow-left' }}></ui-button>
								<ui-button .state=${{ label: 'With trailing', tone: 'primary', trailicon: 'arrow-right' }}></ui-button>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', align: 'center' }}>
								<ui-button .state=${{ label: 'Click me', tone: 'primary' }} @buttonClick=${this.bumpClick}></ui-button>
								<ui-text variant="caption" tone="muted">clicks: ${this.state.clickCount}</ui-text>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIInput</ui-text>
						<ui-text variant="caption" tone="muted">sizes · tones · disabled · readonly</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'column', gap: 'md' }}>
							<ui-stack .state=${{ direction: 'row', gap: 'md', wrap: true }}>
								<ui-input .state=${{ value: this.state.emailValue, type: 'email', placeholder: 'sm size · email', size: 'sm' }} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{ value: this.state.emailValue, type: 'email', placeholder: 'md size (default)', size: 'md' }} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{ value: this.state.emailValue, type: 'email', placeholder: 'lg size', size: 'lg' }} @input=${this.syncEmail}></ui-input>
							</ui-stack>
							<ui-stack .state=${{ direction: 'row', gap: 'md', wrap: true }}>
								<ui-input .state=${{ placeholder: 'disabled', disabled: true }}></ui-input>
								<ui-input .state=${{ placeholder: 'readonly', value: 'cannot edit', readonly: true }}></ui-input>
								<ui-input .state=${{ placeholder: 'error tone', tone: 'error' }}></ui-input>
							</ui-stack>
							<ui-text variant="caption" tone="muted">live email value: <ui-text variant="mono">${this.state.emailValue || '(empty)'}</ui-text></ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIField</ui-text>
						<ui-text variant="caption" tone="muted">labelled wrapper · help · error · required</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'column', gap: 'lg' }}>
							<ui-field .state=${{ label: 'Email address', help: "We'll never share your email.", required: true }}>
								<ui-input .state=${{ value: this.state.emailValue, type: 'email', placeholder: 'you@example.com' }} @input=${this.syncEmail}></ui-input>
							</ui-field>
							<ui-field .state=${{ label: 'Search', error: 'No results found' }}>
								<ui-input .state=${{ value: this.state.searchValue, type: 'search', placeholder: 'try anything', tone: 'error' }} @input=${this.syncSearch}></ui-input>
							</ui-field>
							<ui-field .state=${{ label: 'Amount', help: 'inline layout', inline: true }}>
								<ui-input .state=${{ value: this.state.amountValue, type: 'number', placeholder: '0.00' }} @input=${this.syncAmount}></ui-input>
							</ui-field>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIBadge</ui-text>
						<ui-text variant="caption" tone="muted">existing · entrance pop + value-change pulse</ui-text>
					</div>
					<ui-surface .state=${{ tone: 'panel', padding: 'lg', radius: 'lg', border: true }}>
						<ui-stack .state=${{ direction: 'row', gap: 'md', wrap: true, align: 'center' }}>
							<ui-badge .state=${{ label: 'neutral' }}></ui-badge>
							<ui-badge .state=${{ label: 'success', tone: 'success' }}></ui-badge>
							<ui-badge .state=${{ label: 'warning', tone: 'warning' }}></ui-badge>
							<ui-badge .state=${{ label: 'danger',  tone: 'danger' }}></ui-badge>
							<ui-badge .state=${{ label: 'info',    tone: 'info' }}></ui-badge>
							<ui-badge .state=${{ label: 'accent',  tone: 'accent' }}></ui-badge>
							<ui-badge .state=${{ label: 'small',   tone: 'success', size: 'sm' }}></ui-badge>
							<ui-badge .state=${{ label: 'large',   tone: 'accent',  size: 'lg' }}></ui-badge>
							<ui-badge .state=${{ label: 'with dot', tone: 'success', dot: true }}></ui-badge>
							<ui-stack .state=${{ direction: 'row', gap: 'sm', align: 'center' }}>
								<ui-badge .state=${{ label: String(this.state.badgeCount), tone: 'accent' }}></ui-badge>
								<ui-button .state=${{ label: 'Bump (test pulse)', size: 'sm', variant: 'outline' }} @buttonClick=${this.bumpBadge}></ui-button>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>
			</div>
		`;
	}
}
customElements.define('preview-view', PreviewView);
export default PreviewView;
