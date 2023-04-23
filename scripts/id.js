import { idGenerator } from '#utilities/idGenerator.js';
const generator = idGenerator({
	digits: 1,
	letters: 1,
});
console.log(generator.generate());
generator.restore('A5');
console.log(generator.next());
console.log(generator.generate());
console.log(generator.generate());
