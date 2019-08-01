import component from '../component';
component({
	name: 'collection',
	template: `<ul class="collection {{header? 'with-header' : ''}}">
		{{#data.header}}
      <li class="collection-header"><h4>{{title}}</h4></li>
		{{/}}
		{{#data.items}}
      <li class="collection-item">
				<div>
					{{title}}
					{{#actions}}
						<a href="{{url}}" on-click="['action']" class="secondary-content">
							{{#icon}}
								<i class="material-icons">{{name}}</i>
							{{/}}
						</a>
						{{/}}
				</div>
			</li>
		{{/}}
    </ul>`
});
console.log('collection');
