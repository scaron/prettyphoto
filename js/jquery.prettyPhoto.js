/* ------------------------------------------------------------------------
	Class: prettyPhoto
	Use: Lightbox clone for jQuery
	Author: Stephane Caron (http://www.no-margin-for-errors.com)
	Version: 2.4.3
------------------------------------------------------------------------- */

var $pp_pic_holder;
var $ppt;

(function($) {
	$.fn.prettyPhoto = function(settings) {
		// global Variables
		var doresize = true;
		var percentBased = false;
		var imagesArray = [];
		var setPosition = 0; /* Position in the set */
		var pp_contentHeight;
		var pp_contentWidth;
		var pp_containerHeight;
		var pp_containerWidth;
		var pp_type = 'image';
	
		// Global elements
		var $caller;
		var $scrollPos = _getScroll();
	
		$(window).scroll(function(){ $scrollPos = _getScroll(); _centerPicture(); });
		$(window).resize(function(){ _centerPicture(); _resizeOverlay(); });
		$(document).keypress(function(e){
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
			$caller = $(el);
		
			// Find out if the picture is part of a set
			theRel = $caller.attr('rel');
			galleryRegExp = /\[(?:.*)\]/;
			theGallery = galleryRegExp.exec(theRel);
		
			// Calculate the number of items in the set, and the position of the clicked picture.
			isSet = false;
			setCount = 0;
			
			_getFileType();
			
			for (i = 0; i < imagesArray.length; i++){
				if($(imagesArray[i]).attr('rel').indexOf(theGallery) != -1){
					setCount++;
					if(setCount > 1) isSet = true;

					if($(imagesArray[i]).attr('href') == $caller.attr('href')){
						setPosition = setCount;
						arrayPosition = i;
					};
				};
			};
		
			_buildOverlay();

			// Display the current position
			$pp_pic_holder.find('p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);

			// Position the picture in the center of the viewing area
			_centerPicture();
		
			$('#pp_full_res').hide();
			$pp_pic_holder.find('.pp_loaderIcon').show();
		};
	
		showimage = function(width,height,containerWidth,containerHeight,contentHeight,contentWidth,resized){
			$('.pp_loaderIcon').hide();

			if($.browser.opera) {
				windowHeight = window.innerHeight;
				windowWidth = window.innerWidth;
			}else{
				windowHeight = $(window).height();
				windowWidth = $(window).width();
			};

			$pp_pic_holder.find('.pp_content').animate({'height':contentHeight},settings.animationSpeed);

			projectedTop = $scrollPos['scrollTop'] + ((windowHeight/2) - (containerHeight/2));
			if(projectedTop < 0) projectedTop = 0 + $pp_pic_holder.find('.ppt').height();

			// Resize the holder
			$pp_pic_holder.animate({
				'top': projectedTop,
				'left': ((windowWidth/2) - (containerWidth/2)),
				'width': containerWidth
			},settings.animationSpeed,function(){
				$pp_pic_holder.width(containerWidth);
				$pp_pic_holder.find('.pp_hoverContainer,#fullResImage').height(height).width(width);

				// Fade the new image
				$pp_pic_holder.find('#pp_full_res').fadeIn(settings.animationSpeed,function(){
					$(this).find('object,embed').css('visibility','visible');
				});

				// Show the nav elements
				_showContent();
			
				// Fade the resizing link if the image is resized
				if(resized) $('a.pp_expand,a.pp_contract').fadeIn(settings.animationSpeed);
			});
		};
		
		function _showContent(){
			// Show the nav
			if(isSet && pp_type=="image") { $pp_pic_holder.find('.pp_hoverContainer').fadeIn(settings.animationSpeed); }else{ $pp_pic_holder.find('.pp_hoverContainer').hide(); }
			$pp_pic_holder.find('.pp_details').fadeIn(settings.animationSpeed);
			
			// Show the title
			if(settings.showTitle && hasTitle){
				$ppt.css({
					'top' : $pp_pic_holder.offset().top - 22,
					'left' : $pp_pic_holder.offset().left + (settings.padding/2),
					'display' : 'none'
				});
			
				$ppt.fadeIn(settings.animationSpeed);
			};
		}
		
		function _hideContent(){
			// Fade out the current picture
			$pp_pic_holder.find('.pp_hoverContainer,.pp_details').fadeOut(settings.animationSpeed);
			$pp_pic_holder.find('#pp_full_res object,#pp_full_res embed').css('visibility','hidden');
			$pp_pic_holder.find('#pp_full_res').fadeOut(settings.animationSpeed,function(){
				$('.pp_loaderIcon').show();
			
				// Preload the image
				_preload();
			});
			
			// Hide the title
			$ppt.fadeOut(settings.animationSpeed);
		}
	
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

			_hideContent();
			$('a.pp_expand,a.pp_contract').fadeOut(settings.animationSpeed,function(){
				$(this).removeClass('pp_contract').addClass('pp_expand');
			});
		};
	
		function close(){
			$pp_pic_holder.find('object,embed').css('visibility','hidden');
			
			$('div.pp_pic_holder,div.ppt').fadeOut(settings.animationSpeed);
			
			$('div.pp_overlay').fadeOut(settings.animationSpeed, function(){
				$('div.pp_overlay,div.pp_pic_holder,div.ppt').remove();
			
				// To fix the bug with IE select boxes
				if($.browser.msie && $.browser.version == 6){
					$('select').css('visibility','visible');
				};
				
				settings.callback();
			});
			
			doresize = true;
		};
	
		function _checkPosition(){
			// If at the end, hide the next link
			if(setPosition == setCount) {
				$pp_pic_holder.find('a.pp_next').css('visibility','hidden');
				$pp_pic_holder.find('a.pp_arrow_next').addClass('disabled').unbind('click');
			}else{ 
				$pp_pic_holder.find('a.pp_next').css('visibility','visible');
				$pp_pic_holder.find('a.pp_arrow_next.disabled').removeClass('disabled').bind('click',function(){
					changePicture('next');
					return false;
				});
			};
		
			// If at the beginning, hide the previous link
			if(setPosition == 1) {
				$pp_pic_holder.find('a.pp_previous').css('visibility','hidden');
				$pp_pic_holder.find('a.pp_arrow_previous').addClass('disabled').unbind('click');
			}else{
				$pp_pic_holder.find('a.pp_previous').css('visibility','visible');
				$pp_pic_holder.find('a.pp_arrow_previous.disabled').removeClass('disabled').bind('click',function(){
					changePicture('previous');
					return false;
				});
			};
		
			// Change the current picture text
			$pp_pic_holder.find('p.currentTextHolder').text(setPosition + settings.counter_separator_label + setCount);
		
			$caller = (isSet) ? $(imagesArray[arrayPosition]) : $caller;
			_getFileType();

			if($caller.attr('title')){
				$pp_pic_holder.find('.pp_description').show().html(unescape($caller.attr('title')));
			}else{
				$pp_pic_holder.find('.pp_description').hide().text('');
			};
		
			if($caller.find('img').attr('alt') && settings.showTitle){
				hasTitle = true;
				$ppt.html(unescape($caller.find('img').attr('alt')));
			}else{
				hasTitle = false;
			};
		};
	
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
		
		function _getDimensions(width,height){
			$pp_pic_holder.find('.pp_details').width(width).find('.pp_description').width(width - parseFloat($pp_pic_holder.find('a.pp_close').css('width'))); /* To have the correct height */
			
			// Get the container size, to resize the holder to the right dimensions
			pp_contentHeight = height + $pp_pic_holder.find('.pp_details').height() + parseFloat($pp_pic_holder.find('.pp_details').css('marginTop')) + parseFloat($pp_pic_holder.find('.pp_details').css('marginBottom'));
			pp_contentWidth = width;
			pp_containerHeight = pp_contentHeight + $pp_pic_holder.find('.ppt').height() + $pp_pic_holder.find('.pp_top').height() + $pp_pic_holder.find('.pp_bottom').height();
			pp_containerWidth = width + settings.padding;
		}
	
		function _getFileType(){
			if ($caller.attr('href').match(/youtube\.com\/watch/i)) {
				pp_type = 'youtube';
			}else if($caller.attr('href').indexOf('.mov') != -1){ 
				pp_type = 'quicktime';
			}else if($caller.attr('href').indexOf('.swf') != -1){
				pp_type = 'flash';
			}else if($caller.attr('href').indexOf('iframe') != -1){
				pp_type = 'iframe'
			}else{
				pp_type = 'image';
			}
		}
	
		function _centerPicture(){
			if ($pp_pic_holder){ if($pp_pic_holder.size() == 0){ return; }}else{ return; }; //Make sure the gallery is open

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
	
		function _preload(){
			// Hide the next/previous links if on first or last images.
			_checkPosition();
		
			if(pp_type == 'image'){
				// Set the new image
				imgPreloader = new Image();
		
				// Preload the neighbour images
				nextImage = new Image();
				if(isSet && setPosition > setCount) nextImage.src = $(imagesArray[arrayPosition + 1]).attr('href');
				prevImage = new Image();
				if(isSet && imagesArray[arrayPosition - 1]) prevImage.src = $(imagesArray[arrayPosition - 1]).attr('href');

				pp_typeMarkup = '<img id="fullResImage" src="" />';				
				$pp_pic_holder.find('#pp_full_res')[0].innerHTML = pp_typeMarkup;

				$pp_pic_holder.find('.pp_content').css('overflow','hidden');
				$pp_pic_holder.find('#fullResImage').attr('src',$caller.attr('href'));

				imgPreloader.onload = function(){
					var correctSizes = _fitToViewport(imgPreloader.width,imgPreloader.height);
					imgPreloader.width = correctSizes['width'];
					imgPreloader.height = correctSizes['height'];
					showimage(imgPreloader.width,imgPreloader.height,correctSizes["containerWidth"],correctSizes["containerHeight"],correctSizes["contentHeight"],correctSizes["contentWidth"],correctSizes["resized"]);
				};
		
				imgPreloader.src = $caller.attr('href');
			}else{
				// Get the dimensions
				movie_width = ( parseFloat(grab_param('width',$caller.attr('href'))) ) ? grab_param('width',$caller.attr('href')) : "425";
				movie_height = ( parseFloat(grab_param('height',$caller.attr('href'))) ) ? grab_param('height',$caller.attr('href')) : "344";

				// If the size is % based
				if(movie_width.indexOf('%') != -1 || movie_height.indexOf('%') != -1){
					movie_height = ($(window).height() * parseFloat(movie_height) / 100) - 100;
					movie_width = ($(window).width() * parseFloat(movie_width) / 100) - 100;
					parsentBased = true;
				}else{
					movie_height = parseFloat(movie_height);
					movie_width = parseFloat(movie_width);
				}
				
				if(pp_type == 'quicktime'){ movie_height+=13; }
				
				// Fit them to viewport
				correctSizes = _fitToViewport(movie_width,movie_height);
				
				if(pp_type == 'youtube'){
					pp_typeMarkup = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://www.youtube.com/v/'+grab_param('v',$caller.attr('href'))+'" /><embed src="http://www.youtube.com/v/'+grab_param('v',$caller.attr('href'))+'" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"></embed></object>';
				}else if(pp_type == 'quicktime'){
					pp_typeMarkup = '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="'+correctSizes['height']+'" width="'+correctSizes['width']+'"><param name="src" value="'+$caller.attr('href')+'"><param name="autoplay" value="true"><param name="type" value="video/quicktime"><embed src="'+$caller.attr('href')+'" height="'+correctSizes['height']+'" width="'+correctSizes['width']+'" autoplay="true" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>';
				}else if(pp_type == 'flash'){
					flash_vars = $caller.attr('href');
					flash_vars = flash_vars.substring($caller.attr('href').indexOf('flashvars') + 10,$caller.attr('href').length);

					filename = $caller.attr('href');
					filename = filename.substring(0,filename.indexOf('?'));

					pp_typeMarkup = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="'+filename+'?'+flash_vars+'" /><embed src="'+filename+'?'+flash_vars+'" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="'+correctSizes['width']+'" height="'+correctSizes['height']+'"></embed></object>';
				}else if(pp_type == 'iframe'){
					movie_url = $caller.attr('href');
					movie_url = movie_url.substr(0,movie_url.indexOf('iframe')-1);

					pp_typeMarkup = '<iframe src ="'+movie_url+'" width="'+(correctSizes['width']-10)+'" height="'+(correctSizes['height']-10)+'" frameborder="no"></iframe>';
				}
				// Append HTML
				$pp_pic_holder.find('#pp_full_res')[0].innerHTML = pp_typeMarkup;
				
				// Show content
				showimage(correctSizes['width'],correctSizes['height'],correctSizes["containerWidth"],correctSizes["containerHeight"],correctSizes["contentHeight"],correctSizes["contentWidth"],correctSizes["resized"]);
			}
		};
	
		function _getScroll(){
			if (self.pageYOffset) {
				scrollTop = self.pageYOffset;
				scrollLeft = self.pageXOffset;
			} else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
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
			
			// Define the markup to append, depending on the content type.
			if(pp_type == 'image'){
				pp_typeMarkup = '<img id="fullResImage" src="" />';
			}else{
				pp_typeMarkup = '';
			}
			
			// Basic HTML for the picture holder
			toInject += '<div class="pp_pic_holder"><div class="pp_top"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div><div class="pp_content"><a href="#" class="pp_expand" title="Expand the image">Expand</a><div class="pp_loaderIcon"></div><div class="pp_hoverContainer"><a class="pp_next" href="#">next</a><a class="pp_previous" href="#">previous</a></div><div id="pp_full_res">'+ pp_typeMarkup +'</div><div class="pp_details clearfix"><a class="pp_close" href="#">Close</a><p class="pp_description"></p><div class="pp_nav"><a href="#" class="pp_arrow_previous">Previous</a><p class="currentTextHolder">0'+settings.counter_separator_label+'0</p><a href="#" class="pp_arrow_next">Next</a></div></div></div><div class="pp_bottom"><div class="pp_left"></div><div class="pp_middle"></div><div class="pp_right"></div></div></div>';
			
			// Basic html for the title holder
			toInject += '<div class="ppt"></div>';
			
			$('body').append(toInject);
			
			// Set my global selectors
			$pp_pic_holder = $('.pp_pic_holder');
			$ppt = $('.ppt');
			
			$('div.pp_overlay').css('height',$(document).height()).bind('click',function(){
				close();
			});

			$pp_pic_holder.css({'opacity': 0}).addClass(settings.theme);

			$('a.pp_close').bind('click',function(){ close(); return false; });

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
					_preload();
				});
		
				return false;	
			});
		
			$pp_pic_holder.find('.pp_previous, .pp_arrow_previous').bind('click',function(){
				changePicture('previous');
				return false;
			});
		
			$pp_pic_holder.find('.pp_next, .pp_arrow_next').bind('click',function(){
				changePicture('next');
				return false;
			});

			$pp_pic_holder.find('.pp_hoverContainer').css({
				'margin-left': settings.padding/2
			});
		
			// If it's not a set, hide the links
			if(!isSet) {
				$pp_pic_holder.find('.pp_hoverContainer,.pp_nav').hide();
			};


			// To fix the bug with IE select boxes
			if($.browser.msie && $.browser.version == 6){
				$('body').addClass('ie6');
				$('select').css('visibility','hidden');
			};

			// Then fade it in
			$('div.pp_overlay').css('opacity',0).fadeTo(settings.animationSpeed,settings.opacity, function(){
				$pp_pic_holder.css('opacity',0).fadeIn(settings.animationSpeed,function(){
					$pp_pic_holder.attr('style','left:'+$pp_pic_holder.css('left')+';top:'+$pp_pic_holder.css('top')+';');
					_preload();
				});
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