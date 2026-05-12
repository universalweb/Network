class Test {
	constructor() {
		Test.prototype.run.call(this);
		this.run();
		console.log('Test class instantiated', this.constructor.name);
	}
	run() {
		console.log('Test is running');
	}
}
class Bob extends Test {
	constructor() {
		super();
		console.log('Bob class instantiated', this.constructor.name);
	}
	run() {
		console.log('Bob is running', this.constructor.name);
	}
}
class Tom extends Bob {
	constructor() {
		super();
		Bob.prototype.run.call(this);
		console.log('Tom class instantiated', this.constructor.name);
	}
	run() {
		console.log('Tom is running');
	}
}
new Tom();
