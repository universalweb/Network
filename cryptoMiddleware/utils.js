import { hasValue } from '@universalweb/acid';
export function setOption(source, option) {
	const {
		id, name: cipherName, alias
	} = option;
	if (hasValue(cipherName)) {
		source.set(cipherName, option);
	}
	if (hasValue(id)) {
		source.set(id, option);
	}
	if (hasValue(alias)) {
		source.set(alias, option);
	}
}
export function setOptions(source, ...options) {
	options.forEach((option) => {
		setOption(source, option);
	});
}
