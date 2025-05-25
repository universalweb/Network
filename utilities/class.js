export function getParentClass(source) {
	const childPrototype = Object.getPrototypeOf(source);
	if (!childPrototype) {
		return undefined;
	}
	const parentPrototype = Object.getPrototypeOf(childPrototype);
	if (!parentPrototype) {
		return undefined;
	}
	return parentPrototype.constructor;
}
export function getParentClassName(source) {
	const parentClass = getParentClass(source);
	if (!parentClass) {
		return undefined;
	}
	return parentClass.name;
}
