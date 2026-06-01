- FIX THEME FLASH

------------------------------------Features:
- Make sure globalState state changes are reactive for components that use it (AppView.globalState.account.balance = 20)
- - Add option to not use shadow DOM for a component and instead use a wrapper div with a unique class name to scope styles. This will allow us to use global styles and media queries more easily, and also make it easier to inspect elements in the browser dev tools.
- -Add a way to import styles into a subcomponent from the component class
	- Maybe support appending styles to a specific element in template syntax
	- Need to be able to import styles into a subcomponent from the component class
-Add title change for appView or globalState most likely globalState in the event AppView is closed can just be direct DOM change to title

------------------------------------ROUTINE:
Review other components make sure they are using the latest syntax as well then remove old code or an older style we no longer use

Escape user content offer tools and methods for this.

