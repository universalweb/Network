Extract shared utils (deepEqual, getValueAtPath, setValueAtPath, pathsOverlap, queueAsyncError) into one file — eliminates 10+ duplicates.

Note: Explore flagged a "XSS via innerHTML" at template.js:483 — I'd verify that finding directly before acting; template engines that substitute only at ${...} interpolation points with proper escaping are safe. Treat it as "audit needed", not confirmed.

Say which ones to implement.

Add auto event cleanup for events do not use native event listeners instead use WebComponent addEvent to track components events and have them removed after destroy or unrender etc 


Any attributes that don't have a purpose in HTML after the first use such as <input value="test"> the value attribute serves no purpose after in HTML once loaded so instead set it via JS and make sure in the template the attribute is removed from the actual HTML ensuring the DOM is kept free of cluter. Any attribute like that which can be assigned via JS and is unaffected by remove the attribute should ensure during template construction or otherwise the attribute is removed from the DOM element.


Fix onrender issues for the dock bar so when it does actually render on the page it will trigger bar update.


Also getting this issue for [center-bar-icon-button] render error: TypeError: ((intermediate value) || []).join is not a function which is for the className array on it.
