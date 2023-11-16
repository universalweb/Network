import Benchmark from 'benchmark';
// Define the functions
function work() {
	return;
}
function test1() {
}
function test2() {
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
