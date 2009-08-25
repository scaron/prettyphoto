/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 2.5.2
------------------------------------------------------------------------- */

(function($) {
	$.prettyPhoto = {version: '2.5'};
	
	$.fn.prettyPhoto = function(settings) {
		settings = jQuery.extend({
			animationSpeed: 'normal', /* fast/slow/normal */
			padding: 40, /* padding for each side of the picture */
			opacity: 0.80, /* Value between 0 and 1 */
			showTitle: true, /* true/false */
			allowresize: true, /* true/false */
			counter_separator_label: '/', /* The separator for the gallery counter 1 "of" 2 */
			theme: 'light_rounded', /* light_rounded / dark_rounded / light_square / dark_square */
			callback: function(){}
		}, settings);
		
		// Fallback to a supported theme for IE6
		if($.browser.msie && $.browser.version == 6){
			settings.theme = "light_square";
		}
		
		if($('.pp_overlay').size() == 0) {
			_buildOverlay(); // If the overlay is not there, inject it!
		}else{
			// Set my global selectors
			$pp_pic_holder = $('.pp_pic_holder');
			$ppt = $('.ppt');
		}
		
		// Global variables accessible only by prettyPhoto
		var doresize = true, percentBased = false, correctSizes,
		
		// Cached selectors
		$pp_pic_holder, $ppt, settings,
		
		// prettyPhoto container specific
		pp_contentHeight, pp_contentWidth, pp_containerHeight, pp_containerWidth, pp_type = 'image',
	
		//Gallery specific
		setPosition = 0,

		// Global elements
		$scrollPos = _getScroll();
	
		// Window/Keyboard events
		$(window).scroll(function(){ $scrollPos = _getScroll(); _centerOverlay(); });
		$(window).resize(function(){ _centerOverlay(); _resizeOverlay(); });
		$(document).keydown(function(e){
			switch(e.keyCode){
				case 37:
					$.prettyPhoto.changePage('previous');
					break;
				case 39:
					$.prettyPhoto.changePage('next');
					break;
				case 27:
					$.prettyPhoto.close();
					break;
			};
	    });
	
		// Bind the code to each links
		$(this).each(function(){
			$(this).bind('click',function(){
				
				link = this; // Fix scoping
				
				// Find out if the picture is part of a set
				theRel = $(this).attr('rel');
				galleryRegExp = /\[(?:.*)\]/;
				theGallery = galleryRegExp.exec(theRel);
				
				// Build the gallery array
				var images = new Array(), titles = new Array(), descriptions = new Array();
				if(theGallery){
					$('a[rel*='+theGallery+']').each(function(i){
						if($(this)[0] === $(link)[0]) setPosition = i; // Get the position in the set
						images.push($(this).attr('href'));
						titles.push($(this).find('img').attr('alt'));
						descriptions.push($(this).attr('title'));
					});
				}else{
					images = $(this).attr('href');
					titles = ($(this).find('img').attr('alt')) ?  $(this).find('img').attr('alt') : '';
					descriptions = ($(this).attr('title')) ?  $(this).attr('title') : '';
				}

				$.prettyPhoto.open(images,titles,descriptions);
				return false;
			});
		});
	
		
		/**
		* Opens the prettyPhoto modal box.
		* @param image {String,Array} Full path to the image to be open, can also be an array containing full images paths.
		* @param title {String,Array} The title to be displayed with the picture, can also be an array containing all the titles.
		* @param description {String,Array} The description to be displayed with the picture, can also be an array containing all the descriptions.
		*/
		$.prettyPhoto.open = function(gallery_images,gallery_titles,gallery_descriptions) {
			// To fix the bug with IE select boxes
			if($.browser.msie && $.browser.version == 6){
				$('select').css('visibility','hidden');
			};
			
			// Hide the flash
			$('object,embed').css('visibility','hidden');
			
			// Convert everything to an array in the case it's a single item
			images = $.makeArray(gallery_images);
			titles = $.makeArray(gallery_titles);
			descriptions = $.makeArray(gallery_descriptions);
			
			if($('.pp_overlay').size() == 0) {
				_buildOverlay(); // If the overlay is not there, inject it!
			}else{
				// Set my global selectors
				$pp_pic_holder = $('.pp_pic_holder');
				$ppt = $('.ppt');
			}
			
			$pp_pic_holder.attr('class','pp_pic_holder ' + settings.theme); // Set the proper theme

			isSet = ($(images).size() > 0) ?  true : false; // Find out if it's a set

			_getFileType(images[setPosition]); // Set the proper file type

			_centerOverlay(); // Center it

			// Hide the next/previous links if on first or last images.
			_checkPosition($(images).size());
		
			$('.pp_loaderIcon').show(); // Do I need to explain?
		
			// Fade the content in
			$('div.pp_overlay').show().fadeTo(settings.animationSpeed,settings.opacity, function(){
				$pp_pic_holder.fadeIn(settings.animationSpeed,function(){
					// Display the current position
					$pp_pic_holder.find('p.currentTextHolder').text((setPosition+1) + settings.counter_separator_label + $(images).size());

					// Set the description
					if(descriptions[setPosition]){
						$pp_pic_holder.find('.pp_description').show().html(unescape(descriptions[setPosition]));
					}else{
						$pp_pic_holder.find('.pp_description').hide().text('');
					};

					// Set the title
					if(titles[setPosition] && settings.showTitle){
						hasTitle = true;
						$ppt.html(unescape(titles[setPosition]));
					}else{
						hasTitle = false;
					};
					
					// Inject the proper content
					if(pp_type == 'image'){
						// Set the new image
						imgPreloader = new Image();

						// Preload the neighbour images
						nextImage = new Image();
						if(isSet && setPosition > $(images).size()) nextImage.src = images[setPosition + 1];
						prevImage = new Image();
						if(isSet && images[setPosition - 1]) prevImage.src = images[setPosition - 1];

						pp_typeMarkup = '<img id="fullResImage" src="" />';				
						$pp_pic_holder.find('#pp_full_res')[0].innerHTML = pp_typeMarkup;

						$pp_pic_holder.find('.pp_content').css('overflow','hidden');
						$pp_pic_holder.find('#fullResImage').attr('src',images[setPosition]);

						imgPreloader.onload = function(){
							// Fit item to viewport
							correctSizes = _fitToViewport(imgPreloader.width,imgPreloader.height);
							
							_showContent();
						};

						imgPreloader.src = images[setPosition];
					}else{
						// Get the dimensions
						movie_width = ( parseFloat(grab_param('width',images[setPosition])) ) ? grab_param('width',images[setPosition]) : "425";
						movie_height = ( parseFloat(grab_param('height',images[setPosition])) ) ? grab_param('height',images[setPosition]) : "344";

						// If the size is % based, calculate according to window dimensions
						if(movie_width.indexOf('%') != -1 || movie_height.indexOf('%') != -1){
							movie_height = ($(window).height() * parseFloat(movie_height) / 100) - 100;
							movie_width = ($(window).width() * parseFloat(movie_width) / 100) - 100;
							percentBased = true;
						}

						movie_height = parseFloat(movie_height);
						movie_width = parseFloat(movie_width);

						if(pp_type == 'quicktime') movie_height+=13; // Add space for the control bar

						// Fit item to viewport
						correctSizes = _fitToViewport(movie_width,movie_height);

						if(pp_type == 'youtube'){
							pp_typeMarkup = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://www.youtube.com/v/'+grab_param('v',images[setPosition])+'" /><embed src="http://www.youtube.com/v/'+grab_param('v',images[setPosition])+'" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"></embed></object>';
						}else if(pp_type == 'quicktime'){
							pp_typeMarkup = '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="'+correctSizes['height']+'" width="'+correctSizes['width']+'"><param name="src" value="'+images[setPosition]+'"><param name="autoplay" value="true"><param name="type" value="video/quicktime"><embed src="'+images[setPosition]+'" height="'+correctSizes['height']+'" width="'+correctSizes['width']+'" autoplay="true" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>';
						}else if(pp_type == 'flash'){
							flash_vars = images[setPosition];
							flash_vars = flash_vars.substring(images[setPosition].indexOf('flashvars') + 10,images[setPosition].length);

							filename = images[setPosition];
							filename = filename.substring(0,filename.indexOf('?'));

							pp_typeMarkup = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="'+filename+'?'+flash_vars+'" /><embed src="'+filename+'?'+flash_vars+'" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"></embed></object>';
						}else if(pp_type == 'iframe'){
							movie_url = images[setPosition];
							movie_url = movie_url.substr(0,movie_url.indexOf('iframe')-1);

							pp_typeMarkup = '<iframe src ="'+movie_url+'" width="'+(correctSizes['width']-10)+'" height="'+(correctSizes['height']-10)+'" frameborder="no"></iframe>';
						}

						// Show content
						_showContent();
					}
				});
			});
		};
		
		/**
		* Change page in the prettyPhoto modal box
		* @param direction {String} Direction of the paging, previous or next.
		*/
		$.prettyPhoto.changePage = function(direction){
			if(direction == 'previous') {
				setPosition--;
				if (setPosition < 0){
					setPosition = 0;
					return;
				}
			}else{
				if($('.pp_arrow_next').is('.disabled')) return;
				setPosition++;
			};

			// Allow the resizing of the images
			if(!doresize) doresize = true;

			_hideContent();
			$('a.pp_expand,a.pp_contract').fadeOut(settings.animationSpeed,function(){
				$(this).removeClass('pp_contract').addClass('pp_expand');
				$.prettyPhoto.open(images,titles,descriptions);
			});
		};
		
		/**
		* Closes the prettyPhoto modal box.
		*/
		$.prettyPhoto.close = function(){
			$pp_pic_holder.find('object,embed').css('visibility','hidden');
			
			$('div.pp_pic_holder,div.ppt').fadeOut(settings.animationSpeed);
			
			$('div.pp_overlay').fadeOut(settings.animationSpeed, function(){
				$('div.pp_overlay,div.pp_pic_holder,div.ppt').remove();
			
				// To fix the bug with IE select boxes
				if($.browser.msie && $.browser.version == 6){
					$('select').css('visibility','visible');
				};
				
				// Show the flash
				$('object,embed').css('visibility','visible');
				
				setPosition = 0;
				
				settings.callback();
			});
			
			doresize = true;
		};
	
		/**
		* Set the proper sizes on the containers and animate the content in.
		*/
		_showContent = function(){
			$('.pp_loaderIcon').hide();

			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};

			// Calculate the opened top position of the pic holder
			projectedTop = $scrollPos['scrollTop'] + ((windowHeight/2) - (correctSizes['containerHeight']/2));
			if(projectedTop < 0) projectedTop = 0 + $pp_pic_holder.find('.ppt').height();

			// Resize the content holder
			$pp_pic_holder.find('.pp_content').animate({'height':correctSizes['contentHeight']},settings.animationSpeed);
			
			// Resize picture the holder
			$pp_pic_holder.animate({
				'top': projectedTop,
				'left': ((windowWidth/2) - (correctSizes['containerWidth']/2)),
				'width': correctSizes['containerWidth']
			},settings.animationSpeed,function(){
				$pp_pic_holder.width(correctSizes['containerWidth']);
				$pp_pic_holder.find('.pp_hoverContainer,#fullResImage').height(correctSizes['height']).width(correctSizes['width']);

				// Fade the new image
				$pp_pic_holder.find('#pp_full_res').fadeIn(settings.animationSpeed);

				// Show the nav
				if(isSet && pp_type=="image") { $pp_pic_holder.find('.pp_hoverContainer').fadeIn(settings.animationSpeed); }else{ $pp_pic_holder.find('.pp_hoverContainer').hide(); }
				$pp_pic_holder.find('.pp_details').fadeIn(settings.animationSpeed);

				// Show the title
				if(settings.showTitle && hasTitle){
					$ppt.css({
						'top' : $pp_pic_holder.offset().top - 20,
						'left' : $pp_pic_holder.offset().left + (settings.padding/2),
						'display' : 'none'
					});

					$ppt.fadeIn(settings.animationSpeed);
				};
			
				// Fade the resizing link if the image is resized
				if(correctSizes['resized']) $('a.pp_expand,a.pp_contract').fadeIn(settings.animationSpeed);
				
				// Once everything is done, inject the content if it's now a photo
				if(pp_type != 'image') $pp_pic_holder.find('#pp_full_res')[0].innerHTML = pp_typeMarkup;
			});
		};
		
		/**
		* Hide the content...DUH!
		*/
		function _hideContent(){
			// Fade out the current picture
			$pp_pic_holder.find('.pp_hoverContainer,.pp_details').fadeOut(settings.animationSpeed);
			$pp_pic_holder.find('#pp_full_res object,#pp_full_res embed').css('visibility','hidden');
			$pp_pic_holder.find('#pp_full_res').fadeOut(settings.animationSpeed,function(){
				$('.pp_loaderIcon').show();
			});
			
			// Hide the title
			$ppt.fadeOut(settings.animationSpeed);
		}
	
		/**
		* Check the item position in the gallery array, hide or show the navigation links
		* @param setCount {integer} The total number of items in the set
		*/
		function _checkPosition(setCount){
			// If at the end, hide the next link
			if(setPosition == setCount-1) {
				$pp_pic_holder.find('a.pp_next').css('visibility','hidden');
				$pp_pic_holder.find('a.pp_arrow_next').addClass('disabled').unbind('click');
			}else{ 
				$pp_pic_holder.find('a.pp_next').css('visibility','visible');
				$pp_pic_holder.find('a.pp_arrow_next.disabled').removeClass('disabled').bind('click',function(){
					$.prettyPhoto.changePage('next');
					return false;
				});
			};
		
			// If at the beginning, hide the previous link
			if(setPosition == 0) {
				$pp_pic_holder.find('a.pp_previous').css('visibility','hidden');
				$pp_pic_holder.find('a.pp_arrow_previous').addClass('disabled').unbind('click');
			}else{
				$pp_pic_holder.find('a.pp_previous').css('visibility','visible');
				$pp_pic_holder.find('a.pp_arrow_previous.disabled').removeClass('disabled').bind('click',function(){
					$.prettyPhoto.changePage('previous');
					return false;
				});
			};
			
			// Hide the bottom nav if it's not a set.
			if(setCount > 1) {
				$('.pp_nav').show();
			}else{
				$('.pp_nav').hide();
			}
		};
	
		/**
		* Resize the item dimensions if it's bigger than the viewport
		* @param width {integer} Width of the item to be opened
		* @param height {integer} Height of the item to be opened
		* @return An array containin the "fitted" dimensions
		*/
		function _fitToViewport(width,height){
			hasBeenResized = false;
		
			_getDimensions(width,height);
			
			// Define them in case there's no resize needed
			imageWidth = width;
			imageHeight = height;

			windowHeight = $(window).height();
			windowWidth = $(window).width();
		
			if( ((pp_containerWidth > windowWidth) || (pp_containerHeight > windowHeight)) && doresize && settings.allowresize && !percentBased) {
				hasBeenResized = true;
				notFitting = true;
			
				while (notFitting){
					if((pp_containerWidth > windowWidth)){
						imageWidth = (windowWidth - 200);
						imageHeight = (height/width) * imageWidth;
					}else if((pp_containerHeight > windowHeight)){
						imageHeight = (windowHeight - 200);
						imageWidth = (width/height) * imageHeight;
					}else{
						notFitting = false;
					};

					pp_containerHeight = imageHeight;
					pp_containerWidth = imageWidth;
				};
			
				_getDimensions(imageWidth,imageHeight);
			};

			return {
				width:imageWidth,
				height:imageHeight,
				containerHeight:pp_containerHeight,
				containerWidth:pp_containerWidth,
				contentHeight:pp_contentHeight,
				contentWidth:pp_contentWidth,
				resized:hasBeenResized
			};
		};
		
		/**
		* Get the containers dimensions according to the item size
		* @param width {integer} Width of the item to be opened
		* @param height {integer} Height of the item to be opened
		*/
		function _getDimensions(width,height){
			$pp_pic_holder.find('.pp_details').width(width).find('.pp_description').width(width - parseFloat($pp_pic_holder.find('a.pp_close').css('width'))); /* To have the correct height */
			
			// Get the container size, to resize the holder to the right dimensions
			pp_contentHeight = height + $pp_pic_holder.find('.pp_details').height() + parseFloat($pp_pic_holder.find('.pp_details').css('marginTop')) + parseFloat($pp_pic_holder.find('.pp_details').css('marginBottom'));
			pp_contentWidth = width;
			pp_containerHeight = pp_contentHeight + $pp_pic_holder.find('.ppt').height() + $pp_pic_holder.find('.pp_top').height() + $pp_pic_holder.find('.pp_bottom').height();
			pp_containerWidth = width + settings.padding;
		}
	
		function _getFileType(itemSrc){
			if (itemSrc.match(/youtube\.com\/watch/i)) {
				pp_type = 'youtube';
			}else if(itemSrc.indexOf('.mov') != -1){ 
				pp_type = 'quicktime';
			}else if(itemSrc.indexOf('.swf') != -1){
				pp_type = 'flash';
			}else if(itemSrc.indexOf('iframe') != -1){
				pp_type = 'iframe'
			}else{
				pp_type = 'image';
			};
		};
	
		function _centerOverlay(){
			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};

			if(doresize) {
				$pHeight = $pp_pic_holder.height();
				$pWidth = $pp_pic_holder.width();
				$tHeight = $ppt.height();
				
				projectedTop = (windowHeight/2) + $scrollPos['scrollTop'] - ($pHeight/2);
				if(projectedTop < 0) projectedTop = 0 + $tHeight;
				
				$pp_pic_holder.css({
					'top': projectedTop,
					'left': (windowWidth/2) + $scrollPos['scrollLeft'] - ($pWidth/2)
				});
		
				$ppt.css({
					'top' : projectedTop - $tHeight,
					'left' : (windowWidth/2) + $scrollPos['scrollLeft'] - ($pWidth/2) + (settings.padding/2)
				});
			};
		};
	
		function _getScroll(){
			if (self.pageYOffset) {
				scrollTop = self.pageYOffset;
				scrollLeft = self.pageXOffset;
			} else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
				scrollTop = document.documentElement.scrollTop;
				scrollLeft = document.documentElement.scrollLeft;
			} else if (document.body) {// all other Explorers
				scrollTop = document.body.scrollTop;
				scrollLeft = document.body.scrollLeft;	
			}
			
			return {scrollTop:scrollTop,scrollLeft:scrollLeft};
		};
	
		function _resizeOverlay() {
			$('div.pp_overlay').css({
				'height':$(document).height(),
				'width':$(window).width()
			});
		};
	
		function _buildOverlay(){
			toInject = "";
			
			// Build the background overlay div
			toInject += "<div class='pp_overlay'></div>";
			
			// Basic HTML for the picture holder
			toInject += '<div class="pp_pic_holder"><div class="pp_top"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div><div class="pp_content"><a href="#" class="pp_expand" title="Expand the image">Expand</a><div class="pp_loaderIcon"></div><div class="pp_hoverContainer"><a class="pp_next" href="#">next</a><a class="pp_previous" href="#">previous</a></div><div id="pp_full_res"></div><div class="pp_details clearfix"><a class="pp_close" href="#">Close</a><p class="pp_description"></p><div class="pp_nav"><a href="#" class="pp_arrow_previous">Previous</a><p class="currentTextHolder">0'+settings.counter_separator_label+'0</p><a href="#" class="pp_arrow_next">Next</a></div></div></div><div class="pp_bottom"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div></div>';
			
			// Basic html for the title holder
			toInject += '<div class="ppt"></div>';
			
			$('body').append(toInject);
			
			// So it fades nicely
			$('div.pp_overlay').css('opacity',0);
			
			// Set my global selectors
			$pp_pic_holder = $('.pp_pic_holder');
			$ppt = $('.ppt');
			
			$('div.pp_overlay').css('height',$(document).height()).hide().bind('click',function(){
				$.prettyPhoto.close();
			});

			$('a.pp_close').bind('click',function(){ $.prettyPhoto.close(); return false; });

			$('a.pp_expand').bind('click',function(){				
				$this = $(this);
				
				// Expand the image
				if($this.hasClass('pp_expand')){
					$this.removeClass('pp_expand').addClass('pp_contract');
					doresize = false;
				}else{
					$this.removeClass('pp_contract').addClass('pp_expand');
					doresize = true;
				};
			
				_hideContent();
				
				$pp_pic_holder.find('.pp_hoverContainer, #pp_full_res, .pp_details').fadeOut(settings.animationSpeed,function(){
					$.prettyPhoto.open(images,titles,descriptions);
				});
		
				return false;	
			});
		
			$pp_pic_holder.find('.pp_previous, .pp_arrow_previous').bind('click',function(){
				$.prettyPhoto.changePage('previous');
				return false;
			});
		
			$pp_pic_holder.find('.pp_next, .pp_arrow_next').bind('click',function(){
				$.prettyPhoto.changePage('next');
				return false;
			});

			$pp_pic_holder.find('.pp_hoverContainer').css({
				'margin-left': settings.padding/2
			});
		};
	};
	
	function grab_param(name,url){
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( url );
	  if( results == null )
	    return "";
	  else
	    return results[1];
	}
})(jQuery);