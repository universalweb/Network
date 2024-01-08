import Benchmark from 'benchmark';
import { noop } from '@universalweb/acid';
const array = new Array(100);
const routesLength = array.length;
function test1() {
	if (routesLength > 0 && routesLength < 4) {
		return;
	}
}
function test2() {
	if (routesLength === 1 || routesLength === 2 || routesLength === 3) {
		return;
	}
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
