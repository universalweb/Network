
import component from '../../component';
component({
	name: 'revealCard',
	template: `<div class="card">
      <div class="card-image waves-effect waves-block waves-light">
        <img class="activator" src="{{data.url}}">
      </div>
      <div class="card-content">
        <span class="card-title activator grey-text text-darken-4">{{data.title}}
				{{#data.btns}}
					<i class="material-icons right">more_vert</i>
				{{/}}
				</span>
        <p>
					{{#data.links}}
						<a href="{{url}}">This is a link</a>
					{{/}}
				</p>
      </div>
      <div class="card-reveal">
        <span class="card-title grey-text text-darken-4">{{revealTitle}}<i class="material-icons right">close</i></span>
        <p>{{revealContent}}</p>
      </div>
    </div>`
});
console.log('revealCard');
