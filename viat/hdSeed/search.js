export function schemeTypeSearch(query, target) {
	// Return the numeric target value whose property name is closest to `query`.
	if (query == null) {
		return undefined;
	}
	const trimmedQuery = String(query).trim();
	if (trimmedQuery.length === 0) {
		return undefined;
	}
	const numericQuery = Number(trimmedQuery);
	if (!Number.isNaN(numericQuery)) {
		for (const schemeName of Object.keys(target)) {
			if (target[schemeName] === numericQuery) {
				return numericQuery;
			}
		}
	}
	const normalizeKey = (value) => {
		return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
	};
	const normalizedQuery = normalizeKey(trimmedQuery);
	let closestSchemeName;
	let closestScore = Infinity;
	const levenshteinDistance = (left, right) => {
		if (left === right) {
			return 0;
		}
		if (!left.length) {
			return right.length;
		}
		if (!right.length) {
			return left.length;
		}
		const previousRow = new Array(right.length + 1);
		for (let i = 0; i <= right.length; i++) {
			previousRow[i] = i;
		}
		for (let leftIndex = 0; leftIndex < left.length; leftIndex++) {
			const currentRow = [leftIndex + 1];
			for (let rightIndex = 0; rightIndex < right.length; rightIndex++) {
				const cost = left[leftIndex] === right[rightIndex] ? 0 : 1;
				currentRow[rightIndex + 1] = Math.min(
					previousRow[rightIndex + 1] + 1,
					currentRow[rightIndex] + 1,
					previousRow[rightIndex] + cost
				);
			}
			for (let rowIndex = 0; rowIndex < currentRow.length; rowIndex++) {
				previousRow[rowIndex] = currentRow[rowIndex];
			}
		}
		return previousRow[right.length];
	};
	for (const schemeName of Object.keys(target)) {
		const normalizedSchemeName = normalizeKey(schemeName);
		if (normalizedSchemeName === normalizedQuery) {
			return target[schemeName];
		}
		let score = Infinity;
		if (normalizedSchemeName.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedSchemeName)) {
			score = 1;
		} else if (normalizedSchemeName.includes(normalizedQuery) || normalizedQuery.includes(normalizedSchemeName)) {
			score = 2;
		} else {
			const distance = levenshteinDistance(normalizedSchemeName, normalizedQuery);
			score = distance;
		}
		if (score < closestScore) {
			closestScore = score;
			closestSchemeName = schemeName;
		}
	}
	if (!closestSchemeName) {
		return undefined;
	}
	return target[closestSchemeName];
}
