import component from '../component';
component({
	name: 'panelCard',
	template: `<div class="row">
     <div class="col s12 m5">
       <div class="card-panel {{data.color}}">
         <span class="white-text">{{data.content}}</span>
       </div>
     </div>
   </div>`
});
console.log('panelCard');
