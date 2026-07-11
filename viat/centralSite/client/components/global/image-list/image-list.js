/*
	DESCRIPTION: ui-image-list — a responsive image/gallery grid (MUI "ImageList").
	CSS-grid layout from `items[]` via list('items', UIImageCell): each cell is its
	own ui-image-cell child (a native <a> when it has an href, else a <button> that
	emits image-cell:select). The list re-emits the child's select as its public
	image-list:select. A default <slot> lets consumers project their own cells.
	── EVENTS ───────────────────────────────────────────────────────────
	  image-list:select { index, item }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-image-list .state.columns=${3} .state.gap=${'0.5rem'} .state.items=${[
	    { src: '/a.jpg', alt: 'A', title: 'Alpha' },
	    { src: '/b.jpg', alt: 'B', href: '/b' },
	  ]} @image-list:select=${this.handleOpen}></ui-image-list>   // e.detail.data.item
	──────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UIImageCell } from './image-cell.js';
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
	handleSelect(domEvent) {
		const item = domEvent.detail?.data?.item;
		if (!item) {
			return;
		}
		const index = this.indexOfItem(item);
		this.emit('image-list:select', {
			index,
			item: this.state.items[index] ?? item,
		});
	}
	indexOfItem(item) {
		const items = this.state.items;
		const itemsLength = items.length;
		for (let index = 0; index < itemsLength; index += 1) {
			if (items[index].src === item.src && items[index].href === item.href) {
				return index;
			}
		}
		return -1;
	}
	itemKey(item, index) {
		return item.id ?? item.src ?? index;
	}
	render() {
		const style = `grid-template-columns: repeat(${Number(this.state.columns) || 3}, 1fr); gap: ${this.state.gap}; --il-aspect: ${this.state.aspect};`;
		this.html`
			<div class="image-list" data-radius=${this.state.radius} style=${style} @image-cell:select=${this.handleSelect}>
				${this.list('items', UIImageCell, this.itemKey)}
				<slot></slot>
			</div>
		`;
	}
}
customElements.define('ui-image-list', UIImageList);
