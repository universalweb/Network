import component from '../component';
component({
	name: 'featureDiscovery',
	template: `<a id="menu" class="waves-effect waves-light btn btn-floating">
		<i class="material-icons">menu</i></a>
  	<div class="tap-target" data-target="menu">
    <div class="tap-target-content">
      <h5>data.title</h5>
      <p>A bunch of text</p>
    </div>
  </div>`
});
console.log('featureDiscovery');
