import Benchmark from 'benchmark';
const array = new Array(100);
function fn(i) {
	return array[i];
}
// Define the functions
function test1(arg) {
	const arrayLength = array.length;
	for (let i = 0; i < arrayLength; i++) {
		fn(i);
	}
}
function test2() {
	array.forEach(fn);
}
// Create a benchmark suite
const suite = new Benchmark.Suite();
// Add tests to the suite
suite
	.add('test1', () => {
		test1();
	})
	.add('test2', () => {
		test2();
	})
// Add listeners
	.on('cycle', (evnt) => {
		console.log(String(evnt.target));
	})
	.on('complete', function() {
		console.log(`Fastest is ${this.filter('fastest').map('name')}`);
	})
// Run the benchmark
	.run({
		async: true
	});
