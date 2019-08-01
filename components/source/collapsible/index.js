import component from '../component';
component({
	name: 'collapsible',
	template: ` <ul class="collapsible">
		{{#data.items}}
	    <li>
	      <div class="collapsible-header">
					{{#icon}}
						<i class="material-icons">{{name}}</i>
					{{/}}
					{{title}}
				</div>
	      <div class="collapsible-body"><span>{{content}}</span></div>
	    </li>
		{{/}}
  </ul>`
});
console.log('collapsible');
