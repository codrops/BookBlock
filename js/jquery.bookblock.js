/**
 * jquery.bookblock.js v1.0.2
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */

;( function( $, window, undefined ) {
	
	'use strict';

	// global
	var Modernizr = window.Modernizr;

	$.BookBlock = function( options, element ) {
		
		this.$el = $( element );
		this._init( options );
		
	};

	// the options
	$.BookBlock.defaults = {
		// speed for the flip transition in ms.
		speed : 1000,
		// easing for the flip transition.
		easing : 'ease-in-out',
		// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
		shadows : true,
		// opacity value for the "shadow" on both sides (when the flipping page is over it).
		// value : 0.1 - 1
		shadowSides : 0.2,
		// opacity value for the "shadow" on the flipping page (while it is flipping).
		// value : 0.1 - 1
		shadowFlip : 0.1,
		// perspective value
		perspective : 1300,
		// if we should show the first item after reaching the end.
		circular : false,
		// if we want to specify a selector that triggers the next() function. example: '#bb-nav-next'.
		nextEl : '',
		// if we want to specify a selector that triggers the prev() function.
		prevEl : '',
		// autoplay. If true it overwrites the circular option to true!
		autoplay : false,
		// time (ms) between page switch, if autoplay is true. 
		interval : 3000,
		// callback after the flip transition.
		// page is the current item's index.
		// isLimit is true if the current page is the last one (or the first one).
		onEndFlip : function( page, isLimit ) { return false; },
		// callback before the flip transition.
		// page is the current item's index.
		onBeforeFlip : function( page ) { return false; }
	};

	$.BookBlock.prototype = {

		_init : function( options ) {
			
			// options.
			this.options = $.extend( true, {}, $.BookBlock.defaults, options );
			// set the perspective
			this.$el.css( 'perspective', this.options.perspective );
			// items.
			this.$items = this.$el.children( '.bb-item' );
			// total items.
			this.itemsCount = this.$items.length;
			// current item.
			this.current = 0;
			// show first item.
			this.$current = this.$items.eq( this.current ).show();
			// get width of this.$el
			// this will be necessary to create the flipping layout.
			this.elWidth = this.$el.width();
			// https://github.com/twitter/bootstrap/issues/2870.
			var transEndEventNames = {
				'WebkitTransition' : 'webkitTransitionEnd',
				'MozTransition' : 'transitionend',
				'OTransition' : 'oTransitionEnd',
				'msTransition' : 'MSTransitionEnd',
				'transition' : 'transitionend'
			};
			this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
			// support (3dtransforms && transitions).
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;

			this._initEvents();

			if( this.options.autoplay ) {
			
				this.options.circular = true;
				this._startSlideshow();
			
			}

		},
		_initEvents : function() {

			var self = this;

			if( this.options.nextEl !== '' ) {

				$( this.options.nextEl ).on( 'click.bookblock', function() {

					self._stopSlideshow();
					self._navigate( 'next' );
					return false;

				} );

			}

			if( this.options.prevEl !== '' ) {

				$( this.options.prevEl ).on( 'click.bookblock', function() {

					self._stopSlideshow();
					self._navigate( 'prev' );
					return false;

				} );

			}

		},
		// public method: flips next
		next : function() {

			this._stopSlideshow();
			this._navigate( 'next' );

		},
		// public method: flips back
		prev : function() {

			this._stopSlideshow();
			this._navigate( 'prev' );

		},
		// public method: goes to a specific page.
		jump : function( page ) {

			page -= 1;

			if( page === this.current || page >= this.itemsCount || page < 0 ) {

				return false;

			}

			this._stopSlideshow();
			this._navigate( page > this.current ? 'next' : 'prev', page );

		},
		// public method: check if isAnimating is true
		isActive : function() {

			return this.isAnimating;

		},
		_navigate : function( dir, page ) {

			if( this.isAnimating ) {

				return false;

			}

			// callback trigger
			this.options.onBeforeFlip( this.current );

			this.isAnimating = true;
			this.$current = this.$items.eq( this.current );

			if( page !== undefined ) {

				this.current = page;

			}
			else if( dir === 'next' ) {

				if( !this.options.circular && this.current === this.itemsCount - 1 ) {

					this.end = true;
				
				}
				else {

					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;

				}

			}
			else if( dir === 'prev' ) {

				if( !this.options.circular && this.current === 0 ) {

					this.end = true;
				
				}
				else {

					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;

				}

			}

			if( !this.options.circular && this.end ) {

				this.$nextItem = this.$current;

			}
			else {

				this.$nextItem = this.$items.eq( this.current );

			}
			
			if( !this.support ) {
				
				this._layoutNoSupport( dir );

			}
			else {

				this._layout( dir );

			}

		},
		// with no support we consider no 3d transforms and transitions
		_layoutNoSupport : function( dir ) {

			this.$items.hide();

			this.$nextItem.show();

			this.end = false;
			this.isAnimating = false;

			var isLimit = dir === 'next' && this.current === this.itemsCount - 1 || dir === 'prev' && this.current === 0;
			// callback trigger
			this.options.onEndFlip( this.current, isLimit );

		},
		// creates the necessary layout for the 3d animation, and triggers the transitions
		_layout : function( dir ) {

			var self = this,

				// basic structure:
				// 1 element for the left side.
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
				speed = this.options.speed;

			this.$items.hide();
			this.$el.prepend( $s_left, $s_middle, $s_right );

			if( this.end ) {

				speed = 400;

			}

			$s_middle.css( {
				transition	: 'all ' + speed + 'ms ' + this.options.easing
			} ).on( this.transEndEventName, function( event ) {

				if( event.target.className === 'bb-page' ) {

					self.$el.children( 'div.bb-page' ).remove();
					self.$nextItem.show();

					self.end = false;
					self.isAnimating = false;

					var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;
					
					// callback trigger
					self.options.onEndFlip( self.current, isLimit );

				}

			} );

			if( dir === 'prev' ) {

				$s_middle.css( {
					transform	: 'rotateY(-180deg)'
				} );

			}

			// overlays
			if( this.options.shadows && !this.end ) {

				var o_left_style = ( dir === 'next' ) ? { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms' } : { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear', opacity	: this.options.shadowSides },
					o_middle_f_style = ( dir === 'next' ) ? { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' } : { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms', opacity	: this.options.shadowFlip },
					o_middle_b_style = ( dir === 'next' ) ? { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms', opacity : this.options.shadowFlip } : { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' },
					o_right_style = ( dir === 'next' ) ? { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear', opacity : this.options.shadowSides } : { transition	: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms' };

				$o_middle_f.css( o_middle_f_style );
				$o_middle_b.css( o_middle_b_style );
				$o_left.css( o_left_style );
				$o_right.css( o_right_style );

			}

			setTimeout( function() {

				var style = ( dir === 'next' ) ? 'rotateY(-180deg)' : 'rotateY(0deg)';

				if( self.end ) {

					// first && last pages lift up 15 deg when we can't go further. 
					style = ( dir === 'next' ) ? 'rotateY(-15deg)' : 'rotateY(-165deg)';

				}

				$s_middle.css( {
					transform	: style
				} );

				// overlays
				if( self.options.shadows && !self.end ) {
					
					$o_middle_f.css( {
						opacity	: ( dir === 'next' ) ? self.options.shadowFlip : 0
					} );
					
					$o_middle_b.css( {
						opacity	: ( dir === 'next' ) ? 0 : self.options.shadowFlip
					} );
					
					$o_left.css( {
						opacity	: ( dir === 'next' ) ? self.options.shadowSides : 0
					} );
						
					$o_right.css( {
						opacity	: ( dir === 'next' ) ? 0 : self.options.shadowSides
					} );

				}


			}, 30 );

		},
		// adds the necessary sides (bb-page) to the layout 
		_addSide : function( side, dir ) {

			var $side;

			switch( side ) {

				case 'left' :
					/*
					<div class="bb-page" style="z-index:2;">
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
					$side = $( '<div class="bb-page"><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir==='next' ? this.$current.html() : this.$nextItem.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>' ).css( 'z-index', 102 );
					break;
				
				case 'middle' :
					/*
					<div class="bb-page" style="z-index:3;">
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
					$side = $( '<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + ( - this.elWidth / 2 ) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir==='next' ? this.$current.html() : this.$nextItem.html() ) + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir==='next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-flipoverlay"></div></div></div></div>' ).css( 'z-index', 103 );
					break;
				
				case 'right' :
					/*
					<div class="bb-page" style="z-index:1;">
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
					$side = $( '<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + ( - this.elWidth / 2 ) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir==='next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>' ).css( 'z-index', 101 );
					break;

			}

			return $side;

		},
		_startSlideshow		: function() {
		
			var self = this;
			
			this.slideshow = setTimeout( function() {
				
				self._navigate( 'next' );
				
				if( self.options.autoplay ) {
				
					self._startSlideshow();
				
				}
			
			}, this.options.interval );
		
		},
		_stopSlideshow		: function() {

			if( this.options.autoplay ) {
			
				clearTimeout( this.slideshow );
				this.options.autoplay = false;
			
			}

		}

	};
	
	var logError = function( message ) {

		if ( window.console ) {

			window.console.error( message );
		
		}

	};
	
	$.fn.bookblock = function( options ) {

		var instance = $.data( this, 'bookblock' );
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
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
				
				if ( instance ) {

					instance._init();
				
				}
				else {

					instance = $.data( this, 'bookblock', new $.BookBlock( options, this ) );
				
				}

			});
		
		}
		
		return instance;
		
	};
	
} )( jQuery, window );