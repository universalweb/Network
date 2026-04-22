
- create router for page nav
- Set custom attribute like data-id to save reference of a component by name in global app 
- Global State where stop assigning same variable to multiple objects just use global store
- Make sure global state changes are reactive and can trigger a view update that is specific and only does the exact DOM operation to edit the DOM not replace the entire HTML
- Add method to class to auto inject stylesheet



Separate class selectors from shared styles into the css files of their components. Instead change those classes to a general class name and apply that general class to the html element that needs that style or attribute.
For example `.stats-panel,
.wallet-params-panel,
.output-feed {
	overflow-y: auto;
}` this should instead be `.overflow-y {
	overflow-y: auto;
}` Then find the stats-panel,
wallet-params-panel,
output-feed html tags and add the overflow-y class to them. There is CSS that is in the shared stylesheets that all need this applied to them. This ensures classes aren't spread out and avoids duplicate css attributes like overflow etc.


Merge variable change events with global change events but the global change events should fire with the event name beinging with the word global.then-variable-name like a property path
