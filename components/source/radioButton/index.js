import component from '../component';
component({
	name: 'radioButton',
	template: `<input name="{{data.name}}" type="radio" checked />`
});
console.log('radioButton');
