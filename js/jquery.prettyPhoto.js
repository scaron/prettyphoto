/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 2.2.5
------------------------------------------------------------------------- */

(function($) {
	$.fn.prettyPhoto = function(settings) {
		// global Variables
		var caller = 0;
		var doresize = true;
		var imagesArray = [];
		var setPosition = 0; /* Position in the set */
	
		$(window).scroll(function(){ _centerPicture(); });
		$(window).resize(function(){ _centerPicture(); _resizeOverlay(); });
		$(document).keyup(function(e){
			switch(e.keyCode){
				case 37:
					if (setPosition == 1) return;
					changePicture('previous');
					break;
				case 39:
					if (setPosition == setCount) return;
					changePicture('next');
					break;
				case 27:
					close();
					break;
			};
	    });
 
	
		settings = jQuery.extend({
			animationSpeed: 'normal', /* fast/slow/normal */
			padding: 40, /* padding for each side of the picture */
			opacity: 0.35, /* Value between 0 and 1 */
			showTitle: true, /* true/false */
			allowresize: true, /* true/false */
			counter_separator_label: '/', /* The separator for the gallery counter 1 "of" 2 */
			theme: 'light_rounded' /* light_rounded / dark_rounded / light_square / dark_square */
		}, settings);
	
		$(this).each(function(){
			var hasTitle = false;
			var isSet = false;
			var setCount = 0; /* Total images in the set */
			var arrayPosition = 0; /* Total position in the array */
			
			imagesArray[imagesArray.length] = this;
			$(this).bind('click',function(){
				open(this);
				return false;
			});
		});
	
		function open(el) {
			caller = $(el);
		
			// Find out if the picture is part of a set
			theRel = $(caller).attr('rel');
			galleryRegExp = /\[(?:.*)\]/;
			theGallery = galleryRegExp.exec(theRel);
		
			// Calculate the number of items in the set, and the position of the clicked picture.
			isSet = false;
			setCount = 0;
			for (i = 0; i < imagesArray.length; i++){
				if($(imagesArray[i]).attr('rel').indexOf(theGallery) != -1){
					setCount++;
					if(setCount > 1) isSet = true;

					if($(imagesArray[i]).attr('href') == $(el).attr('href')){
						setPosition = setCount;
						arrayPosition = i;
					};
				};
			};
		
			_buildOverlay(isSet);

			// Display the current position
			$('div.pp_pic_holder p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);

			// Position the picture in the center of the viewing area
			_centerPicture();
		
			$('div.pp_pic_holder #full_res').hide();
			$('.pp_loaderIcon').show();
			
			_preload();
		};
	
		showimage = function(width,height,containerWidth,containerHeight,contentHeight,contentWidth,resized){
			$('.pp_loaderIcon').hide();
			var scrollPos = _getScroll();

			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};

			$('div.pp_pic_holder .pp_content').animate({'height':contentHeight,'width':containerWidth},settings.animationSpeed);

			projectedTop = scrollPos['scrollTop'] + ((windowHeight/2) - (containerHeight/2));
			if(projectedTop < 0) projectedTop = 0 + $('div.ppt').height();

			// Resize the holder
			$('div.pp_pic_holder').animate({
				'top': projectedTop,
				'left': ((windowWidth/2) - (containerWidth/2)),
				'width': containerWidth
			},settings.animationSpeed,function(){
				$('#fullResImage').attr({
					'width':width,
					'height':height
				});

				$('div.pp_pic_holder').width(containerWidth);
				$('div.pp_pic_holder .hoverContainer').height(height).width(width);

				// Fade the new image
				$('div.pp_pic_holder #full_res').fadeIn(settings.animationSpeed);

				// Show the nav elements
				_shownav();
			
				// Fade the resizing link if the image is resized
				if(resized) $('a.pp_expand,a.pp_contract').fadeIn(settings.animationSpeed);
			});
		};
	
		function changePicture(direction){
			if(direction == 'previous') {
				arrayPosition--;
				setPosition--;
			}else{
				arrayPosition++;
				setPosition++;
			};

			// Allow the resizing of the images
			if(!doresize) doresize = true;

			// Fade out the current picture
			$('div.pp_pic_holder .hoverContainer,div.pp_pic_holder .pp_details').fadeOut(settings.animationSpeed);
			$('div.pp_pic_holder #full_res').fadeOut(settings.animationSpeed,function(){
				$('.pp_loaderIcon').show();
			
				// Preload the image
				_preload();
			});

			_hideTitle();
			$('a.pp_expand,a.pp_contract').fadeOut(settings.animationSpeed,function(){
				$(this).removeClass('pp_contract').addClass('pp_expand');
			});
		};
	
		function close(){
			$('div.pp_pic_holder,div.ppt').fadeOut(settings.animationSpeed, function(){
				$('div.pp_overlay').fadeOut(settings.animationSpeed, function(){
					$('div.pp_overlay,div.pp_pic_holder,div.ppt').remove();
				
					// To fix the bug with IE select boxes
					if($.browser.msie && $.browser.version == 6){
						$('select').css('visibility','visible');
					};
				});
			});
		};
	
		function _checkPosition(){
			// If at the end, hide the next link
			if(setPosition == setCount) {
				$('div.pp_pic_holder a.pp_next').css('visibility','hidden');
				$('div.pp_pic_holder a.pp_arrow_next').addClass('disabled').unbind('click');
			}else{ 
				$('div.pp_pic_holder a.pp_next').css('visibility','visible');
				$('div.pp_pic_holder a.pp_arrow_next.disabled').removeClass('disabled').bind('click',function(){
					changePicture('next');
					return false;
				});
			};
		
			// If at the beginning, hide the previous link
			if(setPosition == 1) {
				$('div.pp_pic_holder a.pp_previous').css('visibility','hidden');
				$('div.pp_pic_holder a.pp_arrow_previous').addClass('disabled').unbind('click');
			}else{
				$('div.pp_pic_holder a.pp_previous').css('visibility','visible');
				$('div.pp_pic_holder a.pp_arrow_previous.disabled').removeClass('disabled').bind('click',function(){
					changePicture('previous');
					return false;
				});
			};
		
			// Change the current picture text
			$('div.pp_pic_holder p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);
		
			var $c = (isSet) ? $(imagesArray[arrayPosition]) : $(caller);

			if($c.attr('title')){
				$('div.pp_pic_holder .pp_description').show().html(unescape($c.attr('title')));
			}else{
				$('div.pp_pic_holder .pp_description').hide().text('');
			};
		
			if($c.find('img').attr('alt') && settings.showTitle){
				hasTitle = true;
				$('div.ppt .ppt_content').html(unescape($c.find('img').attr('alt')));
			}else{
				hasTitle = false;
			};
		};
	
		function _fitToViewport(width,height){
			hasBeenResized = false;
		
			$('div.pp_pic_holder .pp_details').width(width); /* To have the correct height */
			$('div.pp_pic_holder .pp_details p.pp_description').width(width - parseFloat($('div.pp_pic_holder a.pp_close').css('width'))); /* So it doesn't overlap the button */
		
			// Get the container size, to resize the holder to the right dimensions
			contentHeight = height + parseFloat($('div.pp_pic_holder .pp_details').height()) + parseFloat($('div.pp_pic_holder .pp_details').css('margin-top')) + parseFloat($('div.pp_pic_holder .pp_details').css('margin-bottom'));
			contentWidth = width;
			containerHeight = height + parseFloat($('div.ppt').height()) + parseFloat($('div.pp_pic_holder .pp_top').height()) + parseFloat($('div.pp_pic_holder .pp_bottom').height());
			containerWidth = width + settings.padding;
		
			// Define them in case there's no resize needed
			imageWidth = width;
			imageHeight = height;

			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};
		
			if( ((containerWidth > windowWidth) || (containerHeight > windowHeight)) && doresize && settings.allowresize) {
				hasBeenResized = true;
			
				if((containerWidth > windowWidth) && (containerHeight > windowHeight)){
					// Get the original geometry and calculate scales
					var xscale =  (containerWidth + 200) / windowWidth;
					var yscale = (containerHeight + 200) / windowHeight;
				}else{
					// Get the original geometry and calculate scales
					var xscale = windowWidth / containerWidth;
					var yscale = windowHeight / containerHeight;
				}

				// Recalculate new size with default ratio
				if (yscale<xscale){
					imageWidth = Math.round(width * yscale * 0.9);
					imageHeight = Math.round(height * yscale * 0.9);
				} else {
					imageWidth = Math.round(width * xscale * 0.9);
					imageHeight = Math.round(height * xscale * 0.9);
				};
			
				// Define the new dimensions
				contentHeight = imageHeight + parseFloat($('div.pp_pic_holder .pp_details').height()) + parseFloat($('div.pp_pic_holder .pp_details').css('margin-top')) + parseFloat($('div.pp_pic_holder .pp_details').css('margin-bottom'));
				contentWidth = imageWidth;
				containerHeight = imageHeight + parseFloat($('div.ppt').height()) + parseFloat($('div.pp_pic_holder .pp_top').height()) + parseFloat($('div.pp_pic_holder .pp_bottom').height());
				containerWidth = imageWidth + settings.padding;
			
				$('div.pp_pic_holder .pp_details').width(contentWidth); /* To have the correct height */
				$('div.pp_pic_holder .pp_details p.pp_description').width(contentWidth - parseFloat($('div.pp_pic_holder a.pp_close').css('width'))); /* So it doesn't overlap the button */
			};

			return {
				width:imageWidth,
				height:imageHeight,
				containerHeight:containerHeight,
				containerWidth:containerWidth,
				contentHeight:contentHeight,
				contentWidth:contentWidth,
				resized:hasBeenResized
			};
		};
	
		function _centerPicture(){
			//Make sure the gallery is open
			if($('div.pp_pic_holder').size() > 0){
			
				var scrollPos = _getScroll();
			
				if($.browser.opera) {
					windowHeight = window.innerHeight;
					windowWidth = window.innerWidth;
				}else{
					windowHeight = $(window).height();
					windowWidth = $(window).width();
				};
			
				if(doresize) {
					projectedTop = (windowHeight/2) + scrollPos['scrollTop'] - ($('div.pp_pic_holder').height()/2);
					if(projectedTop < 0) projectedTop = 0 + $('div.ppt').height();
					
					$('div.pp_pic_holder').css({
						'top': projectedTop,
						'left': (windowWidth/2) + scrollPos['scrollLeft'] - ($('div.pp_pic_holder').width()/2)
					});
			
					$('div.ppt').css({
						'top' : $('div.pp_pic_holder').offset().top - $('div.ppt').height(),
						'left' : $('div.pp_pic_holder').offset().left + (settings.padding/2)
					});
				};
			};
		};
	
		function _shownav(){
			if(isSet) $('div.pp_pic_holder .hoverContainer').fadeIn(settings.animationSpeed);
			$('div.pp_pic_holder .pp_details').fadeIn(settings.animationSpeed);

			_showTitle();
		};
	
		function _showTitle(){
			if(settings.showTitle && hasTitle){
				$('div.ppt').css({
					'top' : $('div.pp_pic_holder').offset().top - 22,
					'left' : $('div.pp_pic_holder').offset().left + (settings.padding/2),
					'display' : 'none'
				});
			
				$('div.ppt div.ppt_content').css('width','auto');
			
				if($('div.ppt').width() > $('div.pp_pic_holder').width()){
					$('div.ppt div.ppt_content').css('width',$('div.pp_pic_holder').width() - (settings.padding * 2));
				}else{
					$('div.ppt div.ppt_content').css('width','');
				};
			
				$('div.ppt').fadeIn(settings.animationSpeed);
			};
		};
	
		function _hideTitle() {
			$('div.ppt').fadeOut(settings.animationSpeed);
		};
	
		function _preload(){
			// Hide the next/previous links if on first or last images.
			_checkPosition();
		
			// Set the new image
			imgPreloader = new Image();
		
			// Preload the neighbour images
			nextImage = new Image();
			if(isSet && setPosition > setCount) nextImage.src = $(imagesArray[arrayPosition + 1]).attr('href');
			prevImage = new Image();
			if(isSet && imagesArray[arrayPosition - 1]) prevImage.src = $(imagesArray[arrayPosition - 1]).attr('href');

			$('div.pp_pic_holder .pp_content').css('overflow','hidden');
		
			if(isSet) {
				$('div.pp_pic_holder #fullResImage').attr('src',$(imagesArray[arrayPosition]).attr('href'));
			}else{
				$('div.pp_pic_holder #fullResImage').attr('src',$(caller).attr('href'));
			};

			imgPreloader.onload = function(){
				var correctSizes = _fitToViewport(imgPreloader.width,imgPreloader.height);
				imgPreloader.width = correctSizes['width'];
				imgPreloader.height = correctSizes['height'];
			
				// Need that small delay for the anim to be nice
				setTimeout('showimage(imgPreloader.width,imgPreloader.height,'+correctSizes["containerWidth"]+','+correctSizes["containerHeight"]+','+correctSizes["contentHeight"]+','+correctSizes["contentWidth"]+','+correctSizes["resized"]+')',500);
			};
		
			(isSet) ? imgPreloader.src = $(imagesArray[arrayPosition]).attr('href') : imgPreloader.src = $(caller).attr('href');
		};
	
		function _getScroll(){
			scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
			return {scrollTop:scrollTop,scrollLeft:scrollLeft};
		};
	
		function _resizeOverlay() {
			$('div.pp_overlay').css({
				'height':$(document).height(),
				'width':$(window).width()
			});
		};
	
		function _buildOverlay(){
		
			// Build the background overlay div
			backgroundDiv = "<div class='pp_overlay'></div>";
			$('body').append(backgroundDiv);
			$('div.pp_overlay').css('height',$(document).height()).bind('click',function(){
				close();
			});
		
			// Basic HTML for the picture holder
			pictureHolder = '<div class="pp_pic_holder"><div class="pp_top"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div><div class="pp_content"><a href="#" class="pp_expand" title="Expand the image">Expand</a><div class="pp_loaderIcon"></div><div class="hoverContainer"><a class="pp_next" href="#">next</a><a class="pp_previous" href="#">previous</a></div><div id="full_res"><img id="fullResImage" src="" /></div><div class="pp_details clearfix"><a class="pp_close" href="#">Close</a><p class="pp_description"></p><div class="pp_nav"><a href="#" class="pp_arrow_previous">Previous</a><p class="currentTextHolder">0'+settings.counter_separator_label+'0</p><a href="#" class="pp_arrow_next">Next</a></div></div></div><div class="pp_bottom"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div></div>';
		
			// Basic html for the title holder
			titleHolder = '<div class="ppt"><div class="ppt_left"></div><div class="ppt_content"></div><div class="ppt_right"></div></div>';

			$('body').append(pictureHolder).append(titleHolder);

			$('.pp_pic_holder,.titleHolder').css({'opacity': 0});
			$('.pp_pic_holder,.ppt').addClass(settings.theme);
			$('a.pp_close').bind('click',function(){ close(); return false; });
			$('a.pp_expand').bind('click',function(){
			
				// Expand the image
				if($(this).hasClass('pp_expand')){
					$(this).removeClass('pp_expand').addClass('pp_contract');
					doresize = false;
				}else{
					$(this).removeClass('pp_contract').addClass('pp_expand');
					doresize = true;
				};
			
				_hideTitle();
				$('div.pp_pic_holder .hoverContainer,div.pp_pic_holder #full_res').fadeOut(settings.animationSpeed);
				$('div.pp_pic_holder .pp_details').fadeOut(settings.animationSpeed,function(){
					_preload();
				});
			
				return false;
			});
		
			$('.pp_pic_holder .pp_previous,.pp_pic_holder .pp_arrow_previous').bind('click',function(){
				changePicture('previous');
				return false;
			});
		
			$('.pp_pic_holder .pp_next,.pp_pic_holder .pp_arrow_next').bind('click',function(){
				changePicture('next');
				return false;
			});

			$('.hoverContainer').css({
				'margin-left': settings.padding/2
			});
		
			// If it's not a set, hide the links
			if(!isSet) {
				$('.hoverContainer,.pp_nav').hide();
			};


			// To fix the bug with IE select boxes
			if($.browser.msie && $.browser.version == 6){
				$('body').addClass('ie6');
				$('select').css('visibility','hidden');
			};

			// Then fade it in
			$('div.pp_overlay').css('opacity',0).fadeTo(settings.animationSpeed,settings.opacity, function(){
				$('div.pp_pic_holder').css('opacity',0).fadeIn(settings.animationSpeed,function(){
					// To fix an IE bug
					$('div.pp_pic_holder').attr('style','left:'+$('div.pp_pic_holder').css('left')+';top:'+$('div.pp_pic_holder').css('top')+';');
				});
			});
		};
	};
})(jQuery);