$(document).ready(function(){
	links.setTarget();
	
	code.init();
});

links = {
	setTarget : function(){
		$("a[rel^='external']").attr('target','_blank');
	}
}

code = {
	init: function(){
		$('pre').each(function(){
			$(this).data('width',$(this).width());
			$(this).width(676).css({'overflow':'hidden','position':'static','top':0,'left':0});
			$(this).hover(
				function() {
					if($(this).data('width') > 670){
						$(this).stop().animate({'width':$(this).data('width') + 20},'fast');
					}
				},
				function() {
					$(this).stop().animate({'width':676},'fast');
				}
			)
		});
	}
}