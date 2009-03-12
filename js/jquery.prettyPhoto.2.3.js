/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 2.2.2
------------------------------------------------------------------------- */

	$.fn.prettyPhoto = function(settings) {
		// global Variables
		var isSet = false; /* Total position in the array */
		var setCount = 0; /* Total images in the set */
		var setPosition = 0; /* Position in the set */
		var arrayPosition = 0; /* Total position in the array */
		var hasTitle = false;
		var caller = 0;
		var doresize = true;
		var imagesArray = [];
	
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
			opacity: 0.35, /* Value betwee 0 and 1 */
			showTitle: true, /* true/false */
			allowresize: true, /* true/false */
			counter_separator_label: '/' /* The separator for the gallery counter 1 "of" 2 */
		}, settings);

		// Make an array out of every item on the page
		imagesArray = $.makeArray($(this));
		console.log(imagesArray);
	
		$(this).bind('click',function(){
			open(this); return false;
		});
	
		function open(el) {
			caller = $(el);
		
			// Find out if the picture is part of a set
			theRel = $(caller).attr('rel');
			galleryRegExp = /\[(?:.*)\]/;
			theGallery = galleryRegExp.exec(theRel);
		
			// Find out the type of content
			contentType = "image";
			if($(caller).attr('href').indexOf('.swf') > 0){ hasTitle = false; contentType = 'flash'; };
		
			// Calculate the number of items in the set, and the position of the clicked picture.
			isSet = false;
			setCount = 0;
			$(imagesArray).each(function(){
				$item = $($(this)[0]);
				console.log($item);
				// if($(this)[0].attr('rel').indexOf(theGallery) != -1){
				// 	setCount++;
				// 	if(setCount > 1) isSet = true;
				// 
				// 	if($(this)[0].attr('href') == $(el).attr('href')){
				// 		setPosition = setCount;
				// 		arrayPosition = i;
				// 	};
				// };
			});
		
			_buildOverlay(isSet);

			// Display the current position
			$('div.pictureHolder p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);

			// Position the picture in the center of the viewing area
			_centerPicture();
		
			$('div.pictureHolder #fullResImageContainer').hide();
			$('.loaderIcon').show();

			// Display the correct type of information
			(contentType == 'image') ? _preload() : _writeFlash();
		};
	
		showimage = function(width,height,containerWidth,containerHeight,contentHeight,contentWidth,resized){
			$('.loaderIcon').hide();
			var scrollPos = _getScroll();

			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};

			$('div.pictureHolder .content').animate({'height':contentHeight,'width':containerWidth},settings.animationSpeed);

			projectedTop = scrollPos['scrollTop'] + ((windowHeight/2) - (containerHeight/2));
			if(projectedTop < 0) projectedTop = 0 + $('div.prettyPhotoTitle').height();

			// Resize the holder
			$('div.pictureHolder').animate({
				'top': projectedTop,
				'left': ((windowWidth/2) - (containerWidth/2)),
				'width': containerWidth
			},settings.animationSpeed,function(){
				$('#fullResImage').attr({
					'width':width,
					'height':height
				});

				$('div.pictureHolder').width(containerWidth);
				$('div.pictureHolder .hoverContainer').height(height).width(width);

				// Show the nav elements
				_shownav();

				// Fade the new image
				$('div.pictureHolder #fullResImageContainer').fadeIn(settings.animationSpeed);
			
				// Fade the resizing link if the image is resized
				if(resized) $('a.expand,a.contract').fadeIn(settings.animationSpeed);
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
			$('div.pictureHolder .hoverContainer,div.pictureHolder .details').fadeOut(settings.animationSpeed);
			$('div.pictureHolder #fullResImageContainer').fadeOut(settings.animationSpeed,function(){
				$('.loaderIcon').show();
			
				// Preload the image
				_preload();
			});

			_hideTitle();
			$('a.expand,a.contract').fadeOut(settings.animationSpeed,function(){
				$(this).removeClass('contract').addClass('expand');
			});
		};
	
		function close(){
			$('div.pictureHolder,div.prettyPhotoTitle').fadeOut(settings.animationSpeed, function(){
				$('div.prettyPhotoOverlay').fadeOut(settings.animationSpeed, function(){
					$('div.prettyPhotoOverlay,div.pictureHolder,div.prettyPhotoTitle').remove();
				
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
				$('div.pictureHolder a.next').css('visibility','hidden');
				$('div.pictureHolder a.arrow_next').addClass('disabled').unbind('click');
			}else{ 
				$('div.pictureHolder a.next').css('visibility','visible');
				$('div.pictureHolder a.arrow_next.disabled').removeClass('disabled').bind('click',function(){
					changePicture('next');
					return false;
				});
			};
		
			// If at the beginning, hide the previous link
			if(setPosition == 1) {
				$('div.pictureHolder a.previous').css('visibility','hidden');
				$('div.pictureHolder a.arrow_previous').addClass('disabled').unbind('click');
			}else{
				$('div.pictureHolder a.previous').css('visibility','visible');
				$('div.pictureHolder a.arrow_previous.disabled').removeClass('disabled').bind('click',function(){
					changePicture('previous');
					return false;
				});
			};
		
			// Change the current picture text
			$('div.pictureHolder p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);
		
			(isSet) ? $c = $(imagesArray[arrayPosition]) : $c = $(caller);

			if($c.attr('title')){
				$('div.pictureHolder .description').show().html(unescape($c.attr('title')));
			}else{
				$('div.pictureHolder .description').hide().text('');
			};
		
			if($c.find('img').attr('alt') && settings.showTitle){
				hasTitle = true;
				$('div.prettyPhotoTitle .prettyPhotoTitleContent').html(unescape($c.find('img').attr('alt')));
			}else{
				hasTitle = false;
			};
		};
	
		function _fitToViewport(width,height){
			hasBeenResized = false;
		
			$('div.pictureHolder .details').width(width); /* To have the correct height */
			$('div.pictureHolder .details p.description').width(width - parseFloat($('div.pictureHolder a.close').css('width'))); /* So it doesn't overlap the button */
		
			// Get the container size, to resize the holder to the right dimensions
			contentHeight = height + parseFloat($('div.pictureHolder .details').height()) + parseFloat($('div.pictureHolder .details').css('margin-top')) + parseFloat($('div.pictureHolder .details').css('margin-bottom'));
			contentWidth = width;
			containerHeight = height + parseFloat($('div.prettyPhotoTitle').height()) + parseFloat($('div.pictureHolder .top').height()) + parseFloat($('div.pictureHolder .bottom').height());
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
				contentHeight = imageHeight + parseFloat($('div.pictureHolder .details').height()) + parseFloat($('div.pictureHolder .details').css('margin-top')) + parseFloat($('div.pictureHolder .details').css('margin-bottom'));
				contentWidth = imageWidth;
				containerHeight = imageHeight + parseFloat($('div.prettyPhotoTitle').height()) + parseFloat($('div.pictureHolder .top').height()) + parseFloat($('div.pictureHolder .bottom').height());
				containerWidth = imageWidth + settings.padding;
			
				$('div.pictureHolder .details').width(contentWidth); /* To have the correct height */
				$('div.pictureHolder .details p.description').width(contentWidth - parseFloat($('div.pictureHolder a.close').css('width'))); /* So it doesn't overlap the button */
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
			if($('div.pictureHolder').size() > 0){
			
				var scrollPos = _getScroll();
			
				if($.browser.opera) {
					windowHeight = window.innerHeight;
					windowWidth = window.innerWidth;
				}else{
					windowHeight = $(window).height();
					windowWidth = $(window).width();
				};
			
				if(doresize) {
					projectedTop = (windowHeight/2) + scrollPos['scrollTop'] - ($('div.pictureHolder').height()/2);
					if(projectedTop < 0) projectedTop = 0 + $('div.prettyPhotoTitle').height();
					
					$('div.pictureHolder').css({
						'top': projectedTop,
						'left': (windowWidth/2) + scrollPos['scrollLeft'] - ($('div.pictureHolder').width()/2)
					});
			
					$('div.prettyPhotoTitle').css({
						'top' : $('div.pictureHolder').offset().top - $('div.prettyPhotoTitle').height(),
						'left' : $('div.pictureHolder').offset().left + (settings.padding/2)
					});
				};
			};
		};
	
		function _shownav(){
			if(isSet) $('div.pictureHolder .hoverContainer').fadeIn(settings.animationSpeed);
			$('div.pictureHolder .details').fadeIn(settings.animationSpeed);

			_showTitle();
		};
	
		function _showTitle(){
			if(settings.showTitle && hasTitle){
				$('div.prettyPhotoTitle').css({
					'top' : $('div.pictureHolder').offset().top,
					'left' : $('div.pictureHolder').offset().left + (settings.padding/2),
					'display' : 'block'
				});
			
				$('div.prettyPhotoTitle div.prettyPhotoTitleContent').css('width','auto');
			
				if($('div.prettyPhotoTitle').width() > $('div.pictureHolder').width()){
					$('div.prettyPhotoTitle div.prettyPhotoTitleContent').css('width',$('div.pictureHolder').width() - (settings.padding * 2));
				}else{
					$('div.prettyPhotoTitle div.prettyPhotoTitleContent').css('width','');
				};
			
				$('div.prettyPhotoTitle').animate({'top':($('div.pictureHolder').offset().top - 22)},settings.animationSpeed);
			};
		};
	
		function _hideTitle() {
			$('div.prettyPhotoTitle').animate({'top':($('div.pictureHolder').offset().top)},settings.animationSpeed,function() { $(this).css('display','none'); });
		};
	
		function _preload(){
			// Hide the next/previous links if on first or last images.
			_checkPosition();
		
			// Set the new image
			imgPreloader = new Image();
		
			// Preload the neighbour images
			nextImage = new Image();
			if(isSet) nextImage.src = $(imagesArray[arrayPosition + 1]).attr('href');
			prevImage = new Image();
			if(isSet && imagesArray[arrayPosition - 1]) prevImage.src = $(imagesArray[arrayPosition - 1]).attr('href');

			$('div.pictureHolder .content').css('overflow','hidden');
		
			if(isSet) {
				$('div.pictureHolder #fullResImage').attr('src',$(imagesArray[arrayPosition]).attr('href'));
			}else{
				$('div.pictureHolder #fullResImage').attr('src',$(caller).attr('href'));
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
			$('div.prettyPhotoOverlay').css({
				'height':$(document).height(),
				'width':$(window).width()
			});
		};
	
		function _writeFlash(){
			flashParams = $(caller).attr('rel').split(';');
			$(flashParams).each(function(i){
				// Define the width and height
				if(flashParams[i].indexOf('width') >= 0) flashWidth = flashParams[i].substring(flashParams[i].indexOf('width') + 6, flashParams[i].length);
				if(flashParams[i].indexOf('height') >= 0) flashHeight = flashParams[i].substring(flashParams[i].indexOf('height') + 7, flashParams[i].length);
				if(flashParams[i].indexOf('flashvars') >= 0) flashVars = flashParams[i].substring(flashParams[i].indexOf('flashvars') + 10, flashParams[i].length);
			});
		
			$('.pictureHolder #fullResImageContainer').append('<embed width="'+flashWidth+'" height="'+flashHeight+'" pluginspage="http://www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash" type="application/x-shockwave-flash" wmode="opaque" name="prettyFlash" flashvars="'+flashVars+'" allowscriptaccess="always" bgcolor="#FFFFFF" quality="high" src="'+$(caller).attr('href')+'"/>');
			$('#fullResImage').hide();
		
			contentHeight = parseFloat(flashHeight) + parseFloat($('div.pictureHolder .details').height()) + parseFloat($('div.pictureHolder .details').css('margin-top')) + parseFloat($('div.pictureHolder .details').css('margin-bottom'));
			contentWidth = parseFloat(flashWidth)+ parseFloat($('div.pictureHolder .details').width()) + parseFloat($('div.pictureHolder .details').css('margin-left')) + parseFloat($('div.pictureHolder .details').css('margin-right'));
			containerHeight = contentHeight + parseFloat($('div.pictureHolder .top').height()) + parseFloat($('div.pictureHolder .bottom').height());
			containerWidth = parseFloat(flashWidth) + parseFloat($('div.pictureHolder .content').css("padding-left")) + parseFloat($('div.pictureHolder .content').css("padding-right")) + settings.padding;
		
			setTimeout('showimage('+flashWidth+','+flashHeight+','+containerWidth+','+containerHeight+','+contentHeight+','+contentWidth+')',500);
		};
	
		function _buildOverlay(){
		
			// Build the background overlay div
			backgroundDiv = "<div class='prettyPhotoOverlay'></div>";
			$('body').append(backgroundDiv);
			$('div.prettyPhotoOverlay').css('height',$(document).height()).bind('click',function(){
				close();
			});
		
			// Basic HTML for the picture holder
			pictureHolder = '<div class="pictureHolder"><div class="top"><div class="left"></div><div class="middle"></div><div class="right"></div></div><div class="content"><a href="#" class="expand" title="Expand the image">Expand</a><div class="loaderIcon"></div><div class="hoverContainer"><a class="next" href="#">next</a><a class="previous" href="#">previous</a></div><div id="fullResImageContainer"><img id="fullResImage" src="" /></div><div class="details clearfix"><a class="close" href="#">Close</a><p class="description"></p><div class="nav"><a href="#" class="arrow_previous">Previous</a><p class="currentTextHolder">0'+settings.counter_separator_label+'0</p><a href="#" class="arrow_next">Next</a></div></div></div><div class="bottom"><div class="left"></div><div class="middle"></div><div class="right"></div></div></div>';
		
			// Basic html for the title holder
			titleHolder = '<div class="prettyPhotoTitle"><div class="prettyPhotoTitleLeft"></div><div class="prettyPhotoTitleContent"></div><div class="prettyPhotoTitleRight"></div></div>';

			$('body').append(pictureHolder).append(titleHolder);

			$('.pictureHolder,.titleHolder').css({'opacity': 0});
			$('a.close').bind('click',function(){ close(); return false; });
			$('a.expand').bind('click',function(){
			
				// Expand the image
				if($(this).hasClass('expand')){
					$(this).removeClass('expand').addClass('contract');
					doresize = false;
				}else{
					$(this).removeClass('contract').addClass('expand');
					doresize = true;
				};
			
				_hideTitle();
				$('div.pictureHolder .hoverContainer,div.pictureHolder #fullResImageContainer').fadeOut(settings.animationSpeed);
				$('div.pictureHolder .details').fadeOut(settings.animationSpeed,function(){
					_preload();
				});
			
				return false;
			});
		
			$('.pictureHolder .previous,.pictureHolder .arrow_previous').bind('click',function(){
				changePicture('previous');
				return false;
			});
		
			$('.pictureHolder .next,.pictureHolder .arrow_next').bind('click',function(){
				changePicture('next');
				return false;
			});

			$('.hoverContainer').css({
				'margin-left': settings.padding/2
			});
		
			// If it's not a set, hide the links
			if(!isSet) {
				$('.hoverContainer,.nav').hide();
			};


			// To fix the bug with IE select boxes
			if($.browser.msie && $.browser.version == 6){
				$('select').css('visibility','hidden');
			};

			// Then fade it in
			$('div.prettyPhotoOverlay').css('opacity',0).fadeTo(settings.animationSpeed,settings.opacity, function(){
				$('div.pictureHolder').css('opacity',0).fadeIn(settings.animationSpeed,function(){
					// To fix an IE bug
					$('div.pictureHolder').attr('style','left:'+$('div.pictureHolder').css('left')+';top:'+$('div.pictureHolder').css('top')+';');
				});
			});
		};
	};