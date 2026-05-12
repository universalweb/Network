export function setInert(shouldBeInert) {
	this.inertSequence += 1;
	const token = this.inertSequence;
	if (!shouldBeInert) {
		this.toggleAttribute('inert', false);
		return Promise.resolve();
	}
	const animations = this.getAnimations({
		subtree: true,
	});
	const finite = animations.filter((animation) => {
		return animation.effect?.getTiming?.()?.iterations !== Infinity;
	});
	if (!finite.length) {
		this.toggleAttribute('inert', true);
		return Promise.resolve();
	}
	return Promise.allSettled(finite.map((animation) => {
		return animation.finished;
	})).then(() => {
		if (this.inertSequence === token && this.isConnected) {
			this.toggleAttribute('inert', true);
		}
	});
}
