import component from '../component';
component({
	name: 'badge',
	template: `<span class="{{data.new? 'new' : ''}} badge {{data.color}}">{{data.text}}</span>`
});
console.log('badge');
