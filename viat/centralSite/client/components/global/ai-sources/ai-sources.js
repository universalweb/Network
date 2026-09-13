/*
 * `<ui-ai-sources>` — the citation list backing an agent's grounded answer: a
 * numbered set of sources ({ id?, title, url, snippet? }) each linking out to
 * its origin with the host shown. Numbering is a CSS counter so the light row
 * stays index-free. Pure display; sources pass through `list()` as-is. Drive
 * with `.sources` and an optional `.label` heading.
 */
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
// Origin host for the source's badge — regex parse (no URL ctor / try-catch) so
// a relative or malformed url just yields an empty host instead of throwing.
function hostOf(url) {
	const match = (/^https?:\/\/([^/?#]+)/i).exec(String(url ?? ''));
	return match ? match[1] : '';
}
// Scheme allowlist; the template already escapes the attribute value, so this
// only needs to block javascript:/data: by falling back to an inert anchor.
function safeHref(url) {
	const value = String(url ?? '').trim();
	const lower = value.toLowerCase();
	if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
		return value;
	}
	return '#';
}
export class UIAiSources extends WebComponent {
	static url = import.meta.url;
	static styles = {
		items: './ai-sources.css',
	};
	static state = {
		label: 'Sources',
		items: [],
	};
	sourceKey(source) {
		return source.id ?? source.url ?? source.title;
	}
	renderSource(source) {
		// Light rows can't embed a nested html`` fragment (it serializes), so the
		// snippet span is always emitted and hidden via `.ai-sources-snippet:empty`.
		return html`
			<li class="ai-sources-item">
				<a class="ai-sources-link" href=${safeHref(source.url)} target="_blank" rel="noopener noreferrer">
					<span class="ai-sources-title">${source.title || source.url}</span>
					<span class="ai-sources-host">${hostOf(source.url)}</span>
				</a>
				<span class="ai-sources-snippet">${source.snippet || ''}</span>
			</li>
		`;
	}
	render() {
		this.html`
			<section class="ai-sources">
				<header class="ai-sources-head" ?hidden=${!this.state.label}>
					<ui-icon class="ai-sources-head-icon" .state.name=${'book-open'} .state.size=${'sm'}></ui-icon>
					<span class="ai-sources-title-head">${this.state.label}</span>
				</header>
				<ol class="ai-sources-list">${this.list('items', this.renderSource, this.sourceKey)}</ol>
			</section>
		`;
	}
}
customElements.define('ui-ai-sources', UIAiSources);
