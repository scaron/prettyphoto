// About: jQuery lightbox plugin for multimedia content
// Name: prettyPhoto 4.0
// Author: (c) 2012 Stephane Caron - http://nmfe.co - http://twitter.com/scaron
// License: http://www.opensource.org/licenses/mit-license.php

// TO-DO: Change the doc the specify we need jQuery 1.7 and up.
// Move the social tool to something like an uiactionsheet.
// Make sure the shebang doesn't break Facebook.
// Implement the social tools, this is what made 3.2 pretty popular
// Contact the plugin provider so they can built on top of 4.0
// Start research for base theme + theme to sell (wedding theme, kid theme, book theme, tech theme.)
// Document rel= and autoplay =
// Change the full size to a link to the full size image
// Update the doc to state we support IE7 and up, anything else is unsupported for now.

(function($) {
	var   pluginName = 'prettyPhoto'
		, settings
		, currentPosition = 0
		, $pp_overlay
		, $pp_container
		, $pp_content
		, $pp_set
		, $pp_mediaContainer
		, $pp_loader
		, $pp_fade
		, pp_contentDimensions
		, hideControlsTimeout;
	
	// prettyPhoto basic settings.	
	var baseSettings = {
		  animationSpeed: 			0 			// fast/slow/normal/integer
		, autoplaySlideshow: 		false			// true/false
		, callback: 				function(){}	// Called when prettyPhoto is closed
		, changePictureCallback: 	function(){}	// Called everytime an item is shown/changed
		, counter_separator_label: 	'/' 			// The separator for the gallery counter 1 "of" 2
		, custom_markup: 			''				// Markup used when opening custom content
		, deepLinking: 				true 			// Allow prettyPhoto to update the url to enable deepLinking.
		, defaultHeight: 			350				// If no height is specified, this value will be used
		, defaultWidth: 			500				// If no width is specified, this value will be used
		, hideflash: 				false			// Hides all the flash object on a page, set to TRUE if flash appears over prettyPhoto
		, keyboardShortcuts: 		true 			// Set to false if you open forms inside prettyPhoto
		, modal: 					false			// If set to true, only the close button will close the window
		, opacity: 					0.80 			// Value between 0 and 1
		, overlayGallery: 			true 			// If set to true, a gallery will overlay the fullscreen image on mouse over
		, slideshow: 				false 			// false OR interval time in ms
		, theme: 					'pp_default'
		, wmode: 					'opaque' 		// Set the flash wmode attribute
		, markup: 					{
										flash: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{width}" height="{height}"><param name="wmode" value="{wmode}" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{path}" /><embed src="{path}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="{width}" height="{height}" wmode="{wmode}"></embed></object>'
										, iframe: '<iframe src ="{path}" width="{width}" height="{height}" frameborder="no"></iframe>'
										, image: '<img id="fullResImage" src="{path}" width="{width}" height="{height}" />'
										, inline: '<div class="pp_inline">{content}</div>'
										, viewer: '<div class="pp_container"><div class="pp_content"><div class="pp_loader"></div><div class="pp_header"><a href="#" class="pp_close">Close</a><p></p></div><div class="pp_fade"><div id="pp_mediaContainer"></div></div><div class="pp_nav"><a class="pp_previous" href="#"><span>previous</span></a><div class="pp_middle"><a href="#" class="pp_play">Play</a><a href="#" class="pp_social"></a><div class="pp_progress"><span class="pp_progress_done"></span></div></div><a class="pp_next" href="#"><span>next</span></a></div></div></div><div class="pp_overlay"></div>'
										, quicktime: '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="{height}" width="{width}"><param name="src" value="{path}"><param name="autoplay" value="{autoplay_video}"><param name="type" value="video/quicktime"><param name="wmode" value="opaque"><embed src="{path}" height="{height}" width="{width}" autoplay="{autoplay_video}" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/" wmode="opaque"></embed></object>'
										, socialtools: '<a href="http://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script><iframe src="http://www.facebook.com/plugins/like.php?locale=en_US&href={location_href}&amp;layout=button_count&amp;show_faces=true&amp;width=500&amp;action=like&amp;font&amp;colorscheme=light&amp;height=23" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:500px; height:23px;" allowTransparency="true"></iframe>' /* html or false to disable */
										, tooltip: '<span class="pp_tooltip"></span>'
									}
	}
	
	publicMethod = $.fn[pluginName] = $[pluginName] = function(customSettings){
		if(_isMobile()){
			testfull = $('<div>1111111111</div>').css({
				background: 'red',
				width: '100%',
				height: '100%',
				position:'fixed',
				top:0,
				left:0
			});			
			$(document).bind('touchmove', false);
			$('body').append(testfull);
			
			return false;
		}
		
		var _self = this;

		// Bind the events for this prettyPhoto box
		_bindEvents(_self,jQuery.extend({},baseSettings, customSettings));

		var deeplink = _getHashtag();
		if(deeplink){
			// Open prettyPhoto
			if(deeplink[1] != 'undefined'){ // Gallery has been specified
				$('a[data-pp=true][data-pp-gallery='+deeplink[1]+']:eq('+deeplink[2]+')').trigger('click');
			}else{ // Select only the elements without a gallery speficied
				singleElements = $('a[data-pp=true]').filter(function(){ return typeof $(this).data('pp-gallery') == 'undefined'; });
				singleElements.eq(deeplink[2]).trigger('click');
			}
				
		}
		

		return _self;
	};

	publicMethod.open = function(){
		// Inject the markup needed by prettyPhoto
		if(!$pp_overlay)
			_buildOverlay();
			
		$pp_loader.show();

		if($pp_set.settings.hideflash)
			$('object,embed,iframe[src*=youtube],iframe[src*=vimeo]').css('visibility','hidden'); // Hide the flash

		// Get the content dimensions, once that's done, inject the content in the prettyPhoto container
		_getContentDimensions(function(){ _injectContent(); });
		
		hideControlsTimeout = setTimeout(function(){
			$pp_nav.fadeOut();
			$pp_container.find('.pp_header').fadeOut();
		},3000);
	};
	
	publicMethod.close = function(){
		$(document).unbind('keydown.prettyphoto');
		
		$pp_overlay.fadeOut($pp_set.settings.animationSpeed,function(){ $(this).remove(); });
		$pp_container.fadeOut($pp_set.settings.animationSpeed,function(){ $(this).remove(); });
		
		$pp_overlay = null;
		
		if(typeof slideshow != 'undefined') {
			clearTimeout(slideshow);
			delete slideshow;
		};
		
	};
	
	publicMethod.nextMedia = function(caller){
		$pp_container.removeClass(_getContentType($($pp_set[currentPosition]).attr('href')));
		
		currentPosition++;
		if(currentPosition >= $pp_set.length)
			currentPosition = 0;
		
		$pp_fade.fadeTo($pp_set.settings.animationSpeed,0,function(){
			_getContentDimensions(function(){ _injectContent(); });
		});
		
		if(typeof caller != 'undefined')
			$.prettyPhoto.stopSlideshow();

		if($pp_set.settings.slideshow && typeof slideshow != 'undefined')
			$pp_content.find('.pp_progress_done').stop().css('width','0%').animate({width:'100%'},$pp_set.settings.slideshow);
	};
	
	publicMethod.previousMedia = function(caller){
		$pp_container.removeClass(_getContentType($($pp_set[currentPosition]).attr('href')));
		
		currentPosition --;
		if(currentPosition < 0)
			currentPosition = $pp_set.length - 1;
		
		$pp_fade.fadeTo($pp_set.settings.animationSpeed,0,function(){
			_getContentDimensions(function(){ _injectContent(); });
		});
		
		if(typeof caller != 'undefined')
			$.prettyPhoto.stopSlideshow();

		if($pp_set.settings.slideshow && typeof slideshow != 'undefined')
			$pp_content.find('.pp_progress_done').stop().css('width','0%').animate({width:'100%'},$pp_set.settings.slideshow);
	};
	
	publicMethod.startSlideshow = function(){
		$pp_content.find('.pp_play')
			.addClass('pp_pause')
			.unbind('click')
			.on('click',function(){
				$.prettyPhoto.stopSlideshow();
			});
		
		$pp_content.find('.pp_progress_done').stop().css('width','0%').animate({width:'100%'},$pp_set.settings.slideshow);
		
		slideshow = setInterval(function(){
			$.prettyPhoto.nextMedia();
		},$pp_set.settings.slideshow);
	};
	
	publicMethod.stopSlideshow = function(){
		if(typeof slideshow == 'undefined')
			return
		
		clearInterval(slideshow);
		delete slideshow;
		
		$pp_content.find('.pp_play')
			.removeClass('pp_pause')
			.unbind('click')
			.on('click',function(){
				$.prettyPhoto.startSlideshow();
			});
			
		$pp_content.find('.pp_progress_done').stop().css('width','0%');
	}
	
	_bindEvents = function(elementsToBindEventsOn,settings){
		$(elementsToBindEventsOn).on("click",function(e){
			var _self = this;

			// Cache the pp_set of pictures to open. Only keep the elements that are part of the gallery, or only the single element if it's not a gallery
			$pp_set = ($(_self).data('pp-gallery')) ? $(elementsToBindEventsOn).filter(function(){ return ($(this).data('pp-gallery') == $(_self).data('pp-gallery')); }) : $(_self).toArray();
			$pp_set.settings = settings;
			
			if($pp_set.settings.keyboardShortcuts) {
				$(document).bind('keydown.prettyphoto',function(e){
					if(typeof $pp_container != 'undefined'){
							switch(e.keyCode){
								case 37:
									publicMethod.previousMedia(this);
									e.preventDefault();
									break;
								case 39:
									publicMethod.nextMedia(this);
									e.preventDefault();
									break;
								case 27:
									if(!$pp_set.settings.modal)
										$.prettyPhoto.close();
									e.preventDefault();
									break;
							};
					};
				});
			};
			
			// Get the current position in the set.
			currentPosition = jQuery.inArray(this, $pp_set);
			
			// Open prettyPhoto
			publicMethod.open();
			
			// Prevent the default actions.
			e.preventDefault();
		});
	};
	
	_buildOverlay = function(){		
		// Inject Social Tool markup into General markup
		// $pp_set.settings.markup.viewer = $pp_set.settings.markup.viewer.replace('{pp_social}',$pp_set.settings.markup.socialtools);
		
		// Inject the markup
		$('body').append($pp_set.settings.markup.viewer);
		
		// Cache the selectors
		$pp_container = $('div.pp_container')
		$pp_content = $('div.pp_container').find('.pp_content')
		$pp_overlay = $('div.pp_overlay');
		$pp_mediaContainer = $('div#pp_mediaContainer');
		$pp_nav = $('div.pp_nav');
		$pp_loader = $('div.pp_loader');
		$pp_fade = $('div.pp_fade');
		
		if($pp_set.settings.slideshow){
			$pp_nav.find('.pp_play')
				.show()
				.on('click',function(e){
					$.prettyPhoto.startSlideshow();
					e.preventDefault();
				});
				
			$pp_nav.find('.pp_progress').show();
		}else{
			$pp_nav.find('.pp_progress,.pp_play').hide();
		};
		
		if($pp_set.length > 1){
			var toInject = $('<ul></ul>').addClass('pp_paging');
			$pp_set.each(function(index){
				listItem = $('<li></li>')
								.append('<a></a>')
								.find('a')
								.attr('href','#')
								.text(index)
								.on('click',function(e){
									currentPosition = index-1;
									$.prettyPhoto.nextMedia();
									e.preventDefault();
								})
								.hover(function(){
									_showTooltip(this,$($pp_set[index]).attr('href'));
								},
								function(){
									_hideTooltip();
								})
								.parent();
			
				$(toInject).append(listItem);
			});
			
			$pp_nav.append(toInject);
		}else{
			$pp_nav.find('a.pp_previous, a.pp_next, .pp_progress').hide();
		}
		
		if($pp_set.settings.markup.socialtools){
			var canDiscardSocialTools = true;
			$pp_nav.find('.pp_social')
				.hover(function(){
					var socialToolsContainer = $('<div></div>');
						socialToolsContainer
							.addClass('pp_tooltip pp_socialToolsContainer')
							.css({
								bottom:$(this).position().top,
								left:$(this).position().left
							})
							.hover(function(){
								canDiscardSocialTools = false;
							},
							function(){
								canDiscardSocialTools = true;
							})
							.append($pp_set.settings.markup.socialtools);

					$(this).after(socialToolsContainer);
				},
				function(){
					var self = this;
					canDiscardSocialToolsInterval = setInterval(function(){
						if(canDiscardSocialTools){
							$(self).nextAll('.pp_socialToolsContainer').remove();
							clearInterval( canDiscardSocialToolsInterval )
						}
					},1500);
				});
		}else{

		}
		
		// Set the proper theme
		$pp_container.attr('class','pp_container ' + $pp_set.settings.theme);
		
		$(document).on('mousemove',function(e){
			$pp_nav.show();
			$pp_container.find('.pp_header').show();
			
			if(typeof hideControlsTimeout != 'undefined')
				clearInterval(hideControlsTimeout);
			
			hideControlsTimeout = setTimeout(function(){
				$pp_nav.fadeOut();
				$pp_container.find('.pp_header').fadeOut();
			},3000);
		});
		
		$pp_container
			.find('.pp_previous')
			.on('click',function(e){
				$.prettyPhoto.previousMedia(this);
				e.preventDefault();
			});
			
		$pp_container
			.find('.pp_next')
			.on('click',function(e){
				$.prettyPhoto.nextMedia(this);
				e.preventDefault();
			});
		
		$pp_container
			.find('a.pp_close')
			.on('click',function(e){ $.prettyPhoto.close(); e.preventDefault(); });
		
		$pp_overlay
			.height($(document).height())
			.on('click',function(){
				if(!$pp_set.settings.modal) $.prettyPhoto.close();
			});

		$pp_overlay.fadeTo($pp_set.settings.animationSpeed,$pp_set.settings.opacity,function(){
			$pp_container.fadeIn($pp_set.settings.animationSpeed);
		});
	};
	
	_injectContent = function(){
		var   toInject = ''
			, currentMediaObject = $pp_set[currentPosition]
			, currentMediaSrc = $(currentMediaObject).attr('href')
			, delayShowContent = false;
		
		// Rebuild Facebook Like Button with updated href
		// if($pp_set.settings.markup.socialtools){
		// 	facebook_like_link = $pp_set.settings.markup.socialtools.replace('{location_href}', encodeURIComponent(location.href)); 
		// 	$pp_mediaContainer.find('.pp_social').html(facebook_like_link);
		// }
		
		$pp_container.addClass(_getContentType(currentMediaSrc));
		
		switch(_getContentType(currentMediaSrc)){
			case 'image':
				toInject = $pp_set.settings.markup.image
													.replace(/{path}/g,currentMediaSrc)
													.replace(/{width}/g,'100%')
													.replace(/{height}/g,'100%');
			break;
		
			case 'youtube':
				// Regular youtube link
				var movieID = _getParam('v',currentMediaSrc);
				
				// youtu.be link
				if(movieID == ""){
					movieID = currentMediaSrc.split('youtu.be/');
					movieID = movieID[1];
					if(movieID.indexOf('?') > 0)
						movieID = movieID.substr(0,movieID.indexOf('?')); // Strip anything after the ?

					if(movieID.indexOf('&') > 0)
						movieID = movieID.substr(0,movieID.indexOf('&')); // Strip anything after the &
				}

				moviePath = 'http://www.youtube.com/embed/'+movieID;
				moviePath += ($(currentMediaObject).data('pp-show-related') == true) ? "?rel=1" : "?rel=0";
				moviePath += ($(currentMediaObject).data('pp-autoplay') == true) ? "&autoplay=1" : "&autoplay=0";
			
				toInject = $pp_set.settings.markup.iframe
									.replace(/{width}/g,pp_contentDimensions['width'])
									.replace(/{height}/g,pp_contentDimensions['height'])
									.replace(/{wmode}/g,$pp_set.settings.wmode)
									.replace(/{path}/g,moviePath);
			break;
		
			case 'vimeo':
				var   regExp = /http:\/\/(www\.)?vimeo.com\/(\d+)/
					, match = currentMediaSrc.match(regExp);
				
				moviePath = 'http://player.vimeo.com/video/'+ match[2] +'?title=0&amp;byline=0&amp;portrait=0';
				moviePath += ($(currentMediaObject).data('pp-autoplay') == true) ? "&autoplay=1" : "&autoplay=0";
		
				toInject = $pp_set.settings.markup.iframe
										.replace(/{path}/g,moviePath)
										.replace(/{width}/g,pp_contentDimensions['width'])
										.replace(/{height}/g,pp_contentDimensions['height']);
			break;
		
			case 'quicktime':
				toInject = $pp_set.settings.markup.quicktime
												.replace(/{width}/g,pp_contentDimensions['width'])
												.replace(/{height}/g,pp_contentDimensions['height'])
												.replace(/{wmode}/g,$pp_set.settings.wmode)
												.replace(/{path}/g,currentMediaSrc)
												.replace(/{autoplay_video}/g, ($(currentMediaObject).data('pp-autoplay') == true) ? true : false);
			break;
		
			case 'flash':
				var flashVars = "";

				if(currentMediaSrc.indexOf('flashvars'))
					flashVars = currentMediaSrc.substring(currentMediaSrc.indexOf('flashvars') + 10,currentMediaSrc.length);

				filename = currentMediaSrc.substring(0,currentMediaSrc.indexOf('.swf') + 4);
			
				toInject =  $pp_set.settings.markup.flash
										.replace(/{width}/g,pp_contentDimensions['width'])
										.replace(/{height}/g,pp_contentDimensions['height'])
										.replace(/{wmode}/g,$pp_set.settings.wmode)
										.replace(/{path}/g,filename+'?'+flashVars);
			break;
		
			case 'iframe':
				toInject = $pp_set.settings.markup.iframe
												.replace(/{width}/g,pp_contentDimensions['width'])
												.replace(/{height}/g,pp_contentDimensions['height'])
												.replace(/{path}/g,currentMediaSrc);
			break;
			
			case 'ajax':
				delayShowContent = true;
				$.get(currentMediaSrc,function(responseHTML){
					toInject = $pp_set.settings.markup.inline.replace(/{content}/g,responseHTML);
					$pp_mediaContainer
						.html(toInject);
					_showContent();
				});
				
			break;
			
			case 'custom':
				toInject = $pp_set.settings.markup.custom;
			break;
		
			case 'inline':
				// to get the item height clone it, apply default width, wrap it in the prettyPhoto containers , then delete
				myClone = $(pp_images[set_position]).clone().append('<br clear="all" />').css({'width':settings.default_width}).wrapInner('<div id="pp_full_res"><div class="pp_inline"></div></div>').appendTo($('body')).show();
				pp_dimensions = _fitToViewport($(myClone).width(),$(myClone).height());
				$(myClone).remove();
				toInject = $pp_set.settings.markup.inline.replace(/{content}/g,$(pp_set[currentPosition]).html());
			break;
		};
		
		if($(currentMediaObject).data('pp-title'))
			$pp_content.find('.pp_header p').html($(currentMediaObject).data('pp-title'));
		
		$pp_mediaContainer
			.html(toInject);
			
		// Once the content is injected, show it
		if(!delayShowContent)
			_showContent();
	}
	
	_showContent = function(){
		if($pp_set.settings.deepLinking)
			_setHashtag();
		
		$pp_loader.hide();
		
		_centerOverlay();
		
		$pp_fade.fadeTo($pp_set.settings.animationSpeed,1);
		$pp_mediaContainer.animate({
			  width: pp_contentDimensions['width']
			, height: pp_contentDimensions['height']
		},$pp_set.settings.animationSpeed,function(){
			
			if($pp_set.settings.autoplaySlideshow) {
				$.prettyPhoto.startSlideshow();
				$pp_set.settings.autoplaySlideshow = false; // Once is has been started this is not needed anymore.
			}
			
			$pp_nav.find('.pp_paging li.selected').removeClass('selected');
			$pp_nav.find('.pp_paging li:eq('+currentPosition+')').addClass('selected');
		});
	};
	
	_showTooltip = function(caller,image) {
		if(image.toLowerCase().indexOf('.jpg') == -1 && image.toLowerCase().indexOf('.gif') == -1 && image.toLowerCase().indexOf('.png') == -1)
			return
		
		var toInject = $('<img />')
							.attr('src',image);
							
		$($pp_set.settings.markup.tooltip).append(toInject).appendTo(caller);
	};
	
	_hideTooltip = function(){
		$pp_container.find('.pp_tooltip').remove();
	};
	
	_getContentDimensions = function(callback){
		var currentMedia = $pp_set[currentPosition]
			, mediaWidth
			, mediaHeight;
		
		// If the content is an image, preload it
		// else
		// get the width/height from the data attributes
		if(_getContentType($(currentMedia).attr('href')) == 'image'){
			var imgPreloader = new Image();
			
			imgPreloader.onload = function(){
				pp_contentDimensions = _fitToViewport(this.width,this.height);

				_centerOverlay();

				callback();
			};

			imgPreloader.onerror = function(){
				alert('Image cannot be loaded. Make sure the path is correct and image exist.');
				$.prettyPhoto.close();
				return;
			};
		
			imgPreloader.src = $(currentMedia).attr('href');
		}else{
			mediaWidth = ($(currentMedia).data('pp-width')) ? $(currentMedia).data('pp-width') : $pp_set.settings.defaultWidth;
			mediaHeight = ($(currentMedia).data('pp-height')) ? $(currentMedia).data('pp-height') : $pp_set.settings.defaultHeight;
			
			// Convert the value to string to be able to parse if it's % based or not
			mediaWidth = mediaWidth.toString();
			mediaHeight = mediaHeight.toString();
			
			// If the size is percent base, calculate it appropriatly
			if(mediaWidth.indexOf('%') != -1) { mediaWidth = parseFloat(($(window).width() * parseFloat(mediaWidth) / 100) - 150); }
			if(mediaHeight.indexOf('%') != -1) { mediaHeight = parseFloat(($(window).height() * parseFloat(mediaHeight) / 100) - 150); }
			
			pp_contentDimensions = _fitToViewport(parseFloat(mediaWidth),parseFloat(mediaHeight));

			callback();
		};
		
		return false;
	};
	
	_fitToViewport = function(width,height){
		var   windowWidth = $(window).width()
			, windowHeight = $(window).height()
			, imageWidth = width
			, imageHeight = height;


		if((imageWidth > windowWidth || imageHeight > windowHeight)) {
			var   fitting = false;

			while (!fitting){
				if(imageWidth > windowWidth){
					imageWidth = windowWidth - 150;
					imageHeight = (height/width) * imageWidth;
				}else if(imageHeight > windowHeight){
					imageHeight = windowHeight - 150;
					imageWidth = (width/height) * imageHeight;
				}else{
					fitting = true;
				};
			};
		};
		
		return {
			width:Math.floor(imageWidth),
			height:Math.floor(imageHeight)
		};
	};
	
	_centerOverlay = function() {
		var   pp_height = pp_contentDimensions['height'] + parseFloat($pp_content.css('paddingTop')) + parseFloat($pp_content.css('paddingBottom')) + parseFloat($pp_content.css('borderTopWidth')) + parseFloat($pp_content.css('borderBottomWidth'))
			, pp_width = pp_contentDimensions['width'] + parseFloat($pp_content.css('paddingLeft')) + parseFloat($pp_content.css('paddingRight')) + parseFloat($pp_content.css('borderLeftWidth')) + parseFloat($pp_content.css('borderRightWidth'));

		$pp_container.animate({
			  'marginTop': -(pp_height/2)
			, 'marginLeft': -(pp_width/2)
		},$pp_set.settings.animationSpeed);
	}
	
	_getContentType = function(content) {
		if (content.match(/youtube\.com\/watch/i) || content.match(/youtu\.be/i)) {
			return 'youtube';
		}else if (content.match(/vimeo\.com/i)) {
			return 'vimeo';
		}else if(content.match(/\b.mov\b/i)){ 
			return 'quicktime';
		}else if(content.match(/\b.swf\b/i)){
			return 'flash';
		}else if($($pp_set[currentPosition]).data('pp-iframe') == true){
			return 'iframe';
		}else if($($pp_set[currentPosition]).data('pp-ajax') == true){
			return 'ajax';
		}else if($($pp_set[currentPosition]).data('pp-custom') == true){
			return 'custom';
		}else if(content.substr(0,1) == '#'){
			return 'inline';
		}else{
			return 'image';
		};
	};
	
	_getHashtag = function(){
		var url = location.href;
		var hashtag = (url.indexOf('#prettyPhoto') != -1) ? decodeURI(url.substring(url.indexOf('#')+1,url.length)).split('/') : false;
		return hashtag;
	};
	
	_setHashtag = function(){
		if($($pp_set[currentPosition]).data('pp-gallery')) {
			location.hash = pluginName + "/" + $($pp_set[currentPosition]).data('pp-gallery') + "/" + currentPosition;
		}else{
			singleElements = $('a[data-pp=true]').filter(function(){ return typeof $(this).data('pp-gallery') == 'undefined'; });
			singleElementIndex = $(singleElements).index($pp_set[currentPosition]);
			location.hash = pluginName + "/" + $($pp_set[currentPosition]).data('pp-gallery') + "/" + singleElementIndex;
		}
	};
	
	_clearHashtag = function(){
		// Clear the hashtag only if it was set by prettyPhoto
		url = location.href;
		hashtag = (url.indexOf('#prettyPhoto')) ? true : false;
		if(hashtag) location.hash = "";
	}
	
	_getParam = function(name,url){
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( url );
	  return ( results == null ) ? "" : results[1];
	};
	
	_isMobile = function(){
		return (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));  
	}

})(jQuery);
