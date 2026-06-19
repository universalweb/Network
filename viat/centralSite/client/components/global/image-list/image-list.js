/*
	DESCRIPTION: ui-image-list — a responsive image/gallery grid (MUI "ImageList").
	CSS-grid layout from `items[]`; each cell is a NATIVE <img> (+ optional <a> /
	caption) built as a pure string — no `ui-*` props in the markup, so nothing
	renders blank. Cells without an href are focusable and emit a select event.
	A default <slot> lets consumers project their own cells instead of `items`.
	── EVENTS ───────────────────────────────────────────────────────────
	  image:select { index, item }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-image-list .columns=${3} .gap=${'0.5rem'} .items=${[
	    { src: '/a.jpg', alt: 'A', title: 'Alpha' },
	    { src: '/b.jpg', alt: 'B', href: '/b' },
	  ]} @image:select=${e => open(e.detail.data.item)}></ui-image-list>
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from '../../core/index.js';
const esc = (value) => {
	return String(value).replace(/[&<>"]/g, (char) => {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
		}[char];
	});
};
export class UIImageList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		imageList: './image-list.css',
	};
	static state = {
		items: [],
		columns: 3,
		gap: '0.5rem',
		aspect: '1 / 1',
		radius: 'md',
	};
	handleClick(domEvent) {
		const cell = domEvent.target.closest('[data-index]');
		if (!cell) {
			return;
		}
		const index = Number(cell.dataset.index);
		this.emit('image:select', {
			index,
			item: this.state.items[index],
		});
	}
	render() {
		const style = `grid-template-columns: repeat(${Number(this.state.columns) || 3}, 1fr); gap: ${this.state.gap};`;
		this.html `
			<div class="image-list" data-radius=${this.state.radius} style=${style} @click=${this.handleClick}>
				^html${this.renderItems}
				<slot></slot>
			</div>
		`;
	}
	renderItems() {
		const items = Array.isArray(this.state.items) ? this.state.items : [];
		const aspect = this.state.aspect;
		let markup = '';
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			const caption = item.title ? `<figcaption class="il-caption">${esc(item.title)}</figcaption>` : '';
			const inner = `<img class="il-img" src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy" style="aspect-ratio:${aspect}">${caption}`;
			markup += item.href ? `<a class="il-cell" href="${esc(item.href)}" data-index="${index}">${inner}</a>` : `<figure class="il-cell" data-index="${index}" tabindex="0">${inner}</figure>`;
		}
		return markup;
	}
}
customElements.define('ui-image-list', UIImageList);
