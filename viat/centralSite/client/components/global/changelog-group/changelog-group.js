/**
 *	NAME: ChangelogGroup
 *	TAG: ui-changelog-group
 *
 *	── DESCRIPTION ──────────────────────────────────────────────────────
 *	DESCRIPTION: ui-changelog-group — one change-type block inside a
 *	release (a heading plus a real list). Callers supply `heading` and
 *	`items` (strings or `{ text }`); there is no frozen Added/Fixed/
 *	Removed enum. Nested `list()` of change lines cannot live in a
 *	light row, so this is a child CE.
 *	REJECTED: baking Keep a Changelog kinds into the component; rendering
 *	the list as a joined string; stuffing groups into ui-timeline
 *	description (a string, and light rows cannot mount nested lists).
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (HTML) ─────────────────────────────────────────────────────
 *	  <ui-changelog-group .state.heading=${'Added'} .state.items=${lines}></ui-changelog-group>
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── USAGE (JS) ───────────────────────────────────────────────────────
 *	  import { UIChangelogGroup } from './changelog-group.js';
 *	  const host = new UIChangelogGroup({ heading: 'Added', items: lines });
 *	  document.body.append(host);
 *	─────────────────────────────────────────────────────────────────────
 *
 *	── META ─────────────────────────────────────────────────────────────
 *	Author: Universal Web
 *	Date: 2026-09-05
 *	─────────────────────────────────────────────────────────────────────
 */
import { isString } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
export class UIChangelogGroup extends WebComponent {
	static url = import.meta.url;
	static styles = {
		changelogGroup: './changelog-group.css',
	};
	static state = {
		heading: '',
		items: [],
		tone: '',
	};
	groupTone() {
		return this.state.tone || '';
	}
	changeText(entry) {
		if (isString(entry)) {
			return entry;
		}
		if (isString(entry?.text)) {
			return entry.text;
		}
		return '';
	}
	changeRow(entry) {
		return this.partial`<li>${this.changeText(entry)}</li>`;
	}
	render() {
		this.html`
			<section class="changelog-group" data-tone=${this.groupTone}>
				<h3 class="changelog-group-heading">${this.state.heading}</h3>
				<ul class="changelog-changes">
					${this.list('items', this.changeRow)}
				</ul>
			</section>
		`;
	}
}
customElements.define('ui-changelog-group', UIChangelogGroup);
