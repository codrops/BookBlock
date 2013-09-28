
Created by Codrops
License: http://tympanus.net/codrops/licensing/

Background Pattern(s) from http://subtlepatterns.com/
http://creativecommons.org/licenses/by-sa/3.0/deed.en_US

normalize.css by Nicolas Gallagher: http://github.com/necolas/normalize.css

Please note the attributions to artists in the single demo files. Thank you!


### BookBlock Configuration Options

```
// page to start on
startPage : 1,
// vertical or horizontal flip
orientation : 'vertical',
// ltr (left to right) or rtl (right to left)
direction : 'ltr',
// speed for the flip transition in ms
speed : 1000,
// easing for the flip transition
easing : 'ease-in-out',
// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
shadows : true,
// opacity value for the "shadow" on both sides (when the flipping page is over it)
// value : 0.1 - 1
shadowSides : 0.2,
// opacity value for the "shadow" on the flipping page (while it is flipping)
// value : 0.1 - 1
shadowFlip : 0.1,
// if we should show the first item after reaching the end
circular : false,
// if we want to specify a selector that triggers the next() function. example: ´#bb-nav-next´
nextEl : '',
// if we want to specify a selector that triggers the prev() function
prevEl : '',
// autoplay. If true it overwrites the circular option to true
autoplay : false,
// time (ms) between page switch, if autoplay is true
interval : 3000,
// callback after the flip transition
// old is the index of the previous item
// page is the current item´s index
// isLimit is true if the current page is the last one (or the first one)
onEndFlip : function(old, page, isLimit) { return false; },
// callback before the flip transition
// page is the current item´s index
onBeforeFlip : function(page) { return false; }
```
