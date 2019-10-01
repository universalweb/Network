
import component from '../../component';
component({
	name: 'range',
	template: `<input type="range" min="{{data.min}}" max="{{data.max}}" value="{{data.value}}" />`
});
console.log('range');
