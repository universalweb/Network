import component from '../component';
component({
	name: 'card',
	template: `<div class="card {{data.color? data.color : 'blue-grey'}} {{data.darken? data.darken : 'darken-1'}} {{data.size}}">
      <div class="card-content white-text">
        <span class="card-title">{{data.title}}</span>
        <p>{{data.content}}</p>
      </div>
      <div class="card-action">
				{{#data.actions}}
        	<a href="{{url}}" on-click="['action']">{{text}}</a>
				{{/}}
      </div>
    </div>`
});
console.log('card');
