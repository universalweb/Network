import { eachArray } from '@universalweb/utilitylib';
import { inspect } from 'util';
/**
 * Sum of elements in a cluster (array of BigInt).
 */
export function sumCluster(cluster) {
	let sum = 0n;
	eachArray(cluster, (v) => {
		sum += v;
	});
	return sum;
}
/**
 * Number of elements in a cluster as BigInt.
 */
export function clusterSize(cluster) {
	return BigInt(cluster.length);
}
/**
 * Average value of a cluster as BigInt (floor division).
 * Returns 0n for empty cluster.
 */
export function clusterAverage(cluster) {
	const size = cluster.length;
	if (size === 0) {
		return 0n;
	}
	return sumCluster(cluster) / BigInt(size);
}
/**
 * Compute density (average) for each cluster.
 * Returns an array of BigInt densities in the same order.
 */
export function clustersDensities(clusters) {
	return clusters.map((cluster) => {
		return clusterAverage(cluster);
	});
}
/**
 * Overall density across all clusters (total sum / total elements).
 * Returns 0n if there are no elements.
 */
export function totalDensity(clusters) {
	let totalSum = 0n;
	let totalCount = 0n;
	eachArray(clusters, (c) => {
		totalSum += sumCluster(c);
		totalCount += BigInt(c.length);
	});
	if (totalCount === 0n) {
		return 0n;
	}
	return totalSum / totalCount;
}
/**
 * Find the densest cluster (highest average).
 * Returns an object: { index: number, density: BigInt }.
 * If there are no clusters, returns { index: -1, density: 0n }.
 * If multiple clusters tie, returns the first index with the max density.
 */
export function densestCluster(clusters) {
	if (clusters.length === 0) {
		return {
			index: -1,
			density: 0n,
		};
	}
	let bestIndex = 0;
	let bestDensity = clusterAverage(clusters[0]);
	for (let i = 1; i < clusters.length; i++) {
		const d = clusterAverage(clusters[i]);
		if (d > bestDensity) {
			bestDensity = d;
			bestIndex = i;
		}
	}
	return {
		index: bestIndex,
		density: bestDensity,
	};
}
/**
 * Group clusters by their BigInt density (average).
 * Returns an object:
 * {
 *   groups: [ { density: BigInt, indices: [number, ...] }, ... ],
 *   membership: [ groupIndex, ... ] // membership[i] = index of group for clusters[i]
 * }.
 *
 * Clusters that have the same density (exact BigInt equality) are placed in the same group.
 */
export function groupClustersByDensity(clusters) {
	// array of BigInt
	const densities = clustersDensities(clusters);
	// densityStr -> groupIndex
	const map = new Map();
	const groups = [];
	const membership = new Array(densities.length).fill(-1);
	const densityTotal = densities.length;
	for (let i = 0; i < densityTotal; i++) {
		const d = densities[i];
		const key = d.toString();
		if (map.has(key) === false) {
			const groupIndex = groups.length;
			map.set(key, groupIndex);
			groups.push({
				density: d,
				indices: [i],
			});
			membership[i] = groupIndex;
		} else {
			const groupIndex = map.get(key);
			groups[groupIndex].indices.push(i);
			membership[i] = groupIndex;
		}
	}
	return {
		groups,
		membership,
	};
}
// Example usage (BigInt arrays)
const exampleClusters = [
	[
		1n, 2n, 0n,
	],
	[
		1n, 2n, 3n,
	],
	[
		1n, 2n, 10n,
	],
	[
		1n, 2n, 3n,
	],
];
console.log('Clusters densities:', clustersDensities(exampleClusters));
console.log('Total density:', totalDensity(exampleClusters));
console.log('Densest cluster:', densestCluster(exampleClusters));
console.log('Groups by density:', inspect(groupClustersByDensity(exampleClusters), {
	depth: null,
	colors: true,
	showHidden: false,
	maxArrayLength: null,
}));
