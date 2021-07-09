/*
 * Inline Form Validation Engine 1.7, $val plugin
 * 
 * Copyright(c) 2010, Cedric Dugas
 * http://www.position-relative.net
 *	
 * Form validation engine allowing custom regex rules to be added.
 * Thanks to Francois Duquette and Teddy Limousin 
 * and everyone helping me find bugs on the forum
 * Licenced under the MIT Licence
 */
 var $val = jQuery.noConflict();
(function($val) {
	
	$val.fn.validationEngine = function(settings) {
		
	if($val.validationEngineLanguage){				// IS THERE A LANGUAGE LOCALISATION ?
		allRules = $val.validationEngineLanguage.allRules;
	}else{
		$val.validationEngine.debug("Validation engine rules are not loaded check your external file");
	}
 	settings = $val.extend({
		allrules:allRules,
		validationEventTriggers:"focusout",					
		inlineValidation: true,	
		returnIsValid:false,
		liveEvent:true,
		unbindEngine:false,
		containerOverflow:false,
		containerOverflowDOM:"",
		ajaxSubmit: false,
		scroll:true,
		promptPosition: "topRight",	// OPENNING BOX POSITION, IMPLEMENTED: topLeft, topRight, bottomLeft, centerRight, bottomRight
		success : false,
		beforeSuccess :  function() {},
		failure : function() {}
	}, settings);	
	$val.validationEngine.settings = settings;
	$val.validationEngine.ajaxValidArray = new Array();	// ARRAY FOR AJAX: VALIDATION MEMORY 
	
	if(settings.inlineValidation == true){ 		// Validating Inline ?
		if(!settings.returnIsValid){					// NEEDED FOR THE SETTING returnIsValid
			allowReturnIsvalid = false;
			if(settings.liveEvent){						// LIVE event, vast performance improvement over BIND
				$val(this).find("[class*=validate][type!=checkbox]").live(settings.validationEventTriggers, function(caller){ _inlinEvent(this);})
				$val(this).find("[class*=validate][type=checkbox]").live("click", function(caller){ _inlinEvent(this); })
			}else{
				$val(this).find("[class*=validate]").not("[type=checkbox]").bind(settings.validationEventTriggers, function(caller){ _inlinEvent(this); })
				$val(this).find("[class*=validate][type=checkbox]").bind("click", function(caller){ _inlinEvent(this); })
			}
			firstvalid = false;
		}
			function _inlinEvent(caller){
				$val.validationEngine.settings = settings;
				if($val.validationEngine.intercept == false || !$val.validationEngine.intercept){		// STOP INLINE VALIDATION THIS TIME ONLY
					$val.validationEngine.onSubmitValid=false;
					$val.validationEngine.loadValidation(caller); 
				}else{
					$val.validationEngine.intercept = false;
				}
			}
	}
	if (settings.returnIsValid){		// Do validation and return true or false, it bypass everything;
		if ($val.validationEngine.submitValidation(this,settings)){
			return false;
		}else{
			return true;
		}
	}
	$val(this).bind("submit", function(caller){   // ON FORM SUBMIT, CONTROL AJAX FUNCTION IF SPECIFIED ON DOCUMENT READY
		$val.validationEngine.onSubmitValid = true;
		$val.validationEngine.settings = settings;
		if($val.validationEngine.submitValidation(this,settings) == false){
			if($val.validationEngine.submitForm(this,settings) == true) return false;
		}else{
			settings.failure && settings.failure(); 
			return false;
		}		
	})
	$val(".formError").live("click",function(){	 // REMOVE BOX ON CLICK
		$val(this).fadeOut(150,function(){		$val(this).remove()	}) 
	})
};	
$val.validationEngine = {
	defaultSetting : function(caller) {		// NOT GENERALLY USED, NEEDED FOR THE API, DO NOT TOUCH
		if($val.validationEngineLanguage){				
			allRules = $val.validationEngineLanguage.allRules;
		}else{
			$val.validationEngine.debug("Validation engine rules are not loaded check your external file");
		}	
		settings = {
			allrules:allRules,
			validationEventTriggers:"blur",					
			inlineValidation: true,	
			containerOverflow:false,
			containerOverflowDOM:"",
			returnIsValid:false,
			scroll:true,
			unbindEngine:true,
			ajaxSubmit: false,
			promptPosition: "topRight",	// OPENNING BOX POSITION, IMPLEMENTED: topLeft, topRight, bottomLeft, centerRight, bottomRight
			success : false,
			failure : function() {}
		}	
		$val.validationEngine.settings = settings;
	},
	loadValidation : function(caller) {		// GET VALIDATIONS TO BE EXECUTED
		if(!$val.validationEngine.settings) $val.validationEngine.defaultSetting()
		rulesParsing = $val(caller).attr('class');
		rulesRegExp = /\[(.*)\]/;
		getRules = rulesRegExp.exec(rulesParsing);
		if(getRules == null) return false;
		str = getRules[1];
		pattern = /\[|,|\]/;
		result= str.split(pattern);	
		var validateCalll = $val.validationEngine.validateCall(caller,result)
		return validateCalll;
	},
	validateCall : function(caller,rules) {	// EXECUTE VALIDATION REQUIRED BY THE USER FOR THIS FIELD
		var promptText =""	
		
		if(!$val(caller).attr("id")) $val.validationEngine.debug("This field have no ID attribut( name & class displayed): "+$val(caller).attr("name")+" "+$val(caller).attr("class"))

		caller = caller;
		ajaxValidate = false;
		var callerName = $val(caller).attr("name");
		$val.validationEngine.isError = false;
		$val.validationEngine.showTriangle = true;
		callerType = $val(caller).attr("type");

		for (i=0; i<rules.length;i++){
			switch (rules[i]){
			case "optional": 
				if(!$val(caller).val()){
					$val.validationEngine.closePrompt(caller);
					return $val.validationEngine.isError;
				}
			break;
			case "required": 
				_required(caller,rules);
			break;
			case "custom": 
				 _customRegex(caller,rules,i);
			break;
			case "exemptString": 
				 _exemptString(caller,rules,i);
			break;
			case "ajax": 
				if(!$val.validationEngine.onSubmitValid) _ajax(caller,rules,i);	
			break;
			case "length": 
				 _length(caller,rules,i);
			break;
			case "maxCheckbox": 
				_maxCheckbox(caller,rules,i);
			 	groupname = $val(caller).attr("name");
			 	caller = $val("input[name='"+groupname+"']");
			break;
			case "minCheckbox": 
				_minCheckbox(caller,rules,i);
				groupname = $val(caller).attr("name");
			 	caller = $val("input[name='"+groupname+"']");
			break;
			case "confirm": 
				 _confirm(caller,rules,i);
			break;
			case "funcCall": 
		     	_funcCall(caller,rules,i);
			break;
			default :;
			};
		};
		radioHack();
		if ($val.validationEngine.isError == true){
			var linkTofieldText = "." +$val.validationEngine.linkTofield(caller);
			if(linkTofieldText != "."){
				if(!$val(linkTofieldText)[0]){
					$val.validationEngine.buildPrompt(caller,promptText,"error")
				}else{	
					$val.validationEngine.updatePromptText(caller,promptText);
				}	
			}else{
				$val.validationEngine.updatePromptText(caller,promptText);
			}
		}else{
			$val.validationEngine.closePrompt(caller);
		}			
		/* UNFORTUNATE RADIO AND CHECKBOX GROUP HACKS */
		/* As my validation is looping input with id's we need a hack for my validation to understand to group these inputs */
		function radioHack(){
	      if($val("input[name='"+callerName+"']").size()> 1 && (callerType == "radio" || callerType == "checkbox")) {        // Hack for radio/checkbox group button, the validation go the first radio/checkbox of the group
	          caller = $val("input[name='"+callerName+"'][type!=hidden]:first");     
	          $val.validationEngine.showTriangle = false;
	      }      
	    }
		/* VALIDATION FUNCTIONS */
		function _required(caller,rules){   // VALIDATE BLANK FIELD
			callerType = $val(caller).attr("type");
			if (callerType == "text" || callerType == "password" || callerType == "textarea"){
								
				if(!$val(caller).val()){
					$val.validationEngine.isError = true;
					promptText += $val.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
				}	
			}	
			if (callerType == "radio" || callerType == "checkbox" ){
				callerName = $val(caller).attr("name");
		
				if($val("input[name='"+callerName+"']:checked").size() == 0) {
					$val.validationEngine.isError = true;
					if($val("input[name='"+callerName+"']").size() ==1) {
						promptText += $val.validationEngine.settings.allrules[rules[i]].alertTextCheckboxe+"<br />"; 
					}else{
						 promptText += $val.validationEngine.settings.allrules[rules[i]].alertTextCheckboxMultiple+"<br />";
					}	
				}
			}	
			if (callerType == "select-one") { // added by paul@kinetek.net for select boxes, Thank you		
				if(!$val(caller).val()) {
					$val.validationEngine.isError = true;
					promptText += $val.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
				}
			}
			if (callerType == "select-multiple") { // added by paul@kinetek.net for select boxes, Thank you	
				if(!$val(caller).find("option:selected").val()) {
					$val.validationEngine.isError = true;
					promptText += $val.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
				}
			}
		}
		function _customRegex(caller,rules,position){		 // VALIDATE REGEX RULES
			customRule = rules[position+1];
			pattern = eval($val.validationEngine.settings.allrules[customRule].regex);
			
			if(!pattern.test($val(caller).attr('value'))){
				$val.validationEngine.isError = true;
				promptText += $val.validationEngine.settings.allrules[customRule].alertText+"<br />";
			}
		}
		function _exemptString(caller,rules,position){		 // VALIDATE REGEX RULES
			customString = rules[position+1];
			if(customString == $val(caller).attr('value')){
				$val.validationEngine.isError = true;
				promptText += $val.validationEngine.settings.allrules['required'].alertText+"<br />";
			}
		}
		
		function _funcCall(caller,rules,position){  		// VALIDATE CUSTOM FUNCTIONS OUTSIDE OF THE ENGINE SCOPE
			customRule = rules[position+1];
			funce = $val.validationEngine.settings.allrules[customRule].nname;
			
			var fn = window[funce];
			if (typeof(fn) === 'function'){
				var fn_result = fn();
				if(!fn_result){
					$val.validationEngine.isError = true;
				}
				
				promptText += $val.validationEngine.settings.allrules[customRule].alertText+"<br />";
			}
		}
		function _ajax(caller,rules,position){				 // VALIDATE AJAX RULES
			
			customAjaxRule = rules[position+1];
			postfile = $val.validationEngine.settings.allrules[customAjaxRule].file;
			fieldValue = $val(caller).val();
			ajaxCaller = caller;
			fieldId = $val(caller).attr("id");
			ajaxValidate = true;
			ajaxisError = $val.validationEngine.isError;
			
			if($val.validationEngine.settings.allrules[customAjaxRule].extraData){
				extraData = $val.validationEngine.settings.allrules[customAjaxRule].extraData;
			}else{
				extraData = "";
			}
			/* AJAX VALIDATION HAS ITS OWN UPDATE AND BUILD UNLIKE OTHER RULES */	
			if(!ajaxisError){
				$val.ajax({
				   	type: "POST",
				   	url: postfile,
				   	async: true,
				   	data: "validateValue="+fieldValue+"&validateId="+fieldId+"&validateError="+customAjaxRule+"&extraData="+extraData,
				   	beforeSend: function(){		// BUILD A LOADING PROMPT IF LOAD TEXT EXIST		   			
				   		if($val.validationEngine.settings.allrules[customAjaxRule].alertTextLoad){
				   		
				   			if(!$val("div."+fieldId+"formError")[0]){				   				
	 			 				return $val.validationEngine.buildPrompt(ajaxCaller,$val.validationEngine.settings.allrules[customAjaxRule].alertTextLoad,"load");
	 			 			}else{
	 			 				$val.validationEngine.updatePromptText(ajaxCaller,$val.validationEngine.settings.allrules[customAjaxRule].alertTextLoad,"load");
	 			 			}
			   			}
			  	 	},
			  	 	error: function(data,transport){ $val.validationEngine.debug("error in the ajax: "+data.status+" "+transport) },
					success: function(data){					// GET SUCCESS DATA RETURN JSON
						data = eval( "("+data+")");				// GET JSON DATA FROM PHP AND PARSE IT
						ajaxisError = data.jsonValidateReturn[2];
						customAjaxRule = data.jsonValidateReturn[1];
						ajaxCaller = $val("#"+data.jsonValidateReturn[0])[0];
						fieldId = ajaxCaller;
						ajaxErrorLength = $val.validationEngine.ajaxValidArray.length;
						existInarray = false;
						
			 			 if(ajaxisError == "false"){			// DATA FALSE UPDATE PROMPT WITH ERROR;
			 			 	
			 			 	_checkInArray(false)				// Check if ajax validation alreay used on this field
			 			 	
			 			 	if(!existInarray){		 			// Add ajax error to stop submit		 		
				 			 	$val.validationEngine.ajaxValidArray[ajaxErrorLength] =  new Array(2);
				 			 	$val.validationEngine.ajaxValidArray[ajaxErrorLength][0] = fieldId;
				 			 	$val.validationEngine.ajaxValidArray[ajaxErrorLength][1] = false;
				 			 	existInarray = false;
			 			 	}
				
			 			 	$val.validationEngine.ajaxValid = false;
							promptText += $val.validationEngine.settings.allrules[customAjaxRule].alertText+"<br />";
							$val.validationEngine.updatePromptText(ajaxCaller,promptText,"",true);				
						 }else{	 
						 	_checkInArray(true);
						 	$val.validationEngine.ajaxValid = true; 			
						 	if(!customAjaxRule)	{$val.validationEngine.debug("wrong ajax response, are you on a server or in xampp? if not delete de ajax[ajaxUser] validating rule from your form ")}		   
						 	if($val.validationEngine.settings.allrules[customAjaxRule].alertTextOk){	// NO OK TEXT MEAN CLOSE PROMPT	 			
	 			 				 				$val.validationEngine.updatePromptText(ajaxCaller,$val.validationEngine.settings.allrules[customAjaxRule].alertTextOk,"pass",true);
 			 				}else{
				 			 	ajaxValidate = false;		 	
				 			 	$val.validationEngine.closePrompt(ajaxCaller);
 			 				}		
			 			 }
			 			function  _checkInArray(validate){
			 				for(x=0;x<ajaxErrorLength;x++){
			 			 		if($val.validationEngine.ajaxValidArray[x][0] == fieldId){
			 			 			$val.validationEngine.ajaxValidArray[x][1] = validate;
			 			 			existInarray = true;
			 			 		
			 			 		}
			 			 	}
			 			}
			 		}				
				});
			}
		}
		function _confirm(caller,rules,position){		 // VALIDATE FIELD MATCH
			confirmField = rules[position+1];
			
			if($val(caller).attr('value') != $val("#"+confirmField).attr('value')){
				$val.validationEngine.isError = true;
				promptText += $val.validationEngine.settings.allrules["confirm"].alertText+"<br />";
			}
		}
		function _length(caller,rules,position){    	  // VALIDATE LENGTH
		
			startLength = eval(rules[position+1]);
			endLength = eval(rules[position+2]);
			feildLength = $val(caller).attr('value').length;

			if(feildLength<startLength || feildLength>endLength){
				$val.validationEngine.isError = true;
				promptText += $val.validationEngine.settings.allrules["length"].alertText+startLength+$val.validationEngine.settings.allrules["length"].alertText2+endLength+$val.validationEngine.settings.allrules["length"].alertText3+"<br />"
			}
		}
		function _maxCheckbox(caller,rules,position){  	  // VALIDATE CHECKBOX NUMBER
		
			nbCheck = eval(rules[position+1]);
			groupname = $val(caller).attr("name");
			groupSize = $val("input[name='"+groupname+"']:checked").size();
			if(groupSize > nbCheck){	
				$val.validationEngine.showTriangle = false;
				$val.validationEngine.isError = true;
				promptText += $val.validationEngine.settings.allrules["maxCheckbox"].alertText+"<br />";
			}
		}
		function _minCheckbox(caller,rules,position){  	  // VALIDATE CHECKBOX NUMBER
		
			nbCheck = eval(rules[position+1]);
			groupname = $val(caller).attr("name");
			groupSize = $val("input[name='"+groupname+"']:checked").size();
			if(groupSize < nbCheck){	
			
				$val.validationEngine.isError = true;
				$val.validationEngine.showTriangle = false;
				promptText += $val.validationEngine.settings.allrules["minCheckbox"].alertText+" "+nbCheck+" "+$val.validationEngine.settings.allrules["minCheckbox"].alertText2+"<br />";
			}
		}
		return ($val.validationEngine.isError) ? $val.validationEngine.isError : false;
	},
	submitForm : function(caller){
		if($val.validationEngine.settings.ajaxSubmit){		
			if($val.validationEngine.settings.ajaxSubmitExtraData){
				extraData = $val.validationEngine.settings.ajaxSubmitExtraData;
			}else{
				extraData = "";
			}
			$val.ajax({
			   	type: "POST",
			   	url: $val.validationEngine.settings.ajaxSubmitFile,
			   	async: true,
			   	data: $val(caller).serialize()+"&"+extraData,
			   	error: function(data,transport){ $val.validationEngine.debug("error in the ajax: "+data.status+" "+transport) },
			   	success: function(data){
			   		if(data == "true"){			// EVERYTING IS FINE, SHOW SUCCESS MESSAGE
			   			$val(caller).css("opacity",1)
			   			$val(caller).animate({opacity: 0, height: 0}, function(){
			   				$val(caller).css("display","none");
			   				$val(caller).before("<div class='ajaxSubmit'>"+$val.validationEngine.settings.ajaxSubmitMessage+"</div>");
			   				$val.validationEngine.closePrompt(".formError",true); 	
			   				$val(".ajaxSubmit").show("slow");
			   				if ($val.validationEngine.settings.success){	// AJAX SUCCESS, STOP THE LOCATION UPDATE
								$val.validationEngine.settings.success && $val.validationEngine.settings.success(); 
								return false;
							}
			   			})
		   			}else{						// HOUSTON WE GOT A PROBLEM (SOMETING IS NOT VALIDATING)
			   			data = eval( "("+data+")");	
			   			if(!data.jsonValidateReturn){
			   				 $val.validationEngine.debug("you are not going into the success fonction and jsonValidateReturn return nothing");
			   			}
			   			errorNumber = data.jsonValidateReturn.length	
			   			for(index=0; index<errorNumber; index++){	
			   				fieldId = data.jsonValidateReturn[index][0];
			   				promptError = data.jsonValidateReturn[index][1];
			   				type = data.jsonValidateReturn[index][2];
			   				$val.validationEngine.buildPrompt(fieldId,promptError,type);
		   				}
	   				}
   				}
			})	
			return true;
		}
		// LOOK FOR BEFORE SUCCESS METHOD		
			if(!$val.validationEngine.settings.beforeSuccess()){
				if ($val.validationEngine.settings.success){	// AJAX SUCCESS, STOP THE LOCATION UPDATE
					if($val.validationEngine.settings.unbindEngine){ $val(caller).unbind("submit") }
					$val.validationEngine.settings.success && $val.validationEngine.settings.success(); 
					return true;
				}
			}else{
				return true;
			} 
		return false;
	},
	buildPrompt : function(caller,promptText,type,ajaxed) {			// ERROR PROMPT CREATION AND DISPLAY WHEN AN ERROR OCCUR
		if(!$val.validationEngine.settings){
			$val.validationEngine.defaultSetting()
		}
		deleteItself = "." + $val(caller).attr("id") + "formError"
	
		if($val(deleteItself)[0]){
			$val(deleteItself).stop();
			$val(deleteItself).remove();
		}
		var divFormError = document.createElement('div');
		var formErrorContent = document.createElement('div');
		linkTofield = $val.validationEngine.linkTofield(caller)
		$val(divFormError).addClass("formError")
		
		if(type == "pass") $val(divFormError).addClass("greenPopup")
		if(type == "load") $val(divFormError).addClass("blackPopup")
		if(ajaxed) $val(divFormError).addClass("ajaxed")
		
		$val(divFormError).addClass(linkTofield);
		$val(formErrorContent).addClass("formErrorContent");
		
		if($val.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
			$val(caller).before(divFormError);
		}else{
			$val("body").append(divFormError);
		}
		
		$val(divFormError).append(formErrorContent);
			
		if($val.validationEngine.showTriangle != false){		// NO TRIANGLE ON MAX CHECKBOX AND RADIO
			var arrow = document.createElement('div');
			$val(arrow).addClass("formErrorArrow");
			$val(divFormError).append(arrow);
			if($val.validationEngine.settings.promptPosition == "bottomLeft" || $val.validationEngine.settings.promptPosition == "bottomRight"){
			$val(arrow).addClass("formErrorArrowBottom")
			$val(arrow).html('<div class="line1"><!-- --></div><div class="line2"><!-- --></div><div class="line3"><!-- --></div><div class="line4"><!-- --></div><div class="line5"><!-- --></div><div class="line6"><!-- --></div><div class="line7"><!-- --></div><div class="line8"><!-- --></div><div class="line9"><!-- --></div><div class="line10"><!-- --></div>');
		}
			if($val.validationEngine.settings.promptPosition == "topLeft" || $val.validationEngine.settings.promptPosition == "topRight"){
				$val(divFormError).append(arrow);
				$val(arrow).html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');
			}
		}
		$val(formErrorContent).html(promptText)
		
		var calculatedPosition = $val.validationEngine.calculatePosition(caller,promptText,type,ajaxed,divFormError)
		
		calculatedPosition.callerTopPosition +="px";
		calculatedPosition.callerleftPosition +="px";
		calculatedPosition.marginTopSize +="px"
		$val(divFormError).css({
			"top":calculatedPosition.callerTopPosition,
			"left":calculatedPosition.callerleftPosition,
			"marginTop":calculatedPosition.marginTopSize,
			"opacity":0
		})
		return $val(divFormError).animate({"opacity":0.87},function(){return true;});	
	},
	updatePromptText : function(caller,promptText,type,ajaxed) {	// UPDATE TEXT ERROR IF AN ERROR IS ALREADY DISPLAYED
		
		linkTofield = $val.validationEngine.linkTofield(caller);
		var updateThisPrompt =  "."+linkTofield;
		
		if(type == "pass") { $val(updateThisPrompt).addClass("greenPopup") }else{ $val(updateThisPrompt).removeClass("greenPopup")};
		if(type == "load") { $val(updateThisPrompt).addClass("blackPopup") }else{ $val(updateThisPrompt).removeClass("blackPopup")};
		if(ajaxed) { $val(updateThisPrompt).addClass("ajaxed") }else{ $val(updateThisPrompt).removeClass("ajaxed")};
	
		$val(updateThisPrompt).find(".formErrorContent").html(promptText);
		
		var calculatedPosition = $val.validationEngine.calculatePosition(caller,promptText,type,ajaxed,updateThisPrompt)
		
		calculatedPosition.callerTopPosition +="px";
		calculatedPosition.callerleftPosition +="px";
		calculatedPosition.marginTopSize +="px"
		$val(updateThisPrompt).animate({ "top":calculatedPosition.callerTopPosition,"marginTop":calculatedPosition.marginTopSize });
	},
	calculatePosition : function(caller,promptText,type,ajaxed,divFormError){
		
		if($val.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
			callerTopPosition = 0;
			callerleftPosition = 0;
			callerWidth =  $val(caller).width();
			inputHeight = $val(divFormError).height();					// compasation for the triangle
			var marginTopSize = "-"+inputHeight;
		}else{
			callerTopPosition = $val(caller).offset().top;
			callerleftPosition = $val(caller).offset().left;
			callerWidth =  $val(caller).width();
			inputHeight = $val(divFormError).height();
			var marginTopSize = 0;
		}
		
		/* POSITIONNING */
		if($val.validationEngine.settings.promptPosition == "topRight"){ 
			if($val.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
				callerleftPosition += callerWidth -30;
			}else{
				callerleftPosition +=  callerWidth -30; 
				callerTopPosition += -inputHeight; 
			}
		}
		if($val.validationEngine.settings.promptPosition == "topLeft"){ callerTopPosition += -inputHeight -10; }
		
		if($val.validationEngine.settings.promptPosition == "centerRight"){ callerleftPosition +=  callerWidth +13; }
		
		if($val.validationEngine.settings.promptPosition == "bottomLeft"){
			callerHeight =  $val(caller).height();
			callerTopPosition = callerTopPosition + callerHeight + 15;
		}
		if($val.validationEngine.settings.promptPosition == "bottomRight"){
			callerHeight =  $val(caller).height();
			callerleftPosition +=  callerWidth -30;
			callerTopPosition +=  callerHeight +5;
		}
		return {
			"callerTopPosition":callerTopPosition,
			"callerleftPosition":callerleftPosition,
			"marginTopSize":marginTopSize
		}
	},
	linkTofield : function(caller){
		var linkTofield = $val(caller).attr("id") + "formError";
		linkTofield = linkTofield.replace(/\[/g,""); 
		linkTofield = linkTofield.replace(/\]/g,"");
		return linkTofield;
	},
	closePrompt : function(caller,outside) {						// CLOSE PROMPT WHEN ERROR CORRECTED
		if(!$val.validationEngine.settings){
			$val.validationEngine.defaultSetting()
		}
		if(outside){
			$val(caller).fadeTo("fast",0,function(){
				$val(caller).remove();
			});
			return false;
		}
		if(typeof(ajaxValidate)=='undefined'){ajaxValidate = false}
		if(!ajaxValidate){
			linkTofield = $val.validationEngine.linkTofield(caller);
			closingPrompt = "."+linkTofield;
			$val(closingPrompt).fadeTo("fast",0,function(){
				$val(closingPrompt).remove();
			});
		}
	},
	debug : function(error) {
		if(!$val("#debugMode")[0]){
			$val("body").append("<div id='debugMode'><div class='debugError'><strong>This is a debug mode, you got a problem with your form, it will try to help you, refresh when you think you nailed down the problem</strong></div></div>");
		}
		$val(".debugError").append("<div class='debugerror'>"+error+"</div>");
	},			
	submitValidation : function(caller) {					// FORM SUBMIT VALIDATION LOOPING INLINE VALIDATION
		var stopForm = false;
		$val.validationEngine.ajaxValid = true;
		var toValidateSize = $val(caller).find("[class*=validate]").size();
		
		$val(caller).find("[class*=validate]").each(function(){
			linkTofield = $val.validationEngine.linkTofield(this);
			
			if(!$val("."+linkTofield).hasClass("ajaxed")){	// DO NOT UPDATE ALREADY AJAXED FIELDS (only happen if no normal errors, don't worry)
				var validationPass = $val.validationEngine.loadValidation(this);
				return(validationPass) ? stopForm = true : "";					
			};
		});
		ajaxErrorLength = $val.validationEngine.ajaxValidArray.length;		// LOOK IF SOME AJAX IS NOT VALIDATE
		for(x=0;x<ajaxErrorLength;x++){
	 		if($val.validationEngine.ajaxValidArray[x][1] == false) $val.validationEngine.ajaxValid = false;
 		}
		if(stopForm || !$val.validationEngine.ajaxValid){		// GET IF THERE IS AN ERROR OR NOT FROM THIS VALIDATION FUNCTIONS
			if($val.validationEngine.settings.scroll){
				if(!$val.validationEngine.settings.containerOverflow){
					var destination = $val(".formError:not('.greenPopup'):first").offset().top;
					$val(".formError:not('.greenPopup')").each(function(){
						testDestination = $val(this).offset().top;
						if(destination>testDestination) destination = $val(this).offset().top;
					})
					$val("html:not(:animated),body:not(:animated)").animate({ scrollTop: destination}, 1100);
				}else{
					var destination = $val(".formError:not('.greenPopup'):first").offset().top;
					var scrollContainerScroll = $val($val.validationEngine.settings.containerOverflowDOM).scrollTop();
					var scrollContainerPos = - parseInt($val($val.validationEngine.settings.containerOverflowDOM).offset().top);
					var destination = scrollContainerScroll + destination + scrollContainerPos -5
					var scrollContainer = $val.validationEngine.settings.containerOverflowDOM+":not(:animated)"
					
					$val(scrollContainer).animate({ scrollTop: destination}, 1100);
				}
			}
			return true;
		}else{
			return false;
		}
	}
}
})(jQuery);