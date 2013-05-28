/**
 * jquery.bookblock.js v2.0.1
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;( function( $, window, undefined ) {

	'use strict';

	// global
	var $window = $(window),
		Modernizr = window.Modernizr;

	// https://gist.github.com/edankwan/4389601
	Modernizr.addTest('csstransformspreserve3d', function () {
		var prop = Modernizr.prefixed('transformStyle');
		var val = 'preserve-3d';
		var computedStyle;
		if(!prop) return false;

		prop = prop.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

		Modernizr.testStyles('#modernizr{' + prop + ':' + val + ';}', function (el, rule) {
			computedStyle = window.getComputedStyle ? getComputedStyle(el, null).getPropertyValue(prop) : '';
		});

		return (computedStyle === val);
	});

	/*
	* debouncedresize: special jQuery event that happens once after a window resize
	*
	* latest version and complete README available on Github:
	* https://github.com/louisremi/jquery-smartresize
	*
	* Copyright 2012 @louis_remi
	* Licensed under the MIT license.
	*
	* This saved you an hour of work? 
	* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
	*/
	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	$.BookBlock = function( options, element ) {
		this.$el = $( element );
		this._init( options );
	};

	// the options
	$.BookBlock.defaults = {
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
	};

	$.BookBlock.prototype = {
		_init : function(options) {
			// options
			this.options = $.extend( true, {}, $.BookBlock.defaults, options );
			// orientation class
			this.$el.addClass( 'bb-' + this.options.orientation );
			// items
			this.$items = this.$el.children( '.bb-item' ).hide();
			// total items
			this.itemsCount = this.$items.length;
			// current item´s index
			this.current = 0;
			// previous item´s index
			this.previous = -1;
			// show first item
			this.$current = this.$items.eq( this.current ).show();
			// get width of this.$el
			// this will be necessary to create the flipping layout
			this.elWidth = this.$el.width();
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed( 'transition' )] + '.bookblock';
			// support css 3d transforms && css transitions && Modernizr.csstransformspreserve3d
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d && Modernizr.csstransformspreserve3d;
			// initialize/bind some events
			this._initEvents();
			// start slideshow
			if ( this.options.autoplay ) {
				this.options.circular = true;
				this._startSlideshow();
			}
		},
		_initEvents : function() {

			var self = this;

			if ( this.options.nextEl !== '' ) {
				$( this.options.nextEl ).on( 'click.bookblock touchstart.bookblock', function() { self._action( 'next' ); return false; } );
			}

			if ( this.options.prevEl !== '' ) {
				$( this.options.prevEl ).on( 'click.bookblock touchstart.bookblock', function() { self._action( 'prev' ); return false; } );
			}

			$window.on( 'debouncedresize', function() {		
				// update width value
				self.elWidth = self.$el.width();
			} );

		},
		_action : function( dir, page ) {
			this._stopSlideshow();
			this._navigate( dir, page );
		},
		_navigate : function( dir, page ) {

			if ( this.isAnimating ) {
				return false;
			}

			// callback trigger
			this.options.onBeforeFlip( this.current );

			this.isAnimating = true;
			// update current value
			this.$current = this.$items.eq( this.current );

			if ( page !== undefined ) {
				this.current = page;
			}
			else if ( dir === 'next' && this.options.direction === 'ltr' || dir === 'prev' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.current === this.itemsCount - 1 ) {
					this.end = true;
				}
				else {
					this.previous = this.current;
					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;
				}
			}
			else if ( dir === 'prev' && this.options.direction === 'ltr' || dir === 'next' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.current === 0 ) {
					this.end = true;
				}
				else {
					this.previous = this.current;
					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;
				}
			}

			this.$nextItem = !this.options.circular && this.end ? this.$current : this.$items.eq( this.current );
			
			if ( !this.support ) {
				this._layoutNoSupport( dir );
			} else {
				this._layout( dir );
			}

		},
		_layoutNoSupport : function(dir) {
			this.$items.hide();
			this.$nextItem.show();
			this.end = false;
			this.isAnimating = false;
			var isLimit = dir === 'next' && this.current === this.itemsCount - 1 || dir === 'prev' && this.current === 0;
			// callback trigger
			this.options.onEndFlip( this.previous, this.current, isLimit );
		},
		// creates the necessary layout for the 3d structure
		_layout : function(dir) {

			var self = this,
				// basic structure: 1 element for the left side.
				$s_left = this._addSide( 'left', dir ),
				// 1 element for the flipping/middle page
				$s_middle = this._addSide( 'middle', dir ),
				// 1 element for the right side
				$s_right = this._addSide( 'right', dir ),
				// overlays
				$o_left = $s_left.find( 'div.bb-overlay' ),
				$o_middle_f = $s_middle.find( 'div.bb-flipoverlay:first' ),
				$o_middle_b = $s_middle.find( 'div.bb-flipoverlay:last' ),
				$o_right = $s_right.find( 'div.bb-overlay' ),
				speed = this.end ? 400 : this.options.speed;

			this.$items.hide();
			this.$el.prepend( $s_left, $s_middle, $s_right );
			
			$s_middle.css({
				transitionDuration: speed + 'ms',
				transitionTimingFunction : this.options.easing
			}).on( this.transEndEventName, function( event ) {
				if ( $( event.target ).hasClass( 'bb-page' ) ) {
					self.$el.children( '.bb-page' ).remove();
					self.$nextItem.show();
					self.end = false;
					self.isAnimating = false;
					var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;
					// callback trigger
					self.options.onEndFlip( self.previous, self.current, isLimit );
				}
			});

			if ( dir === 'prev' ) {
				$s_middle.addClass( 'bb-flip-initial' );
			}

			// overlays
			if (this.options.shadows && !this.end) {

				var o_left_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
						opacity: this.options.shadowSides
					},
					o_middle_f_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					},
					o_middle_b_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					},
					o_right_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
						opacity: this.options.shadowSides
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
					};

				$o_middle_f.css(o_middle_f_style);
				$o_middle_b.css(o_middle_b_style);
				$o_left.css(o_left_style);
				$o_right.css(o_right_style);

			}

			setTimeout( function() {
				// first && last pages lift slightly up when we can't go further
				$s_middle.addClass( self.end ? 'bb-flip-' + dir + '-end' : 'bb-flip-' + dir );

				// overlays
				if ( self.options.shadows && !self.end ) {

					$o_middle_f.css({
						opacity: dir === 'next' ? self.options.shadowFlip : 0
					});

					$o_middle_b.css({
						opacity: dir === 'next' ? 0 : self.options.shadowFlip
					});

					$o_left.css({
						opacity: dir === 'next' ? self.options.shadowSides : 0
					});

					$o_right.css({
						opacity: dir === 'next' ? 0 : self.options.shadowSides
					});

				}
			}, 25 );
		},
		// adds the necessary sides (bb-page) to the layout 
		_addSide : function( side, dir ) {
			var $side;

			switch (side) {
				case 'left':
						/*
						<div class="bb-page" style="z-index:102;">
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-back"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + ( dir === 'next' ? this.$current.html() : this.$nextItem.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>').css( 'z-index', 102 );
					break;
				case 'middle':
						/*
						<div class="bb-page" style="z-index:103;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir === 'next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-flipoverlay"></div></div></div></div>').css( 'z-index', 103 );
					break;
				case 'right':
						/*
						<div class="bb-page" style="z-index:101;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + ( dir === 'next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>').css( 'z-index', 101 );
					break;
			}

			return $side;
		},
		_startSlideshow : function() {
			var self = this;
			this.slideshow = setTimeout( function() {
				self._navigate( 'next' );
				if ( self.options.autoplay ) {
					self._startSlideshow();
				}
			}, this.options.interval );
		},
		_stopSlideshow : function() {
			if ( this.options.autoplay ) {
				clearTimeout( this.slideshow );
				this.options.autoplay = false;
			}
		},
		// public method: flips next
		next : function() {
			this._action( this.options.direction === 'ltr' ? 'next' : 'prev' );
		},
		// public method: flips back
		prev : function() {
			this._action( this.options.direction === 'ltr' ? 'prev' : 'next' );
		},
		// public method: goes to a specific page
		jump : function( page ) {

			page -= 1;

			if ( page === this.current || page >= this.itemsCount || page < 0 ) {
				return false;
			}

			var dir;
			if( this.options.direction === 'ltr' ) {
				dir = page > this.current ? 'next' : 'prev';
			}
			else {
				dir = page > this.current ? 'prev' : 'next';
			}
			this._action( dir, page );

		},
		// public method: goes to the last page
		last : function() {
			this.jump( this.itemsCount );
		},
		// public method: goes to the first page
		first : function() {
			this.jump( 1 );
		},
		// public method: check if isAnimating is true
		isActive: function() {
			return this.isAnimating;
		},
		// public method: dynamically adds new elements
		// call this method after inserting new "bb-item" elements inside the BookBlock
		update : function () {
			var $currentItem = this.$items.eq( this.current );
			this.$items = this.$el.children( '.bb-item' );
			this.itemsCount = this.$items.length;
			this.current = $currentItem.index();
		},
		destroy : function() {
			if ( this.options.autoplay ) {
				this._stopSlideshow();
			}
			this.$el.removeClass( 'bb-' + this.options.orientation );
			this.$items.show();

			if ( this.options.nextEl !== '' ) {
				$( this.options.nextEl ).off( '.bookblock' );
			}

			if ( this.options.prevEl !== '' ) {
				$( this.options.prevEl ).off( '.bookblock' );
			}

			$window.off( 'debouncedresize' );
		}
	}

 	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );
		}
	};

	$.fn.bookblock = function( options ) {
		if ( typeof options === 'string' ) {
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'bookblock' );
				if ( !instance ) {
					logError( "cannot call methods on bookblock prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for bookblock instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		} 
		else {
			this.each(function() {	
				var instance = $.data( this, 'bookblock' );
				if ( instance ) {
					instance._init();
				}
				else {
					instance = $.data( this, 'bookblock', new $.BookBlock( options, this ) );
				}
			});
		}
		return this;
	};

} )( jQuery, window );