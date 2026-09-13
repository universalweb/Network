/*
	NAME: stripPage
	Overflow paging dest for ui-tracker. Pure geometry — last fully-visible
	block becomes the new start (end arrow), first fully-visible block's
	window is rewound (start arrow). Remainder shorter than a window jumps
	to the edge.
*/
export const SCROLL_EDGE_PX = 1;
function blockStart(block) {
	return block.offsetLeft;
}
function blockEnd(block) {
	return block.offsetLeft + block.offsetWidth;
}
export function pageStripEndDest(blocks, viewSize, scrollPos, maxScroll) {
	const remaining = maxScroll - scrollPos;
	if (remaining <= viewSize + SCROLL_EDGE_PX) {
		return maxScroll;
	}
	const blockCount = blocks.length;
	const viewEnd = scrollPos + viewSize;
	let lastFully = null;
	let lastFullyIndex = -1;
	for (let index = 0; index < blockCount; index += 1) {
		const node = blocks[index];
		const inlineStart = blockStart(node);
		const inlineEnd = blockEnd(node);
		if (inlineStart >= scrollPos - SCROLL_EDGE_PX && inlineEnd <= viewEnd + SCROLL_EDGE_PX) {
			lastFully = node;
			lastFullyIndex = index;
		}
	}
	let dest = scrollPos + viewSize;
	if (lastFully) {
		dest = blockStart(lastFully);
		if (dest <= scrollPos + SCROLL_EDGE_PX) {
			const next = blocks[lastFullyIndex + 1];
			dest = next ? blockStart(next) : maxScroll;
		}
	}
	return Math.min(maxScroll, dest);
}
export function pageStripStartDest(blocks, viewSize, scrollPos, maxScroll) {
	if (scrollPos <= viewSize + SCROLL_EDGE_PX) {
		return 0;
	}
	const blockCount = blocks.length;
	const viewEnd = scrollPos + viewSize;
	let firstFullyIndex = -1;
	for (let index = 0; index < blockCount; index += 1) {
		const node = blocks[index];
		const inlineStart = blockStart(node);
		const inlineEnd = blockEnd(node);
		if (inlineStart >= scrollPos - SCROLL_EDGE_PX && inlineEnd <= viewEnd + SCROLL_EDGE_PX) {
			firstFullyIndex = index;
			break;
		}
	}
	let dest = Math.max(0, scrollPos - viewSize);
	if (firstFullyIndex >= 0) {
		const firstFully = blocks[firstFullyIndex];
		const raw = blockEnd(firstFully) - viewSize;
		dest = 0;
		for (let index = 0; index < blockCount; index += 1) {
			const inlineStart = blockStart(blocks[index]);
			if (inlineStart <= raw + SCROLL_EDGE_PX) {
				dest = inlineStart;
			} else {
				break;
			}
		}
		if (dest >= scrollPos - SCROLL_EDGE_PX) {
			const previous = blocks[firstFullyIndex - 1];
			dest = previous ? blockStart(previous) : 0;
		}
	}
	return Math.max(0, Math.min(maxScroll, dest));
}
export function visibleEdgeIndexes(blocks, viewSize, scrollPos) {
	const blockCount = blocks.length;
	const viewEnd = scrollPos + viewSize;
	let start = -1;
	let end = -1;
	for (let index = 0; index < blockCount; index += 1) {
		const inlineStart = blockStart(blocks[index]);
		const inlineEnd = blockEnd(blocks[index]);
		if (inlineStart >= scrollPos - SCROLL_EDGE_PX && inlineEnd <= viewEnd + SCROLL_EDGE_PX) {
			if (start < 0) {
				start = index;
			}
			end = index;
		}
	}
	const previous = start > 0 ? blocks[start - 1] : null;
	const next = end >= 0 && (end + 1) < blockCount ? blocks[end + 1] : null;
	const clipStart = Boolean(previous && blockEnd(previous) > scrollPos + SCROLL_EDGE_PX);
	const clipEnd = Boolean(next && blockStart(next) < viewEnd - SCROLL_EDGE_PX);
	return {
		start,
		end,
		clipStart,
		clipEnd,
	};
}
