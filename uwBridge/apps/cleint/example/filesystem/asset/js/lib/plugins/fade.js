(async function(){
//fade in
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.Ractive.transitions.fade=t()}(this,function(){"use strict";function e(e,n){var i;n=e.processParams(n,t),e.isIntro?(i=e.getStyle("opacity"),e.setStyle("opacity",0)):i=0,e.animateStyle("opacity",i,n).then(e.complete)}var t={delay:0,duration:300,easing:"linear"};return e});

})();