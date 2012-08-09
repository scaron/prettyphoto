/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 3.1.4
------------------------------------------------------------------------- */
/*global jQuery,unescape*/
(function($) {
	'use strict';
	$.prettyPhoto = {version: '3.1.4'};
	var IS_IE6 = $.browser.msie && parseInt($.browser.version, 0) === 6;
	var IS_IE7 = $.browser.msie && parseInt($.browser.version, 0) === 7;
	var RX_GALLERY = /\[(?:.*)\]/;
	var RX_ID_VIMEO = /http:\/\/(www\.)?vimeo.com\/(\d+)/;
	var RX_TYPE_YOUTUBE = /youtube\.com\/watch|youtu\.be/i;
	var RX_TYPE_VIMEO = /vimeo\.com/i;
	var RX_TYPE_QUICKTIME = /\b.mov\b/i;
	var RX_TYPE_FLASH = /\b.swf\b/i;
	var RX_TYPE_IFRAME = /\biframe=true\b/i;
	var RX_TYPE_AJAX = /\bajax=true\b/i;
	var RX_TYPE_CUSTOM = /\bcustom=true\b/i;
	var GALLERY_ITEM_WIDTH = 52 + 5; // 52 beign the thumb width, 5 being the right margin.
	$.prettyPhoto.defaults = {
		hook: 'rel', /* the attribute tag to use for prettyPhoto hooks. default: 'rel'. For HTML5, use "data-rel" or similar. */
		animation_speed: 'fast', /* fast/slow/normal */
		ajaxcallback: function() {},
		slideshow: 5000, /* false OR interval time in ms */
		autoplay_slideshow: false, /* true/false */
		opacity: 0.80, /* Value between 0 and 1 */
		show_title: true, /* true/false */
		allow_resize: true, /* Resize the photos bigger than viewport. true/false */
		allow_expand: true, /* Allow the user to expand a resized image. true/false */
		default_width: 500,
		default_height: 344,
		counter_separator_label: '/', /* The separator for the gallery counter 1 "of" 2 */
		theme: 'pp_default', /* light_rounded / dark_rounded / light_square / dark_square / facebook */
		horizontal_padding: 20, /* The padding on each side of the picture */
		hideflash: false, /* Hides all the flash object on a page, set to TRUE if flash appears over prettyPhoto */
		wmode: 'opaque', /* Set the flash wmode attribute */
		autoplay: true, /* Automatically start videos: True/False */
		modal: false, /* If set to true, only the close button will close the window */
		deeplinking: true, /* Allow prettyPhoto to update the url to enable deeplinking. */
		overlay_gallery: true, /* If set to true, a gallery will overlay the fullscreen image on mouse over */
		overlay_gallery_max: 30, /* Maximum number of pictures in the overlay gallery */
		keyboard_shortcuts: true, /* Set to false if you open forms inside prettyPhoto */
		changepicturecallback: function() {}, /* Called everytime an item is shown/changed */
		callback: function() {}, /* Called when prettyPhoto is closed */
		ie6_fallback: true,
		markup: (
			'<div class="pp_pic_holder">'+
			'<div class="ppt">&nbsp;</div>'+
			'<div class="pp_top">'+
			'<div class="pp_left"></div>'+
			'<div class="pp_middle"></div>'+
			'<div class="pp_right"></div>'+
			'</div>'+
			'<div class="pp_content_container">'+
			'<div class="pp_left">'+
			'<div class="pp_right">'+
			'<div class="pp_content">'+
			'<div class="pp_loaderIcon"></div>'+
			'<div class="pp_fade">'+
			'<a href="#" class="pp_expand" title="Expand the image">Expand</a>'+
			'<div class="pp_hoverContainer">'+
			'<a class="pp_next" href="#">next</a>'+
			'<a class="pp_previous" href="#">previous</a>'+
			'</div>'+
			'<div id="pp_full_res"></div>'+
			'<div class="pp_details">'+
			'<div class="pp_nav">'+
			'<a href="#" class="pp_arrow_previous">Previous</a>'+
			'<p class="currentTextHolder">0/0</p>'+
			'<a href="#" class="pp_arrow_next">Next</a>'+
			'</div>'+
			'<p class="pp_description"></p>'+
			'<div class="pp_social">{pp_social}</div>'+
			'<a class="pp_close" href="#">Close</a>'+
			'</div>'+
			'</div>'+
			'</div>'+
			'</div>'+
			'</div>'+
			'</div>'+
			'<div class="pp_bottom">'+
			'<div class="pp_left"></div>'+
			'<div class="pp_middle"></div>'+
			'<div class="pp_right"></div>'+
			'</div>'+
			'</div>'+
			'<div class="pp_overlay"></div>'
		),
		gallery_markup: (
			'<div class="pp_gallery">'+
			'<a href="#" class="pp_arrow_previous">Previous</a>'+
			'<div><ul>{gallery}</ul></div>'+
			'<a href="#" class="pp_arrow_next">Next</a>'+
			'</div>'
		),
		image_markup: '<img id="fullResImage" src="{path}" />',
		flash_markup: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{width}" height="{height}"><param name="wmode" value="{wmode}" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{path}" /><embed src="{path}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="{width}" height="{height}" wmode="{wmode}"></embed></object>',
		quicktime_markup: '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="{height}" width="{width}"><param name="src" value="{path}"><param name="autoplay" value="{autoplay}"><param name="type" value="video/quicktime"><embed src="{path}" height="{height}" width="{width}" autoplay="{autoplay}" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>',
		iframe_markup: '<iframe src ="{path}" width="{width}" height="{height}" frameborder="no"></iframe>',
		inline_markup: '<div class="pp_inline">{content}</div>',
		custom_markup: '',
		social_tools: false /* html or false to disable, suggested markup: <div class="twitter"><iframe allowtransparency="true" frameborder="0" scrolling="no" src="//platform.twitter.com/widgets/tweet_button.html?count=none&amp;url={location_href}" style="width:58px; height:20px;"></iframe></div><div class="facebook"><iframe src="//www.facebook.com/plugins/like.php?href={location_href}&amp;send=false&amp;layout=button_count&amp;width=500&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:50px; height:21px;" allowTransparency="true"></iframe></div> */
	};
	
	$.fn.prettyPhoto = function(options) {
		var settings = $.extend(true, {}, $.prettyPhoto.defaults, options);
		
		// Global variables accessible only by prettyPhoto
		var matchedObjects = this;
		var isLightboxOpen = false;
		var isInitialized = false;
		
		// prettyPhoto container specific
		var pp_contentHeight;
		var pp_contentWidth;
		var pp_containerHeight;
		var pp_containerWidth;
		
		// prettyPhoto Set data
		var set_position = 0;
		var rel_index = 0;
		var theRel = '';
		var pp_images = [];
		var pp_titles = [];
		var pp_descriptions = [];
		
		// Gallery data
		var isGallerySet = false;
		var itemsPerGalleryPage = 0; 
		var currentGalleryPage = 0;
		var totalGalleryPages = 0;
		
		// Global elements
		var pp_slideshow;
		var needsResize = true;
		
		// Global selectors
		var $pp_pic_holder = null;
		var $ppt = null;
		var $pp_overlay = null;
		var $pp_gallery = null;
		var $pp_gallery_li = null;
	
		// Window/Keyboard events
		$(window).unbind('resize.prettyphoto').bind('resize.prettyphoto',function() { _center_overlay(); _resize_overlay(); });
		
		if (settings.keyboard_shortcuts) {
			$(document).unbind('keydown.prettyphoto').bind('keydown.prettyphoto',function(e) {
				if ($pp_pic_holder !== null && $pp_pic_holder.is(':visible')) {
					switch (e.keyCode) {
						case 37:
							$.prettyPhoto.changePage('previous');
							e.preventDefault();
							break;
						case 39:
							$.prettyPhoto.changePage('next');
							e.preventDefault();
							break;
						case 27:
							if (!settings.modal) { $.prettyPhoto.close(); }
							e.preventDefault();
							break;
					}
					// return false;
				}
			});
		}
		
		/**
		* Initialize prettyPhoto.
		*/
		$.prettyPhoto.initialize = function() {
			isInitialized = true;
			
			if (settings.theme === 'pp_default') {settings.horizontal_padding = 16;}
			if (settings.ie6_fallback && IS_IE6) {settings.theme = "light_square";} // Fallback to a supported theme for IE6
			
			// Find out if the picture is part of a set
			theRel = $(this).attr(settings.hook);
			isGallerySet = RX_GALLERY.exec(theRel) ? true : false;
			
			// Put the SRCs, TITLEs, ALTs into an array.
			if (isGallerySet) {
				pp_images = $.map(matchedObjects, function (n) { return ($(n).attr(settings.hook).indexOf(theRel) !== -1) ? $(n).attr('href') : null; });
				pp_titles = $.map(matchedObjects, function (n) { return ($(n).attr(settings.hook).indexOf(theRel) !== -1) ? ($(n).find('img').attr('alt') || '') : null; });
				pp_descriptions = $.map(matchedObjects, function (n) { return ($(n).attr(settings.hook).indexOf(theRel) !== -1) ? ($(n).attr('title') || '') : null; });
			} else {
				pp_images = $.makeArray($(this).attr('href'));
				pp_titles = $.makeArray($(this).find('img').attr('alt'));
				pp_descriptions = $.makeArray($(this).attr('title'));
			}
			
			if (pp_images.length > settings.overlay_gallery_max) { settings.overlay_gallery = false; }
			
			set_position = $.inArray($(this).attr('href'), pp_images); // Define where in the array the clicked item is positionned
			rel_index = isGallerySet ? set_position : $("a["+settings.hook+"^='"+theRel+"']").index($(this));
			
			_build_overlay(this); // Build the overlay {this} being the caller
			
			if (settings.allow_resize) { $(window).bind('scroll.prettyphoto', _center_overlay); }
			
			$.prettyPhoto.open();
			
			return false;
		};


		/**
		* Opens the prettyPhoto modal box.
		* @param image {String,Array} Full path to the image to be open, can also be an array containing full images paths.
		* @param title {String,Array} The title to be displayed with the picture, can also be an array containing all the titles.
		* @param description {String,Array} The description to be displayed with the picture, can also be an array containing all the descriptions.
		*/
		$.prettyPhoto.open = function(event) {
			if (!isInitialized) {
				// Means it's an API call, need to manually get the settings and initialize the variables
				if (IS_IE6) { settings.theme = "light_square"; } // Fallback to a supported theme for IE6
				pp_images = $.makeArray(arguments[0]);
				pp_titles = arguments[1] ? $.makeArray(arguments[1]) : [""];
				pp_descriptions = arguments[2] ? $.makeArray(arguments[2]) : [""];
				isGallerySet = pp_images.length > 1 ? true : false;
				set_position = arguments[3] || 0;
				_build_overlay(event.target); // Build the overlay {this} being the caller
			}
			/* else {
				// We're being called by an event, we should already have settings
				// Overlay should be built by now
			} */
			
			// To fix the bug with IE select boxes
			if (IS_IE6) {
				$('select').css('visibility', 'hidden');
			}
			
			// Hide the flash
			if (settings.hideflash) { $('object,embed,iframe[src*=youtube],iframe[src*=vimeo]').css('visibility','hidden'); } 
			
			// Hide the next/previous links if on first or last images.
			_checkPosition(pp_images.length);
			
			$('.pp_loaderIcon').show();
		
			if (settings.deeplinking) { setHashtag(); }
		
			// Rebuild Facebook Like Button with updated href
			if (settings.social_tools) {
				$pp_pic_holder.find('.pp_social').html(settings.social_tools.replace(/\{location_href\}/g, encodeURIComponent(location.href)));
			}
			
			// Fade the content in
			if ($ppt.is(':hidden')) { $ppt.css('opacity',0).show(); }
			$pp_overlay.show().fadeTo(settings.animation_speed, settings.opacity);

			// Display the current position
			$pp_pic_holder.find('.currentTextHolder').text((set_position+1) + settings.counter_separator_label + pp_images.length);
			
			// Set the title
			if (typeof pp_titles[set_position] !== "undefined" && pp_titles[set_position] !== "" && settings.show_title) {
				$ppt.html(unescape(pp_titles[set_position]));
			} else {
				$ppt.html('&nbsp;');
			}
			// Set the description
			if (typeof pp_descriptions[set_position] !== 'undefined' && pp_descriptions[set_position] !== "") {
				$pp_pic_holder.find('.pp_description').show().html(unescape(pp_descriptions[set_position]));
			} else {
				$pp_pic_holder.find('.pp_description').hide();
			}
			
			// Fade the holder
			$pp_pic_holder.fadeIn(function() {
				_injectContent(pp_images[set_position]);
			});
			
			return false;
		};

	
		/**
		* Change page in the prettyPhoto modal box
		* @param direction {String} Direction of the paging, previous or next.
		*/
		$.prettyPhoto.changePage = function (direction) {
			currentGalleryPage = 0;
			
			if (direction === 'previous') {
				set_position--;
				if (set_position < 0) { set_position = pp_images.length - 1; }
			} else if (direction === 'next') {
				set_position++;
				if (set_position > pp_images.length - 1) { set_position = 0; }
			} else {
				set_position = direction;
			}
			
			rel_index = set_position;

			if (!needsResize) { needsResize = true; } // Allow the resizing of the images
			if (settings.allow_expand) { $('.pp_contract').removeClass('pp_contract').addClass('pp_expand'); }

			_hideContent(function() { $.prettyPhoto.open(); });
		};


		/**
		* Change gallery page in the prettyPhoto modal box
		* @param direction {String,Number} Direction of the paging, previous or next OR Page number
		* @param skipAnimation {Boolean} to skip animation
		*/
		$.prettyPhoto.changeGalleryPage = function (direction, skipAnimation) {
			if (direction === 'next') {
				currentGalleryPage++;
				if (currentGalleryPage > totalGalleryPages) { currentGalleryPage = 0; }
			} else if (direction === 'previous') {
				currentGalleryPage--;
				if (currentGalleryPage < 0) { currentGalleryPage = totalGalleryPages; }
			} else {
				currentGalleryPage = direction;
				if (currentGalleryPage < 0) { currentGalleryPage = 0; }
				if (currentGalleryPage > totalGalleryPages) { currentGalleryPage = totalGalleryPages; }
			}
			
			var moveTo = {'left': -1 * currentGalleryPage * (itemsPerGalleryPage * GALLERY_ITEM_WIDTH)};
			
			if (skipAnimation) {
				$pp_gallery.find('ul').css(moveTo);
			} else {
				$pp_gallery.find('ul').animate(moveTo, settings.animation_speed);
			}
		};


		/**
		* Start the slideshow...
		*/
		$.prettyPhoto.startSlideshow = function() {
			if (typeof pp_slideshow === 'undefined') {
				$pp_pic_holder.find('.pp_play').unbind('click').removeClass('pp_play').addClass('pp_pause').click(function() {
					$.prettyPhoto.stopSlideshow();
					return false;
				});
				pp_slideshow = setInterval($.prettyPhoto.startSlideshow, settings.slideshow);
			} else {
				$.prettyPhoto.changePage('next');	
			}
		};


		/**
		* Stop the slideshow...
		*/
		$.prettyPhoto.stopSlideshow = function() {
			$pp_pic_holder.find('.pp_pause').unbind('click').removeClass('pp_pause').addClass('pp_play').click(function() {
				$.prettyPhoto.startSlideshow();
				return false;
			});
			clearInterval(pp_slideshow);
			pp_slideshow = undefined;
		};


		/**
		* Closes prettyPhoto.
		*/
		$.prettyPhoto.close = function() {
			if ($pp_overlay.is(":animated")) { return; }
			
			$.prettyPhoto.stopSlideshow();
			
			$pp_pic_holder.stop().find('object,embed').css('visibility','hidden');
			
			$('div.pp_pic_holder,div.ppt,.pp_fade').fadeOut(settings.animation_speed, function() { $(this).remove(); });
			
			$pp_overlay.fadeOut(settings.animation_speed, function() {
				if (IS_IE6) { $('select').css('visibility','visible'); } // To fix the bug with IE select boxes
				if (settings.hideflash) { $('object,embed,iframe[src*=youtube],iframe[src*=vimeo]').css('visibility','visible'); } // Show the flash
				$(this).remove(); // No more need for the prettyPhoto markup
				$(window).unbind('scroll.prettyphoto');
				clearHashtag();
				needsResize = true;
				isLightboxOpen = false;
				isInitialized = false;
				settings.callback();
			});
		};
		
		function _injectContent (content) {
			// Inject the proper content
			_injectContentTypes[_getFileType(content)](content);
		}
		
		var _injectContentTypes = { 
			'image': function (url) {
				// Preload the neighbour images
				if (isGallerySet && set_position + 1 < pp_images.length) { (new Image()).src = pp_images[set_position + 1]; }
				if (isGallerySet && set_position - 1 >= 0) { (new Image()).src = pp_images[set_position - 1]; }
				
				var preloader = new Image();
				preloader.onload = function() {
					var dimensions = _getContainerDimensions(url, true);
					_showContent(dimensions, settings.image_markup.replace(/\{path\}/g, url), isGallerySet);
				};
				preloader.onerror = function() {
					alert('Image cannot be loaded. Make sure the path is correct and image exist.');
					$.prettyPhoto.close();
				};
				preloader.src = url;
			},
			'youtube': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				// Regular youtube link
				var movie_id = getParam('v', url);
				// youtu.be link
				if (movie_id === "") {
					movie_id = url.split('youtu.be/')[1];
					if (movie_id.indexOf('?') > 0) { movie_id = movie_id.substr(0,movie_id.indexOf('?')); } // Strip anything after the ?
					if (movie_id.indexOf('&') > 0) { movie_id = movie_id.substr(0,movie_id.indexOf('&')); } // Strip anything after the &
				}
				var path = 'http://www.youtube.com/embed/' + movie_id + '?rel=' + (getParam('rel', url) || "1") + (settings.autoplay ? '&autoplay=1' : '');
				_showContent(dimensions, settings.iframe_markup.replace(/\{path\}/g, path));
			},
			'vimeo': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				try {
					var path = 'http://player.vimeo.com/video/' + RX_ID_VIMEO.exec(url)[2] +'?title=0&amp;byline=0&amp;portrait=0' + (settings.autoplay ? '&autoplay=1;' : '').replace(/\{width\}/g, dimensions.width + '/embed/?moog_width='+ dimensions.width);
					_showContent(dimensions, settings.iframe_markup.replace(/\{path\}/g,  path));
				} catch (e) {
					$.prettyPhoto.close();
				}
			},
			'quicktime': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				// Add space for the control bar
				dimensions.height += 15;
				dimensions.contentHeight += 15;
				dimensions.containerHeight += 15;
				var path = url;
				_showContent(dimensions, settings.quicktime_markup.replace(/\{wmode\}/g, settings.wmode).replace(/\{autoplay\}/g,settings.autoplay).replace(/\{path\}/g, path));
			},
			'flash': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				var path = url.substring(0, url.indexOf('?')) + '?' + url.substring(url.indexOf('flashvars') + 10, url.length);
				_showContent(dimensions, settings.flash_markup.replace(/\{wmode\}/g, settings.wmode).replace(/\{path\}/g, path));
			},
			'iframe': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				var path = url.substr(0, url.indexOf('iframe') - 1);
				_showContent(dimensions, settings.iframe_markup.replace(/\{path\}/g, path));
			},
			'ajax': function (url) {
				$.get(url, function (html) {
					var dimensions = _getContainerDimensions(url, false);
					_showContent(dimensions, settings.inline_markup.replace(/\{content\}/g, html));
				});
			},
			'inline': function (html) {
				var dimensions = _getContentContainerDimensions(html);
				_showContent(dimensions, settings.inline_markup.replace(/\{content\}/g, $(html).html()));
			},
			'custom': function (url) {
				var dimensions = _getContainerDimensions(url, true);
				_showContent(dimensions, settings.custom_markup);
			}
		};
		/**
		* Set the proper sizes on the containers and animate the content in.
		*/
		function _showContent (dimensions, content, hasNav) {
			$pp_pic_holder.find('#pp_full_res').html(content.replace(/\{width\}/g,dimensions.width).replace(/\{height\}/g,dimensions.height));
			$('.pp_loaderIcon').hide();

			// Calculate the opened top position of the pic holder
			var offset = _getProjectedOffset();
			
			$ppt.fadeTo(settings.animation_speed,1);

			// Resize the content holder
			$pp_pic_holder.find('.pp_content').animate({
				'height': dimensions.contentHeight,
				'width': dimensions.contentWidth
			}, settings.animation_speed);
			
			// Resize picture the holder
			$pp_pic_holder.animate({
				'top': offset.top,
				'left': offset.left,
				'width': dimensions.containerWidth
			}, settings.animation_speed, function() {
				$pp_pic_holder.find('.pp_hoverContainer,#fullResImage').height(dimensions.height).width(dimensions.width);
				// Fade the new content
				$pp_pic_holder.find('.pp_fade').fadeIn(settings.animation_speed);
				// Show the nav
				if (hasNav) {
					$pp_pic_holder.find('.pp_hoverContainer').show();
				} else {
					$pp_pic_holder.find('.pp_hoverContainer').hide();
				}
				// Fade the resizing link if the image is resized
				if (settings.allow_expand) {
					if (dimensions.resized) {
						$('a.pp_expand,a.pp_contract').show();
					} else {
						$('a.pp_expand').hide();
					}
				}
				
				if (settings.autoplay_slideshow && !pp_slideshow && !isLightboxOpen) {
					$.prettyPhoto.startSlideshow();
				}
				
				settings.changepicturecallback(); // Callback!
				
				isLightboxOpen = true;
			});
			
			_insert_gallery(dimensions);
			settings.ajaxcallback();
		}
		
		/**
		* Hide the content...DUH!
		*/
		function _hideContent(callback) {
			// Fade out the current picture
			$pp_pic_holder.find('#pp_full_res object,#pp_full_res embed').css('visibility','hidden');
			$pp_pic_holder.find('.pp_fade').fadeOut(settings.animation_speed, function() {
				$('.pp_loaderIcon').show();
				callback();
			});
		}
		
		/**
		* Check the item position in the gallery array, hide or show the navigation links
		* @param  {integer} setCount total number of items in the set
		*/
		function _checkPosition(setCount) {
			$('.pp_nav')[setCount > 1 ? 'show' : 'hide'](); // Hide the bottom nav if it's not a set.
		}
		
		/**
		* Resize the item dimensions if it's bigger than the viewport
		* @param {string} url of the item to be opened
		* @param {bool} allowResize may we resize the item to fit
		* @return {object} containing the "fitted" dimensions
		*/
		function _getContainerDimensions(url, allowResize) {
			var width = parseFloat(getParam('width', url)) || settings.default_width.toString();
			var height = parseFloat(getParam('height', url)) || settings.default_height.toString();
			var isPercent = false; // If the size is % based, calculate according to window dimensions
			if (width.indexOf('%') !== -1) {
				width = parseFloat(($(window).width() * parseFloat(width) / 100) - 150);
				isPercent = true;
			}
			if (height.indexOf('%') !== -1) {
				height = parseFloat(($(window).height() * parseFloat(height) / 100) - 150);
				isPercent = true;
			}
			
			_setContainerDimensions(width, height);
			
			// Define them in case there's no resize needed
			var itemWidth = width;
			var itemHeight = height;
			var windowWidth = $(window).width();
			var windowHeight = $(window).height();
			var resized = false;
			function isFitting() { return (pp_containerWidth <= windowWidth && pp_containerHeight <= windowHeight); }
			
			if ( !isFitting() && settings.allow_resize && allowResize && !isPercent) {
				while (!isFitting()) {
					if ((pp_containerWidth > windowWidth)) {
						itemWidth = (windowWidth - 200);
						itemHeight = (height / width) * itemWidth;
					} else {
						itemHeight = (windowHeight - 200);
						itemWidth = (width / height) * itemHeight;
					}
				}
				resized = true;
				
				_setContainerDimensions(itemWidth, itemHeight);
				
				
				if (!isFitting()) {
					// still!!
					var x_Width = pp_containerWidth;
					var x_Height = pp_containerHeight;
					_setContainerDimensions(x_Width, x_Height);
					while (!isFitting()) {
						if ((pp_containerWidth > windowWidth)) {
							x_Width = (windowWidth - 200);
							x_Height = (pp_containerHeight / pp_containerWidth) * x_Width;
						} else {
							x_Height = (windowHeight - 200);
							x_Width = (pp_containerWidth / pp_containerHeight) * x_Height;
						}
					}
					_setContainerDimensions(x_Width, x_Height);
				}
			}
			
			return {
				width: Math.floor(itemWidth),
				height: Math.floor(itemHeight),
				containerHeight: Math.floor(pp_containerHeight),
				containerWidth: Math.floor(pp_containerWidth) + (settings.horizontal_padding * 2),
				contentHeight: Math.floor(pp_contentHeight),
				contentWidth: Math.floor(pp_contentWidth),
				resized: resized
			};
		}
		function _getContentContainerDimensions (html) {
			// to get the item height clone it, apply default width, wrap it in the prettyPhoto containers , then delete
			var myClone = $(html).clone()
				.append('<br clear="all" />')
				.css({'width': settings.default_width})
				.wrapInner('<div id="pp_full_res"><div class="pp_inline"></div></div>')
				.appendTo('body')
				.show();
			var width = myClone.width();
			var height = myClone.height();
			myClone.remove();
			_setContainerDimensions(myClone.width(), myClone.height());
			return {
				width: Math.floor(width),
				height: Math.floor(height),
				containerHeight: Math.floor(pp_containerHeight),
				containerWidth: Math.floor(pp_containerWidth) + (settings.horizontal_padding * 2),
				contentHeight: Math.floor(pp_contentHeight),
				contentWidth: Math.floor(pp_contentWidth)
			};
		}
		
		/**
		* Set the containers dimensions according to the item size
		* @param width {number} Width of the item to be opened
		* @param height {number} Height of the item to be opened
		*/
		function _setContainerDimensions(width, height) {
			width = parseFloat(width);
			height = parseFloat(height);
			
			// Get the details height, to do so, I need to clone it since it's invisible
			var $pp_details = $pp_pic_holder.find('.pp_details').width(width);
			var detailsHeight = parseFloat($pp_details.css('marginTop')) + parseFloat($pp_details.css('marginBottom'));
			$pp_details = $pp_details.clone().addClass(settings.theme).width(width).appendTo('body').css({'position':'absolute', 'top':-10000});
			detailsHeight += $pp_details.height();
			// Min-height for the details
			if (detailsHeight <= 34) { detailsHeight = 36; }
			if (IS_IE7) { detailsHeight += 8; }
			$pp_details.remove();
			
			// Get the titles height, to do so, I need to clone it since it's invisible
			var $pp_title = $pp_pic_holder.find('.ppt').width(width);
			var titleHeight = parseFloat($pp_title.css('marginTop')) + parseFloat($pp_title.css('marginBottom'));
			$pp_title = $pp_title.clone().appendTo('body').css({'position':'absolute', 'top':-10000});
			titleHeight += $pp_title.height();
			$pp_title.remove();
			
			// Get the container size, to resize the holder to the right dimensions
			pp_contentHeight = height + detailsHeight;
			pp_contentWidth = width;
			pp_containerHeight = pp_contentHeight + titleHeight + $pp_pic_holder.find('.pp_top').height() + $pp_pic_holder.find('.pp_bottom').height();
			pp_containerWidth = width;
		}
	
		function _getFileType(itemSrc) {
			if (RX_TYPE_YOUTUBE.exec(itemSrc)) {
				return 'youtube';
			} else if (RX_TYPE_VIMEO.exec(itemSrc)) {
				return 'vimeo';
			} else if (RX_TYPE_QUICKTIME.exec(itemSrc)) { 
				return 'quicktime';
			} else if (RX_TYPE_FLASH.exec(itemSrc)) {
				return 'flash';
			} else if (RX_TYPE_IFRAME.exec(itemSrc)) {
				return 'iframe';
			} else if (RX_TYPE_AJAX.exec(itemSrc)) {
				return 'ajax';
			} else if (RX_TYPE_CUSTOM.exec(itemSrc)) {
				return 'custom';
			} else if (itemSrc.substr(0,1) === '#') {
				return 'inline';
			} else {
				return 'image';
			}
		}
		

		
		function _getProjectedOffset (height, width) {
			var scroll_pos = _getScrollOffset();
			var offset = {
				'top': ($(window).height()/2) + scroll_pos.scrollTop - (height / 2),
				'left': ($(window).width()/2) + scroll_pos.scrollLeft - (width / 2)
			};
			if (offset.top < 0) { offset.top = 0; }
			if (offset.left < 0) { offset.left = 0; }
			return offset;
		}
		
		function _getScrollOffset() {
			if (window.pageYOffset) {
				return {scrollTop:window.pageYOffset, scrollLeft:window.pageXOffset};
			} else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
				return {scrollTop:document.documentElement.scrollTop, scrollLeft:document.documentElement.scrollLeft};
			} else if (document.body) {// all other Explorers
				return {scrollTop:document.body.scrollTop, scrollLeft:document.body.scrollLeft};
			}
		}
	

	
		function _insert_gallery(dimensions) {
			if (isGallerySet && settings.overlay_gallery && _getFileType(pp_images[set_position]) === "image" && (!IS_IE6 || settings.ie6_fallback)) {
				// Define the arrow width depending on the theme -- LAME shouldn't be hardcoded
				var navWidth = (settings.theme === "facebook" || settings.theme === "pp_default") ? 50 : 30;
				
				itemsPerGalleryPage = Math.floor((dimensions.containerWidth - 100 - navWidth) / GALLERY_ITEM_WIDTH);
				totalGalleryPages = Math.ceil(pp_images.length / itemsPerGalleryPage) - 1;
				if (itemsPerGalleryPage > pp_images.length) { itemsPerGalleryPage = pp_images.length; }
				var galleryWidth = itemsPerGalleryPage * GALLERY_ITEM_WIDTH;
				var fullGalleryWidth = pp_images.length * GALLERY_ITEM_WIDTH;

				// Hide the nav in the case there's no need for links
				if (totalGalleryPages === 0) {
					navWidth = 0; // No nav means no width!
					$pp_gallery.find('.pp_arrow_next,.pp_arrow_previous').hide();
				} else {
					$pp_gallery.find('.pp_arrow_next,.pp_arrow_previous').show();
				}
				
				// Set the proper width to the gallery items
				$pp_gallery
					.css('margin-left',-((galleryWidth/2) + (navWidth/2)))
					.find('div:first').width(galleryWidth+5)
						.find('ul').width(fullGalleryWidth)
							.find('li.selected').removeClass('selected');
				
				$.prettyPhoto.changeGalleryPage(Math.floor(set_position/itemsPerGalleryPage), true);
				
				$pp_gallery_li.filter(':eq('+set_position+')').addClass('selected');
			} else {
				$pp_pic_holder.find('.pp_content').unbind('mouseenter mouseleave');
				// $pp_gallery.hide();
			}
		}
	
		function _build_overlay () {
			// Inject Social Tool markup into General markup
			$('body').append(settings.markup.replace('{pp_social}','')); // Inject the markup
			
			// Set my global selectors
			$pp_pic_holder = $('.pp_pic_holder');
			$ppt = $('.ppt');
			$pp_overlay = $('div.pp_overlay');
			
			// Inject the inline gallery!
			if (isGallerySet && settings.overlay_gallery) {
				currentGalleryPage = 0;
				var gallery_html = "";
				for (var i = 0, isImage = false; i < pp_images.length; i++) {
					isImage = pp_images[i].match(/\b(jpg|jpeg|png|gif)\b/gi);
					gallery_html += '<li class="' + (isImage ? '' : 'default') + '"><a href="#"><img src="' + (isImage ? pp_images[i] : '') + '" width="50" alt="" /></a></li>';
				}
				
				$pp_pic_holder.find('#pp_full_res').after(settings.gallery_markup.replace(/\{gallery\}/g, gallery_html));
				
				$pp_gallery = $('.pp_pic_holder .pp_gallery');
				$pp_gallery_li = $pp_gallery.find('li'); // Set the gallery selectors
				
				$pp_gallery.find('.pp_arrow_next').click(function() {
					$.prettyPhoto.changeGalleryPage('next');
					$.prettyPhoto.stopSlideshow();
					return false;
				});
				
				$pp_gallery.find('.pp_arrow_previous').click(function() {
					$.prettyPhoto.changeGalleryPage('previous');
					$.prettyPhoto.stopSlideshow();
					return false;
				});
				
				$pp_pic_holder.find('.pp_content').hover(
					function() {
						$pp_pic_holder.find('.pp_gallery:not(.disabled)').fadeIn();
					},
					function() {
						$pp_pic_holder.find('.pp_gallery:not(.disabled)').fadeOut();
					});

				$pp_gallery_li.each(function(i) {
					$(this)
						.find('a')
						.click(function() {
							$.prettyPhoto.changePage(i);
							$.prettyPhoto.stopSlideshow();
							return false;
						});
				});
			}
			
			
			// Inject the play/pause if it's a slideshow
			if (settings.slideshow) {
				$pp_pic_holder.find('.pp_nav').prepend('<a href="#" class="pp_play">Play</a>');
				$pp_pic_holder.find('.pp_nav .pp_play').click(function() {
					$.prettyPhoto.startSlideshow();
					return false;
				});
			}
			
			// Set the proper theme
			$pp_pic_holder.attr('class','pp_pic_holder ' + settings.theme);
			
			$pp_overlay.css({
				'opacity': 0,
				'height': $(document).height(),
				'width': $(window).width()
			});
			$pp_overlay.bind('click',function() {
				if (!settings.modal) {
					$.prettyPhoto.close();
				}
			});
			
			$('a.pp_close').bind('click',function() {
				$.prettyPhoto.close();
				return false;
			});


			if (settings.allow_expand) {
				$('a.pp_expand').bind('click',function() {
					// Expand the image
					if ($(this).hasClass('pp_expand')) {
						$(this).removeClass('pp_expand').addClass('pp_contract');
						needsResize = false;
					} else {
						$(this).removeClass('pp_contract').addClass('pp_expand');
						needsResize = true;
					}
				
					_hideContent(function() { $.prettyPhoto.open(); });
			
					return false;
				});
			}
			
			// Prep Previous and Next buttons
			$pp_pic_holder.find('.pp_previous, .pp_nav .pp_arrow_previous').bind('click',function() {
				$.prettyPhoto.changePage('previous');
				$.prettyPhoto.stopSlideshow();
				return false;
			});
		
			$pp_pic_holder.find('.pp_next, .pp_nav .pp_arrow_next').bind('click',function() {
				$.prettyPhoto.changePage('next');
				$.prettyPhoto.stopSlideshow();
				return false;
			});
			
			// Center it
			_center_overlay();
		}
		
		function _center_overlay () {
			if (!needsResize || $pp_pic_holder === null) {
				return false;
			}
			if ($pp_pic_holder.height() <= $(window).height()) {
				$pp_pic_holder.css(_getProjectedOffset($pp_pic_holder.height(), $pp_pic_holder.width()));
			}
		}
		
		function _resize_overlay () {
			if ($pp_overlay !== null) {
				$pp_overlay.height($(document).height()).width($(window).width());
			}
		}
		
		
		function getHashtag() {
			var url = location.href;
			return (url.indexOf('#prettyPhoto') !== -1) ? decodeURI(url.substring(url.indexOf('#prettyPhoto')+1,url.length)) : false;
		}
		// theRel is set on normal calls, it's impossible to deeplink using the API
		function setHashtag() {
			if (typeof theRel !== 'undefined') {
				location.hash = theRel + '/' + rel_index + '/';
			}
		}
		function clearHashtag() {
			if (location.href.indexOf('#prettyPhoto') !== -1) {
				location.hash = "prettyPhoto";
			}
		}
		function getParam (name, url) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regexS = "[\\?&]" + name + "=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return ( results === null ) ? "" : results[1];
		}

		if (!pp_alreadyInitialized && getHashtag()) {
			pp_alreadyInitialized = true;
			
			// Grab the rel index to trigger the click on the correct element
			var hashTag = getHashtag();
			var hashIndex = hashTag.substring(hashTag.indexOf('/') + 1, hashTag.length-1);
			var hashRel = hashTag.substring(0, hashTag.indexOf('/'));

			// Little timeout to make sure all the prettyPhoto initialize scripts has been run.
			// Useful in the event the page contain several init scripts.
			setTimeout(function() {
				$("a["+settings.hook+"^='"+hashRel+"']:eq("+hashIndex+")").trigger('click');
			}, 50);
		}
		
		return this.unbind('click.prettyphoto').bind('click.prettyphoto', $.prettyPhoto.initialize); // Return the jQuery object for chaining. The unbind method is used to avoid click conflict when the plugin is called more than once
	};
	
})(jQuery);

var pp_alreadyInitialized = false; // Used for the deep linking to make sure not to call the same function several times.
