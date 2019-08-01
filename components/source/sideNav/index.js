import component from '../component';
component({
	name: 'sideNav',
	template: `<ul id="slide-out" class="sidenav">
	{{#data.items}}
		<li>
			<a href="{{url}}">
			{{#icon}}
				<i class="material-icons">{{icon.name}}</i>
			{{/}}
			{{text}}
			</a>
		</li>
	{{/}}
  </ul>`
});
console.log('sideNav');
