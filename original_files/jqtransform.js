/*
 *
 * jqTransform
 * by mathieu vilaplana mvilaplana@dfc-e.com
 * Designer ghyslain armand garmand@dfc-e.com
 *
 *
 * Version 1.0 25.09.08
 * Version 1.1 06.08.09
 * Add event click on Checkbox and Radio
 * Auto calculate the size of a select element
 * Can now, disabled the elements
 * Correct bug in ff if click on select (overflow=hidden)
 * No need any more preloading !!
 * 
 ******************************************** */
 var $j = jQuery.noConflict();
(function($j){
	var defaultOptions = {preloadImg:true};
	var jqTransformImgPreloaded = false;

	var jqTransformPreloadHoverFocusImg = function(strImgUrl) {
		//guillemets to remove for ie
		strImgUrl = strImgUrl.replace(/^url\((.*)\)/,'$j1').replace(/^\"(.*)\"$j/,'$j1');
		var imgHover = new Image();
		imgHover.src = strImgUrl.replace(/\.([a-zA-Z]*)$j/,'-hover.$j1');
		var imgFocus = new Image();
		imgFocus.src = strImgUrl.replace(/\.([a-zA-Z]*)$j/,'-focus.$j1');				
	};

	
	/***************************
	  Labels
	***************************/
	var jqTransformGetLabel = function(objfield){
		var selfForm = $j(objfield.get(0).form);
		var oLabel = objfield.next();
		if(!oLabel.is('label')) {
			oLabel = objfield.prev();
			if(oLabel.is('label')){
				var inputname = objfield.attr('id');
				if(inputname){
					oLabel = selfForm.find('label[for="'+inputname+'"]');
				} 
			}
		}
		if(oLabel.is('label')){return oLabel.css('cursor','pointer');}
		return false;
	};
	
	/* Hide all open selects */
	var jqTransformHideSelect = function(oTarget){
		var ulVisible = $j('.jqTransformSelectWrapper ul:visible');
		ulVisible.each(function(){
			var oSelect = $j(this).parents(".jqTransformSelectWrapper:first").find("select").get(0);
			//do not hide if click on the label object associated to the select
			if( !(oTarget && oSelect.oLabel && oSelect.oLabel.get(0) == oTarget.get(0)) ){$j(this).hide();}
		});
	};
	/* Check for an external click */
	var jqTransformCheckExternalClick = function(event) {
		if ($j(event.target).parents('.jqTransformSelectWrapper').length === 0) { jqTransformHideSelect($j(event.target)); }
	};

	/* Apply document listener */
	var jqTransformAddDocumentListener = function (){
		$j(document).mousedown(jqTransformCheckExternalClick);
	};	
			
	/* Add a new handler for the reset action */
	var jqTransformReset = function(f){
		var sel;
		$j('.jqTransformSelectWrapper select', f).each(function(){sel = (this.selectedIndex<0) ? 0 : this.selectedIndex; $j('ul', $j(this).parent()).each(function(){$j('a:eq('+ sel +')', this).click();});});
		$j('a.jqTransformCheckbox, a.jqTransformRadio', f).removeClass('jqTransformChecked');
		$j('input:checkbox, input:radio', f).each(function(){if(this.checked){$j('a', $j(this).parent()).addClass('jqTransformChecked');}});
	};

	/***************************
	  Buttons
	 ***************************/
	$j.fn.jqTransInputButton = function(){};
	
	/***************************
	  Text Fields 
	 ***************************/
	$j.fn.jqTransInputText = function(){};
	
	/***************************
	  Check Boxes 
	 ***************************/	
	$j.fn.jqTransCheckBox = function(){
		return this.each(function(){
			if($j(this).hasClass('jqTransformHidden')) {return;}

			var $jinput = $j(this);
			var inputSelf = this;

			//set the click on the label
			var oLabel=jqTransformGetLabel($jinput);
			oLabel && oLabel.click(function(){aLink.trigger('click');});
			
			var aLink = $j('<a href="#" class="jqTransformCheckbox"></a>');
			//wrap and add the link
			$jinput.addClass('jqTransformHidden').wrap('<span class="jqTransformCheckboxWrapper"></span>').parent().prepend(aLink);
			//on change, change the class of the link
			$jinput.change(function(){
				this.checked && aLink.addClass('jqTransformChecked') || aLink.removeClass('jqTransformChecked');
				return true;
			});
			// Click Handler, trigger the click and change event on the input
			aLink.click(function(){
				//do nothing if the original input is disabled
				if($jinput.attr('disabled')){return false;}
				//trigger the envents on the input object
				$jinput.trigger('click').trigger("change");	
				return false;
			});

			// set the default state
			this.checked && aLink.addClass('jqTransformChecked');		
		});
	};
	/***************************
	  Radio Buttons 
	 ***************************/	
	$j.fn.jqTransRadio = function(){
		return this.each(function(){
			if($j(this).hasClass('jqTransformHidden')) {return;}

			var $jinput = $j(this);
			var inputSelf = this;
				
			oLabel = jqTransformGetLabel($jinput);
			oLabel && oLabel.click(function(){aLink.trigger('click');});
	
			var aLink = $j('<a href="#" class="jqTransformRadio" rel="'+ this.name +'"></a>');
			$jinput.addClass('jqTransformHidden').wrap('<span class="jqTransformRadioWrapper"></span>').parent().prepend(aLink);
			
			$jinput.change(function(){
				inputSelf.checked && aLink.addClass('jqTransformChecked') || aLink.removeClass('jqTransformChecked');
				return true;
			});
			// Click Handler
			aLink.click(function(){
				if($jinput.attr('disabled')){return false;}
				$jinput.trigger('click').trigger('change');
	
				// uncheck all others of same name input radio elements
				$j('input[name="'+$jinput.attr('name')+'"]',inputSelf.form).not($jinput).each(function(){
					$j(this).attr('type')=='radio' && $j(this).trigger('change');
				});
	
				return false;					
			});
			// set the default state
			inputSelf.checked && aLink.addClass('jqTransformChecked');
		});
	};
	
	/***************************
	  TextArea 
	 ***************************/	
	$j.fn.jqTransTextarea = function(){};
	
	/***************************
	  Select 
	 ***************************/	
	$j.fn.jqTransSelect = function(){
		return this.each(function(index){
			var $jselect = $j(this);

			if($jselect.hasClass('jqTransformHidden')) {return;}
			if($jselect.attr('multiple')) {return;}

			var oLabel  =  jqTransformGetLabel($jselect);
			/* First thing we do is Wrap it */
			var $jwrapper = $jselect
				.addClass('jqTransformHidden')
				.wrap('<div class="jqTransformSelectWrapper"></div>')
				.parent()
				.css({zIndex: 10-index})
			;
			
			/* Now add the html for the select */
			$jwrapper.prepend('<div><span></span><a href="#" class="jqTransformSelectOpen"></a></div><ul></ul>');
			var $jul = $j('ul', $jwrapper).css('width',$jselect.width()).hide();
			/* Now we add the options */
			$j('option', this).each(function(i){
				var oLi = $j('<li><a href="#" index="'+ i +'">'+ $j(this).html() +'</a></li>');
				$jul.append(oLi);
			});
			
			/* Add click handler to the a */
			$jul.find('a').click(function(){
					$j('a.selected', $jwrapper).removeClass('selected');
					$j(this).addClass('selected');	
					/* Fire the onchange event */
					if ($jselect[0].selectedIndex != $j(this).attr('index') && $jselect[0].onchange) { $jselect[0].selectedIndex = $j(this).attr('index'); $jselect[0].onchange(); }
					$jselect[0].selectedIndex = $j(this).attr('index');
					$j('span:eq(0)', $jwrapper).html($j(this).html());
					$jul.hide();
					return false;
			});
			/* Set the default */
			$j('a:eq('+ this.selectedIndex +')', $jul).click();
			$j('span:first', $jwrapper).click(function(){$j("a.jqTransformSelectOpen",$jwrapper).trigger('click');});
			oLabel && oLabel.click(function(){$j("a.jqTransformSelectOpen",$jwrapper).trigger('click');});
			this.oLabel = oLabel;
			
			/* Apply the click handler to the Open */
			var oLinkOpen = $j('a.jqTransformSelectOpen', $jwrapper)
				.click(function(){
					//Check if box is already open to still allow toggle, but close all other selects
					if( $jul.css('display') == 'none' ) {jqTransformHideSelect();} 
					if($jselect.attr('disabled')){return false;}

					$jul.slideToggle('fast', function(){					
						var offSet = ($j('a.selected', $jul).offset().top - $jul.offset().top);
						$jul.animate({scrollTop: offSet});
					});
					return false;
				})
			;

			// Set the new width
			var iSelectWidth = $jselect.outerWidth();
			var oSpan = $j('span:first',$jwrapper);
			var newWidth = (iSelectWidth > oSpan.innerWidth())?iSelectWidth+oLinkOpen.outerWidth():$jwrapper.width();
			$jwrapper.css('width',newWidth);
			$jul.css('width',newWidth-2);
			oSpan.css({width:iSelectWidth});
		
			// Calculate the height if necessary, less elements that the default height
			//show the ul to calculate the block, if ul is not displayed li height value is 0
			$jul.css({display:'block',visibility:'hidden'});
			var iSelectHeight = ($j('li',$jul).length)*($j('li:first',$jul).height());//+1 else bug ff
			(iSelectHeight < $jul.height()) && $jul.css({});//hidden else bug with ff
			$jul.css({display:'none',visibility:'visible'});
			
		});
	};
	$j.fn.jqTransform = function(options){
		var opt = $j.extend({},defaultOptions,options);
		
		/* each form */
		 return this.each(function(){
			var selfForm = $j(this);
			if(selfForm.hasClass('jqtransformdone')) {return;}
			selfForm.addClass('jqtransformdone');
			
			$j('input:submit, input:reset, input[type="button"]', this).jqTransInputButton();			
			$j('input:text, input:password', this).jqTransInputText();			
			$j('input:checkbox', this).jqTransCheckBox();
			$j('input:radio', this).jqTransRadio();
			$j('textarea', this).jqTransTextarea();
			
			if( $j('select', this).jqTransSelect().length > 0 ){jqTransformAddDocumentListener();}
			selfForm.bind('reset',function(){var action = function(){jqTransformReset(this);}; window.setTimeout(action, 10);});
			
			//preloading dont needed anymore since normal, focus and hover image are the same one
			/*if(opt.preloadImg && !jqTransformImgPreloaded){
				jqTransformImgPreloaded = true;
				var oInputText = $j('input:text:first', selfForm);
				if(oInputText.length > 0){
					//pour ie on eleve les ""
					var strWrapperImgUrl = oInputText.get(0).wrapper.css('background-image');
					jqTransformPreloadHoverFocusImg(strWrapperImgUrl);					
					var strInnerImgUrl = $j('div.jqTransformInputInner',$j(oInputText.get(0).wrapper)).css('background-image');
					jqTransformPreloadHoverFocusImg(strInnerImgUrl);
				}
				
				var oTextarea = $j('textarea',selfForm);
				if(oTextarea.length > 0){
					var oTable = oTextarea.get(0).oTable;
					$j('td',oTable).each(function(){
						var strImgBack = $j(this).css('background-image');
						jqTransformPreloadHoverFocusImg(strImgBack);
					});
				}
			}*/
			
			
		}); /* End Form each */
				
	};/* End the Plugin */

})(jQuery);
				   