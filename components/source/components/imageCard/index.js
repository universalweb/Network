import component from '../component';
component({
	name: 'imageCard',
	template: `<div class="card">
		<div class="card-image">
			<img src="{{data.image}}">
			<span class="card-title">{{data.title}}</span>
		</div>
		<div class="card-content">
			<p>{{data.content}}</p>
		</div>
		<div class="card-action">
			{{#data.actions}}
				<a href="{{url}}" on-click="['action']">{{text}}</a>
			{{/}}
		</div>
  </div>`
});
console.log('imageCard');
