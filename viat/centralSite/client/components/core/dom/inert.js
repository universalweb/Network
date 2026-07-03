function isFiniteAnimation(animation) {
	return animation.effect?.getTiming?.()?.iterations !== Infinity;
}
function animationFinished(animation) {
	return animation.finished;
}
export async function setInert(shouldBeInert) {
	this.inertSequence += 1;
	const token = this.inertSequence;
	if (!shouldBeInert) {
		this.toggleAttribute('inert', false);
		return;
	}
	const animations = this.getAnimations({
		subtree: true,
	});
	const finite = animations.filter(isFiniteAnimation);
	if (!finite.length) {
		this.toggleAttribute('inert', true);
		return;
	}
	await Promise.allSettled(finite.map(animationFinished));
	if (this.inertSequence === token && this.isConnected) {
		this.toggleAttribute('inert', true);
	}
}
