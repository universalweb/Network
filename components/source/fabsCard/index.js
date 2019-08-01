import component from '../component';
component({
	name: 'fabsCard',
	template: `<div class="card {{data.color? data.color : 'blue-grey'}} {{data.darken? data.darken : 'darken-1'}}">
			<div class="card-image">
			<img src="{{data.image}}">
				<span class="card-title">{{data.title}}</span>
				{{#data.actions}}
					<a class="btn-floating halfway-fab waves-effect waves-light {{color}}" on-click="['action']"><i class="material-icons">{{icon}}</i></a>
				{{/}}
			</div>
			<div class="card-content">
				<p>{{data.content}}</p>
			</div>
		</div>`
});
console.log('fabsCard');
