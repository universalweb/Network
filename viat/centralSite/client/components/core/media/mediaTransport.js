/*
	Shared HTMLMediaElement transport math. UIAudioPlayer, UIVideoPlayer,
	and UIVideoShort apply src / clock / volume through these helpers;
	they do not own a second copy. `src` is never a template binding —
	setting the attribute to the same URL calls load() and kills playback.
*/
import { isString } from '@universalweb/utilitylib';
export const SKIP_SECONDS = 10;
export const SEEK_SECONDS = 5;
export const VOLUME_STEP = 0.05;
export function padTime(value) {
	return String(value).padStart(2, '0');
}
export function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '0:00';
	}
	const whole = Math.floor(seconds);
	const mins = Math.floor(whole / 60);
	const secs = whole % 60;
	if (mins >= 60) {
		const hours = Math.floor(mins / 60);
		return `${hours}:${padTime(mins % 60)}:${padTime(secs)}`;
	}
	return `${mins}:${padTime(secs)}`;
}
export function clampUnit(value) {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}
export function isEditableTarget(target) {
	return target instanceof HTMLInputElement ||
		target instanceof HTMLSelectElement ||
		target instanceof HTMLTextAreaElement;
}
export function mediaNoun(kind) {
	if (kind === 'video') {
		return 'video';
	}
	if (kind === 'audio') {
		return 'audio';
	}
	return 'media';
}
export function mediaMessage(node, kind) {
	const mediaError = node?.error;
	const noun = mediaNoun(kind);
	if (!mediaError) {
		return 'The file is missing or unsupported.';
	}
	if (mediaError.message) {
		return mediaError.message;
	}
	switch (mediaError.code) {
		case 2: {
			return `Network error while loading ${noun}.`;
		}
		case 3: {
			return `The ${noun} file could not be decoded.`;
		}
		case 4: {
			return `This ${noun} format is not supported.`;
		}
		default: {
			return 'The file is missing or unsupported.';
		}
	}
}
export function bufferedEnd(node) {
	const duration = node?.duration;
	if (!Number.isFinite(duration) || duration <= 0) {
		return 0;
	}
	const ranges = node.buffered;
	const count = ranges.length;
	if (count === 0) {
		return 0;
	}
	return ranges.end(count - 1);
}
export function clampMediaTime(node, nextTime) {
	if (!node || !Number.isFinite(node.duration) || node.duration <= 0) {
		return null;
	}
	if (!Number.isFinite(nextTime)) {
		return null;
	}
	return Math.max(0, Math.min(node.duration, nextTime));
}
export function resolvedSrc(value) {
	return isString(value) ? value : '';
}
