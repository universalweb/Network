
import component from '../../component';
component({
	name: 'horizontalCard',
	template: `<div class="col s12 m7">
     <h2 class="header">{{data.title}}</h2>
     <div class="card horizontal">
       <div class="card-image">
         <img src="{{data.image}}">
       </div>
       <div class="card-stacked">
         <div class="card-content">
           <p>{{data.content}}</p>
         </div>
         <div class="card-action">
				 	{{#data.actions}}
          	<a href="{{url}}">{{text}}</a>
					{{/}}
         </div>
       </div>
     </div>
   </div>`
});
console.log('horizontalCard');
