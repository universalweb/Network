export function isObject(value) {
	return value !== null && typeof value === 'object';
}
export function isString(value) {
	return typeof value === 'string';
}
export function isFunction(value) {
	return typeof value === 'function';
}
export function isSymbol(value) {
	return typeof value === 'symbol';
}
export function isElement(value) {
	return value instanceof Element;
}
export function isShadowRoot(value) {
	return value instanceof ShadowRoot;
}
export function isPromiseLike(value) {
	return value !== null && typeof value === 'object' && isFunction(value.then);
}
export function isError(value) {
	return value instanceof Error;
}
export function isUndefined(value) {
	return value === undefined;
}
export function isNull(value) {
	return value === null;
}
export function isEmpty(value) {
	if (isString(value)) {
		return value.trim() === '';
	}
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (isObject(value)) {
		return Object.keys(value).length === 0;
	}
	return false;
}
export function formatNumber(value, decimals = 2) {
	if (typeof value !== 'number') {
		return value;
	}
	return value.toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}
export function formatDate(date) {
	if (!(date instanceof Date)) {
		return date;
	}
	return date.toLocaleString('en-GB', {
		hour12: false,
	});
}
export function abbreviateAddress(address, chars = 6) {
	if (!isString(address) || address.length <= chars * 2) {
		return address;
	}
	return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
export function makeHtmlTag(component) {
	return (strings, ...values) => {
		return strings.reduce((result, string, index) => {
			const value = values[index] !== undefined ? values[index] : '';
			return result + string + value;
		}, '');
	};
}
export function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			timeout = null;
			func.apply(this, args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}
export function throttle(func, limit) {
	let inThrottle;
	return function executedFunction(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}
export function memoize(func) {
	const cache = new Map();
	return function memoizedFunction(...args) {
		const key = JSON.stringify(args);
		if (cache.has(key)) {
			return cache.get(key);
		}
		const result = func.apply(this, args);
		cache.set(key, result);
		return result;
	};
}
export function createElementFromHTML(htmlString) {
	const template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstElementChild;
}
export function animateElement(element, keyframes, options) {
	const animation = element.animate(keyframes, options);
	animation.finished.then(() => {
		element.style.opacity = '';
		element.style.pointerEvents = '';
		element.style.willChange = '';
	});
	return animation;
}
