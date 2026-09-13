/*
	Host-side media chrome math. ui-gallery and ui-media-lightbox apply the
	patch, paint the transform, and own download. The toolbar only emits
	the action name.
*/
import {
	hasValue,
	isString,
	isTrue,
} from '@universalweb/utilitylib';
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.25;
export const ROTATE_STEP = 90;
export function mediaTransformStyle(zoom, rotate, flipX, flipY) {
	const zoomValue = Number(zoom) || 1;
	const rotateValue = Number(rotate) || 0;
	const scaleX = isTrue(flipX) ? -zoomValue : zoomValue;
	const scaleY = isTrue(flipY) ? -zoomValue : zoomValue;
	return `transform: rotate(${rotateValue}deg) scale(${scaleX}, ${scaleY})`;
}
export function mediaActionPatch(state, action) {
	switch (action) {
		case 'rotate-left': {
			return {
				rotate: (Number(state.rotate) || 0) - ROTATE_STEP,
			};
		}
		case 'rotate-right': {
			return {
				rotate: (Number(state.rotate) || 0) + ROTATE_STEP,
			};
		}
		case 'zoom-in': {
			const current = Number(state.zoom) || 1;
			return {
				zoom: Math.min(ZOOM_MAX, current + ZOOM_STEP),
			};
		}
		case 'zoom-out': {
			const current = Number(state.zoom) || 1;
			return {
				zoom: Math.max(ZOOM_MIN, current - ZOOM_STEP),
			};
		}
		case 'flip-x': {
			return {
				flipX: !isTrue(state.flipX),
			};
		}
		case 'flip-y': {
			return {
				flipY: !isTrue(state.flipY),
			};
		}
		default: {
			return null;
		}
	}
}
export function downloadFilename(item) {
	const label = item?.label;
	if (isString(label) && label) {
		return label;
	}
	return 'image';
}
export function triggerAnchorDownload(href, filename) {
	const documentRef = globalThis.document;
	if (!documentRef) {
		return;
	}
	const anchor = documentRef.createElement('a');
	anchor.href = href;
	anchor.download = filename;
	anchor.rel = 'noopener';
	anchor.click();
}
export async function fetchDownloadBlob(src) {
	try {
		const response = await globalThis.fetch(src);
		if (!response.ok) {
			return {
				ok: false,
				errKind: 'http',
			};
		}
		const blob = await response.blob();
		return {
			ok: true,
			blob,
		};
	} catch (cause) {
		return {
			ok: false,
			errKind: 'network',
			cause,
		};
	}
}
export async function runMediaDownload(item) {
	const src = item?.src || '';
	if (!hasValue(src) || src === '') {
		return null;
	}
	const filename = downloadFilename(item);
	const result = await fetchDownloadBlob(src);
	if (result.ok !== true) {
		triggerAnchorDownload(src, filename);
		return {
			src,
			filename,
			ok: false,
		};
	}
	const objectUrl = URL.createObjectURL(result.blob);
	triggerAnchorDownload(objectUrl, filename);
	URL.revokeObjectURL(objectUrl);
	return {
		src,
		filename,
		ok: true,
	};
}
