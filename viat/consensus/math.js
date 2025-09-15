import { eachArray, stringify } from '@universalweb/utilitylib';
import { inspect } from 'util';
// CONSENSUS AFTER DETERMINISTIC RULES
/**
 * Max tolerated Byzantine nodes for total nodes n.
 * F = ⌊(n - 1) / 3⌋.
 */
export function faultyNodeTolerance(totalNodes) {
	return (totalNodes - 1n) / 3n;
}
/**
 * Strict majority threshold: > n/2
 * Returns the minimum votes needed to exceed 50%.
 */
export function majority(totalNodes) {
	return (totalNodes / 2n) + 1n;
}
/**
 * Supermajority threshold from f: 2f + 1
 * Returns the minimum votes needed for PBFT commit when f is known.
 */
export function superMajority(faultyNodes) {
	return (2n * faultyNodes) + 1n;
}
/**
 * Supermajority threshold from n: 2*⌊(n-1)/3⌋ + 1
 * Useful when callers only know n.
 */
export function superMajorityFromTotalNodes(totalNodes) {
	return superMajority(faultyNodeTolerance(totalNodes));
}
/**
 * Check PBFT sizing: n ≥ 3f + 1.
 */
export function isQuorumSatisfied(faultyNodesAmount, totalNodes) {
	return totalNodes >= (3n * faultyNodesAmount) + 1n;
}
/**
 * Minimum n required to tolerate f Byzantine nodes: 3f + 1.
 */
export function minNodesForFaults(faultyNodes) {
	return (3n * faultyNodes) + 1n;
}
/**
 * Threshold for initiating suspicion/view-change signals: f + 1
 * Smallest set that guarantees at least one honest participant.
 */
export function suspectThreshold(faultyNodes) {
	return faultyNodes + 1n;
}
/**
 * Blocking threshold against a 2f+1 quorum: f + 1 withheld votes can block progress.
 */
export function blockingThreshold(faultyNodes) {
	return faultyNodes + 1n;
}
/**
 * Two-thirds style threshold: ceil(2n/3)
 * Some BFT protocols use 2/3 of validators instead of 2f+1 when n varies.
 */
export function twoThirdsThreshold(totalNodes) {
	// ceil(2n/3) = (2n + 2) // 3 for integers
	return ((2n * totalNodes) + 2n) / 3n;
}
/**
 * Convenience predicates for vote counts.
 */
export function reachedMajority(votes, totalNodes) {
	return votes >= majority(totalNodes);
}
export function reachedSuperMajorityByF(votes, faultyNodes) {
	return votes >= superMajority(faultyNodes);
}
export function reachedSuperMajority(votes, totalNodes) {
	return votes >= superMajorityFromTotalNodes(totalNodes);
}
export function reachedTwoThirds(votes, totalNodes) {
	return votes >= twoThirdsThreshold(totalNodes);
}
/**
 * Confidence helper (kept your semantics).
 */
export function confidence(confirms, negatory) {
	if (confirms === negatory) {
		return 0;
	}
	return confirms / (confirms - negatory);
}
export function isVotesPositive(confirms, negatory) {
	return confirms > negatory;
}
// Set global defaults
inspect.defaultOptions.depth = null;
inspect.defaultOptions.colors = true;
// Demo
const confirmationVotes = 10;
const negatoryVotes = 5;
const totalArbiters = 7n;
const f = faultyNodeTolerance(totalArbiters);
console.log('Faulty nodes tolerance f:', f);
console.log('Required majority (> n/2):', majority(totalArbiters));
console.log('Supermajority (2f + 1):', superMajority(f));
console.log('Supermajority from n:', superMajorityFromTotalNodes(totalArbiters));
console.log('Two-thirds threshold ceil(2n/3):', twoThirdsThreshold(totalArbiters));
console.log('Meets PBFT sizing (n ≥ 3f + 1):', isQuorumSatisfied(f, totalArbiters));
console.log('Min n for f faults (3f + 1):', minNodesForFaults(f));
console.log('Suspect/view-change threshold (f + 1):', suspectThreshold(f));
console.log('Blocking threshold (f + 1):', blockingThreshold(f));
console.log(`Confidence (${confirmationVotes} confirms, ${negatoryVotes} negatory):`, confidence(confirmationVotes, negatoryVotes));

