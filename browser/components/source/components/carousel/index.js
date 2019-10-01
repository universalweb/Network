
import component from '../../component';
component({
	name: 'carousel',
	template: `<div class="carousel">
    {{#items}}
      <a class="carousel-item" href="{{url}}">
        <img src="{{image}}">
      </a>
    {{/}}
	</div>`
});
console.log('carousel');
