import Benchmark from 'benchmark';
export async function runBench(test1, test2, test3) {
	const suite = new Benchmark.Suite();
	suite.add('test1', test1).add('test2', test2);
	if (test3) {
		suite.add('test3', test3);
	}
	suite.on('cycle', (evnt) => {
		console.log(String(evnt.target));
	}).on('complete', function() {
		console.log(`Fastest is ${this.filter('fastest').map('name')}`);
	});
	suite.run({
		async: true,
	});
	return suite;
}
export async function runSingleBench(test1) {
	const suite = new Benchmark.Suite();
	suite
		.add('test1', test1)
		.on('cycle', (evnt) => {
			console.log(String(evnt.target));
		})
		.on('complete', function() {
			console.log(`Fastest is ${this.filter('fastest').map('name')}`);
		})
		.run({
			async: true,
		});
	return suite;
}
export default runBench;
