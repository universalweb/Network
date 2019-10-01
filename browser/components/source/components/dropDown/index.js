
import component from '../../component';
component({
	name: 'dropDown',
	template: `<a class='dropdown-trigger btn' data-target='{{@._guid}}'>Drop Me!</a>
  <ul id='{{@._guid}}' class='dropdown-content'>
	{{#data.items}}
    <li>
			<a href="{{url}}">
				{{#icon}}
					<i class="material-icons">{{name}}</i>
				{{/}}
				{{text}}
			</a>
		</li>
	{{/}}
  </ul>`
});
console.log('dropdown');
