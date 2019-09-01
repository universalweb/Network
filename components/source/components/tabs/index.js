import component from '../component';
component({
	name: 'tabs',
	template: `<div>
	<ul class="tabs">
        {{#data.tabs}}
					<li class="tab col s3"><a class="{{active? 'active' : ''}}" href="#{{target}}">{{text}}</a></li>
      	{{/}}
			</ul>
    {{#data.tabs}}
			<div id="{{target}}" class="col s12">{{content}}</div>
		{{/}}
		</div>`
});
console.log('tabs');
