var chars = [1,2,3,4,5,6,7,8,9,0,'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
var matchLength = 0;
var version = 3;
var is_prerelease = true;
var tos_version = 1;
var notice = {
	"show": false,
	"id": 4,
	"message": {
		"title": "Sorry about that...",
		"text": "I screwed up the cookies and had to reset them.\n\nUse the export button if you're worried about cookies resetting in the future.",
		"type": "info"
	}
};
var jobject = [];
var selectedHover;
var selectedClick;
var selectedHover_edit;
var selectedClick_edit;
var downButton;
var upButton;
var extraTextFormat = 'raw';
var lang = {"status":"init"};
var translationStrings;
var currentEdit;
var hasAlertedTranslationObjects = false;
var webLangRelations;
var editing = false;
var issueLog = [];
var bookPage = 1;
var topPage = 1;
var embed = false;
var quill = undefined;

function getSpecialTagItem(tagid) {
	if (localStorage.getItem('special_tag_' + tagid)) {
		return JSON.parse(localStorage.getItem('special_tag_' + tagid));
	} else {
		alert('An error occured fetching tagid ' + tagid);
		return false;
	}
}
function storeSpecialTagItem(item) {
	var tagid = makeSpecialTagID();
	if (localStorage.getItem('special_tag_' + tagid)) {
		return false;
	} else {
		localStorage.setItem('special_tag_' + tagid, JSON.stringify(item));
		return tagid;
	}
}
function makeSpecialTagID() {
	var tagid = "" + Math.random();
	return tagid.replace('.','')
}
function deleteOrphanSpecialTags() {
	for (var x = 0; x < Object.keys(localStorage).length; x++) {
		for (var i = 0; i < Object.keys(localStorage).length; i++) {
			var key = Object.keys(localStorage)[i];
			if (key.indexOf('special_tag_') != -1) {
				var tagid = key.replace('special_tag_','');
				if ($('[value=' + tagid +']').length == 0) {
					localStorage.removeItem(key);
				}
			}
		}
	}
}
function reportAnIssue(ptitle) {
	if (is_prerelease) {
		return true;
	}
	var title = "";
	var body = "";
	if (ptitle != undefined) {
		title = "Issue Report - " + ptitle;
		body = 'Please enter steps to reproduce the issue below, as well as any other information you want to include%0A%0A%0A%0A%0A%0A Provided Data - Do not modify below this line%0A%0A```%0A' + JSON.stringify(jobject) + '%0A```';
	}
	var win = window.open('http://github.com/ezfe/tellraw/issues/new?body=' + body + '&title=' + title, '_blank');
	win.focus();
}
function getLanguageName(langCode) {
	var name = lang[langCode].language.name;
	if (name == "English" && langCode != "en_US") {
		return langCode
	} else {
		return name
	}
}
function showIssue() {
	swal(issueLog[issueLog.length - 1].name,issueLog[issueLog.length - 1].data,'error');
}
function logIssue(name,data,critical) {
	issueLog.push({"name":name,"data":data});
	if (critical) {
		swal(name,data,'error');
	}
}
function showView(viewname,suppressAnimation,hideOthers,hideMenubar) {
	var hideMenubarOriginal = hideMenubar;
	if (embed) {
		hideMenubar = true;
	}
	var toHide = $('.view-container').not('.view-container[view="' + viewname + '"]');
	if (!hideMenubar) {
		toHide = toHide.not('.view-container[view="pageheader"]');
	}
	var toShow = $('.view-container[view="' + viewname + '"]');
	if (!hideMenubar) {
		$($('.view-container[view="pageheader"]')).show();
	}
	if (hideOthers === false) {
		toHide = $('');
	}
	if (suppressAnimation) {
		toHide.hide();
		toShow.show();
	} else {
		toHide.slideUp();
		toShow.slideDown();
	}
	if (viewname != "loading" && viewname != "pageheader" && viewname != "issue") {
		localStorage.setItem('jview',JSON.stringify({"viewname":viewname,"suppressAnimation":suppressAnimation,"hideOthers":hideOthers,"hideMenubar":hideMenubar}));
	}
	if (toShow.length == 0) {
		logIssue('Missing View',viewname,true);
		showView('tellraw');
	}
}
function getURL(url){
	return $.ajax({
		type: "GET",
		url: url,
		cache: false,
		async: false
	}).responseText;
}
function verify_jobject_format(jdata) {
	var resetError = JSON.stringify({"title": "Object Verification Failed", "text": "An error occured and the page has been reset", "type": "error"});

	if (get_type(jdata) == "[object Object]") {
		if (get_type(jdata.extra) == "[object Array]") {
			jdata = jdata.extra;
		} else {
			sessionStorage.setItem('nextTimeAlert',resetError);
			localStorage.clear();
			location.reload();
			return;
		}
	}

	if (get_type(jdata) != "[object Array]") {
		sessionStorage.setItem('nextTimeAlert',resetError);
		localStorage.clear();
		location.reload();
		return;
	}

	if (jdata.text != '' && get_type(jdata) != "[object Array]") {
		jdata.unshift(new Object());
		jdata[0].text = jdata.text;
		jdata[0].color = jdata.color;
		delete(jdata.color);
		jdata[0].bold = jdata.bold;
		delete(jdata.bold);
		jdata[0].italic = jdata.italic;
		delete(jdata.italic);
		jdata[0].underlined = jdata.underlined;
		delete(jdata.underline);
		jdata[0].strikethrough = jdata.strikethrough;
		delete(jdata.strikethrough);
		jdata[0].obfuscated = jdata.obfuscated;
		delete(jdata.obfuscated);
		jdata.text = '';
	}

	for (var i = 0; i < jdata.length; i++) {
		if (jdata[i].hoverEvent != undefined) {
			if (jdata[i].hoverEvent.action == "show_text") {
				if (typeof jdata[i].hoverEvent.value == "object") {
					if (jdata[i].hoverEvent.value.text != "") {
						jdata[i].hoverEvent.value = {"text":"", "extra":[jdata[i].hoverEvent.value]};
					}
				} else if (typeof jdata[i].hoverEvent.value == "string") {
					jdata[i].hoverEvent.value = {"text":"", "extra":[{"text":jdata[i].hoverEvent.value}]};
				}
			}
		}
	}

	return jdata;
}

function formatJObjectList(data) {
	if (data.length == 0) {
		return [];
	}
	var ret_val = [];
	var currentDataToPlug = [""];
	for (var i = 0; i < data.length; i++) {
		if (data[i].NEW_ITERATE_FLAG) {
			ret_val.push(JSON.stringify(currentDataToPlug));
			currentDataToPlug = [""];
		} else {
			currentDataToPlug.push(data[i]);
		}
	}
	if (!data[data.length - 1].NEW_ITERATE_FLAG) {
		ret_val.push(JSON.stringify(currentDataToPlug));
	}
	return ret_val;
}

function closeExport() {
	$('#exporter').remove();
}
function isScrolledIntoView(elem) {
	elem = '#' + elem;
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(window).height();

	var elemTop = $(elem).offset().top;
	var elemBottom = elemTop + $(elem).height();

	return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function goToByScroll(id){
	if (!isScrolledIntoView(id)) {
		$('html,body').animate({scrollTop: $("#"+id).offset().top},'slow');
	}
}

var templates =
{
	"tellraw": {
		"command": "/tellraw @p %s",
		"version": "1.7",
		"formatType": "standardjson",
		"mouseActionOptions": true
	},
	"execute_tellraw": {
		"command": "/execute @a ~ ~ ~ tellraw @p %s",
		"version": "1.8",
		"formatType": "standardjson",
		"mouseActionOptions": true
	},
	"title": {
		"command": "/title @a title %s",
		"version": "1.8",
		"formatType": "standardjson",
		"mouseActionOptions": false
	},
	"subtitle": {
		"command": "/title @a subtitle %s",
		"version": "1.8",
		"formatType": "standardjson",
		"mouseActionOptions": false
	},
	"sign_item": {
		"command": "/give @p sign 1 0 {BlockEntityTag:{%s,id:\"Sign\"}}",
		"version": "1.8",
		"formatType": "signset",
		"mouseActionOptions": false
	},
	"sign_block": {
		"command": "/blockdata [x] [y] [z] {%s}",
		"version": "1.8",
		"formatType": "signset",
		"mouseActionOptions": false
	},
	"book": {
		"command": "/give @p written_book 1 0 {pages:%s,title:Book,author:TellrawGenerator}",
		"version": "1.8",
		"formatType": "bookarray",
		"mouseActionOptions": true
	}
}
/*
(c) 2012 Steven Levithan <http://slevithan.com/>
MIT license
*/
if (!String.prototype.codePointAt) {
	String.prototype.codePointAt = function (pos) {
		pos = isNaN(pos) ? 0 : pos;
		var str = String(this),
		code = str.charCodeAt(pos),
		next = str.charCodeAt(pos + 1);
        // If a surrogate pair
        if (0xD800 <= code && code <= 0xDBFF && 0xDC00 <= next && next <= 0xDFFF) {
        	return ((code - 0xD800) * 0x400) + (next - 0xDC00) + 0x10000;
        }
        return code;
    };
}
function saveJObject() {
	swal({
		title: "Please enter a save name.",
		text: "If you enter an existing one, it will overwrite it.",
		type: "input",
		showCancelButton: true,
	}, function(inputValue) {
		if (inputValue == '' || inputValue == undefined || new RegExp('[^a-zA-Z0-9]').test(inputValue)) {
			swal('You didn\'t enter a valid save name! Please omit special characters','error')
		} else {
			var saveTo = inputValue
			var saveSlot = 'saveSlot_' + saveTo;
			var overwrite = false;
			if (localStorage.getItem(saveSlot) != undefined) {
				overwrite = true;
			}
			localStorage.setItem('currentSaveSlot',saveTo);
			localStorage.setItem(saveSlot, JSON.stringify({"command": $('#command').val(), "jobject": jobject}));
			if (overwrite) {
				swal('Saved your current revision to `' + saveTo + '`, overwriting your previous save to that slot');
			} else {
				swal('Saved your current revision to `' + saveTo + '`, which created a new saveSlot');
			}
			refreshSavesList();
			refreshOutput();
		}
	});
}
function loadJObject(saveName) {
	var saveItem = getJObject(saveName);
	jobject = saveItem.jobject;
	$('#command').val(saveItem.command);
	swal('Loaded save `' + saveName + '`','','success');
	refreshSavesList();
	refreshOutput();
}
function doesJObjectExist(saveName) {
	var saveSlot = 'saveSlot_' + saveName;
	return localStorage.getItem(saveSlot) != undefined;

}
function getJObject(saveName) {
	var saveSlot = 'saveSlot_' + saveName;
	return JSON.parse(localStorage.getItem(saveSlot));
}
function deleteAll() {
	swal({
		"title": getLanguageString('settings.deleteall.heading',localStorage.getItem('langCode')),
		"text": getLanguageString('settings.deleteall.body',localStorage.getItem('langCode')),
		"cancelButtonText": getLanguageString('settings.deleteall.no',localStorage.getItem('langCode')),
		"confirmButtonText": getLanguageString('settings.deleteall.yes',localStorage.getItem('langCode')),
		"showCancelButton": true,
		"closeOnConfirm": false,
		"type": "warning"
	},function(isConfirm){
		if (isConfirm) {
			jobject = [];
			$('.templateButton[template=tellraw]').click();
			refreshOutput();
			swal('Deleted!','Your current thing was deleted', 'success');
		}
	});
}
function clearJObjectSaves() {
	swal({
		"title": getLanguageString('saves.deleteall.heading',localStorage.getItem('langCode')),
		"text": getLanguageString('saves.deleteall.body',localStorage.getItem('langCode')),
		"cancelButtonText": getLanguageString('saves.deleteall.no',localStorage.getItem('langCode')),
		"confirmButtonText": getLanguageString('saves.deleteall.yes',localStorage.getItem('langCode')),
		"showCancelButton": true,
		"closeOnConfirm": false,
		"type": "warning"
	},function(isConfirm){
		if (isConfirm) {
			for (var x = 0; x < Object.keys(localStorage).length; x++) {
				for (var i = 0; i < Object.keys(localStorage).length; i++) {
					var key = Object.keys(localStorage)[i];
					if (key.indexOf('saveSlot_') != -1) {
						localStorage.removeItem(key);
					}
				}
			}
			refreshSavesList();
			swal('Deleted!','Your saves were deleted', 'success');
		}
	});
}
function getCSSHEXFromWord(w) {
	if (w == "black") return("#000000");
	if (w == "dark_blue") return("#0000B2");
	if (w == "dark_green") return("#14AB00");
	if (w == "dark_aqua") return("#13AAAB");
	if (w == "dark_red") return("#A90400");
	if (w == "dark_purple") return("#A900B2");
	if (w == "gold") return("#FEAC00");
	if (w == "gray") return("#AAAAAA");
	if (w == "dark_gray") return("#555555");
	if (w == "blue") return("#544CFF");
	if (w == "green") return("#5CFF00");
	if (w == "aqua") return("#5BFFFF");
	if (w == "red") return("#FD5650");
	if (w == "light_purple") return("#FD4DFF");
	if (w == "yellow") return("#FFFF00");
	if (w == "white") return("#FFFFFF");
	if (w == "none") return("#FFFFFF");
	return templates[localStorage.getItem('jtemplate')].formatType == 'bookarray' ? ('#000000') : ("#FFFFFF");
}
function removeWhiteSpace(s) {
	return s;
	//BROKEN return s.replace(/ /g, '');
}
function moveUp(index) {
	jobject.splice(index+1, 0, jobject.splice(index, 1)[0]);
	refreshOutput();
}
function getSelected(object) {
	if ($('#'+object).length != 0) {
		var e = document.getElementById(object);
		return e.options[e.selectedIndex].value;
	} else {
		return false;
	}
}
function getSelectedIndex(object) {
	var e = document.getElementById(object);
	return e.selectedIndex;
}
function getChecked(id) {
	return document.getElementById(id).checked;
}
function clearExtraText() {
	delete jobject;
	refreshOutput();
}
function get_type(thing){
	if (thing===null) {
		return "[object Null]";
	}
	return Object.prototype.toString.call(thing);
}
function modifyExtraText(index,text) {
	if (text != "" && text != null) {
		jobject[index].text = text;
	}
	refreshOutput();
}
function refreshSavesList() {
	$('.savesContainer').html('');
	for (var i = 0; i < Object.keys(localStorage).length; i++) {
		var key = Object.keys(localStorage)[i];
		if (key.indexOf('saveSlot_') != -1) {
			$('.savesContainer').append('<div class="row" saveKey="' + key.substring('9') + '"><div class="col-xs-3"><a href="#" onclick="loadJObject(\'' + key.substring('9') + '\')">Load ' + key.substring('9') + '</a></div><div class="col-xs-6">' + localStorage.getItem(key).substring(0,90) + ' ...</div><div class="div class="col-xs-3"><a href="#" onclick="deleteJObjectSave(\'' + key.substring('9') + '\')">Delete ' + key.substring('9') + '</a></div></div>')
		}
	};
	if ($('.savesContainer').html() == '') {
		$('.savesContainer').html('<div class="row"><div class="col-xs-12"><h4 lang="saves.nosaves"></h4></div></div>');
	}
	refreshLanguage();
}
function deleteJObjectSave(saveName) {
	var saveSlot = 'saveSlot_' + saveName;
	swal({
		title: "Are you sure?",
		text: "Are you sure you want to delete " + saveName + "?",
		type: "warning",
		showCancelButton: true,
		confirmButtonText: "Yes, delete it!",
		closeOnConfirm: false
	}, function(){
		localStorage.removeItem(saveSlot);
		refreshSavesList();
		swal("Deleted!", saveName + ' was deleted.', "success");
	});
	refreshSavesList();
}
function showFixerView() {
	showView('escaping-issue',true,false,true);
}
function build_quill_delta() {
	var delta = {"ops":[]};
	if (quill !== undefined) {
		for (var i = 0; i < jobject.length; i++) {
			var dops = {};
			dops.insert = jobject[i].text;
			if (jobject[i].bold) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.bold = jobject[i].bold
			}
			if (jobject[i].italic) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.italic = jobject[i].italic
			}
			if (jobject[i].obfuscated) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.obfuscated = jobject[i].obfuscated
			}
			if (jobject[i].strikethrough) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.strike = jobject[i].strikethrough
			}
			if (jobject[i].clickEvent) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.clickEvent = storeSpecialTagItem({"value": jobject[i].clickEvent.value, "action": jobject[i].clickEvent.action});
			}
			if (jobject[i].hoverEvent) {
				if (!dops.attributes) {
					dops.attributes = {};
				}
				dops.attributes.hoverEvent = storeSpecialTagItem({"value": jobject[i].hoverEvent.value, "action": jobject[i].hoverEvent.action});
			}
			delta.ops.push(dops);
		}
		return delta;
	} else {
		return delta;
	}
}
function build_jobject() {
	jobject = [];
	if (quill !== undefined) {
		var qc = quill.getContents();
		for (var i = 0; i < qc.ops.length; i++) {
			var cc = qc.ops[i];
			var newObj = {"text": cc.insert};

			if (cc && cc.attributes) {
				var atr = cc.attributes;
				if (atr.bold) {
					newObj.bold = true;
				}
				if (atr.italic) {
					newObj.italic = true;
				}
				if (atr.strike) {
					newObj.strikethrough = true;
				}
				if (atr.obfuscated) {
					newObj.obfuscated = true;
				}
				if (atr.clickEvent) {
					var tagcontents = getSpecialTagItem(atr.clickEvent);
					newObj.clickEvent = {"action": tagcontents.action, "value": tagcontents.value}
				}
				if (atr.hoverEvent) {
					var tagcontents = getSpecialTagItem(atr.hoverEvent);
					newObj.clickEvent = {"action": tagcontents.action, "value": tagcontents.value}
				}
			}

			jobject.push(newObj);
		};

		jobject[jobject.length - 1].text = jobject[jobject.length - 1].text.replace(/\n$/g, "");
		if (jobject[jobject.length - 1].text == "") {
			jobject.splice(jobject.length - 1, 1);
		}

		return jobject;
	} else {
		return [];
	}
}
function refreshOutput(input) {
	/*BUILD JOBJECT*/
	jobject = build_jobject();

	/*VERIFY CONTENTS*/
	jobject = verify_jobject_format(jobject);

	deleteOrphanSpecialTags();

	if ($('#command').val().indexOf('%s') == -1) {
		$('#command').val('/tellraw @p %s');
		localStorage.setItem('jtemplate','tellraw');
	}

	if ($('#command').val().indexOf('/tellraw') != -1 && templates[localStorage.getItem('jtemplate')].formatType != 'standardjson' && localStorage.getItem('dontShowQuoteFixer') != "true" && jobject.length > 0) {
		setTimeout(showFixerView,4000);
	}

	refreshSavesList();

	/*LANGUAGE SELECTIONS*/

	$('.langSelect').removeClass('label label-success');
	$('.' + localStorage.getItem('langCode')).addClass('label label-success');

	/*EXTRA MODAL COLOR PREVIEW MANAGER*/
	$('#colorPreviewColor').css({ 'background-color': getCSSHEXFromWord(getSelected('color_extra')) });

	/*EXTRA VIEWER MANAGER*/
	$('#textsnippets_header').html(getLanguageString('textsnippets.header',localStorage.getItem('langCode')));
	if (input != 'previewLineChange') {
		if (get_type(jobject) == "[object Array]") {
			var extraOutputPreview = "";
			$('.extraContainer div.extraRow').remove();
			$('.extraContainer').html('');
			for (var i = 0; i <= jobject.length - 1; i++) {
				if (jobject.length-1 > i) {
					downButton = '<i onclick="moveUp(' + i + ')" class="fa fa-arrow-circle-down"></i> ';
				} else {
					downButton = "";
				}
				if (i > 0) {
					upButton = '<i onclick="moveUp(' + (i-1) + ')" class="fa fa-arrow-circle-up"></i> ';
				} else {
					upButton = "";
				}
				if (jobject[i].NEW_ITERATE_FLAG) {
					if (templates[localStorage.getItem('jtemplate')].formatType != 'bookarray' && templates[localStorage.getItem('jtemplate')].formatType != 'signset') {
						var tempJSON = '<span style="color:gray;text-decoration:line-through;" lang="textsnippets.NEW_ITERATE_FLAG"></span>';
					} else {
						var tempJSON = '<span lang="textsnippets.NEW_ITERATE_FLAG"></span>';
					}
					var saveButton = '';
				} else {
					if (get_type(jobject[i].text) != "[object Undefined]") {
						var tempJSON = '<input id="previewLine'+i+'" onkeyup="jobject['+i+'].text = $(\'#previewLine'+i+'\').val(); refreshOutput(\'previewLineChange\')" type="text" class="form-control previewLine" value="'+jobject[i].text+'">';
						var saveButton = '';
					} else if (get_type(jobject[i].translate) != "[object Undefined]") {
						var tempJSON = '<input type="text" class="form-control previewLine" disabled value="'+jobject[i].translate+'">';
						var saveButton = '';
					} else if (get_type(jobject[i].score) != "[object Undefined]") {
						var tempJSON = '<input type="text" class="form-control previewLine" disabled value="'+jobject[i].score.name+'\'s '+jobject[i].score.objective+' score">';
						var saveButton = '';
					} else if (get_type(jobject[i].selector) != "[object Undefined]") {
						var tempJSON = '<input type="text" class="form-control previewLine" disabled value="Selector: '+jobject[i].selector+'">';
						var saveButton = '';
					}
					if (input == 'noEditIfMatches' && jobject[i].text != $('#previewLine'+matchTo).val()) {
						var blah = 'blah'; /* wtf */
					} else {
						tempJSON = '<div class="row"><div class="col-xs-10 col-md-11">'+tempJSON+'</div><div class="col-xs-2 col-md-1"><div class="colorPreview"><div class="colorPreviewColor" style="background-color:'+getCSSHEXFromWord(jobject[i].color)+'"></div></div></div></div>';
					}
				}
				var deleteButton = '<i id="'+i+'RowEditButton" onclick="editExtra('+i+');" class="fa fa-pencil"></i> <i onclick="deleteIndex('+ i +');" class="fa fa-times-circle"></i> ';
				if (jobject[i].NEW_ITERATE_FLAG) {
					deleteButton = '<i style="color:gray;" class="fa fa-pencil"></i> <i onclick="deleteIndex('+ i +');" class="fa fa-times-circle"></i> ';
				}
				$('.extraContainer').append('<div class="row extraRow row-margin-top row-margin-bottom mover-row RowIndex' + i + '"><div class="col-xs-4 col-sm-2 col-lg-1">'+deleteButton+downButton+upButton+'</div><div class="col-xs-8 col-sm-10 col-lg-11" style="padding:none;">'+tempJSON+'</div></div>');
			}
			if (jobject.length == 0) {
				delete jobject;
				$('.extraContainer').html('<br><br>');
				refreshLanguage();
			}
		} else {
			$('.extraContainer div.extraRow').remove();
			$('.extraContainer').html('<div class="row"><div class="col-xs-12"><h4>'+getLanguageString('textsnippets.nosnippets',localStorage.getItem('langCode'))+'</h4></div></div>');
		}
		refreshLanguage();
	}

	/* SHOW MOUSE ACTION OPTIONS FOR JSON TEMPLATES WITH THAT FLAG */
	if (templates[localStorage.getItem('jtemplate')].mouseActionOptions) {
		$('.hoverEventContainer_edit').show();
		$('.clickEventContainer_edit').show();
		$('.insertionContainer_edit').show();
		$('.hoverEventContainer').show();
		$('.clickEventContainer').show();
		$('.insertionContainer').show();
	} else {
		$('.hoverEventContainer_edit').hide();
		$('.clickEventContainer_edit').hide();
		$('.insertionContainer_edit').hide();
		$('.hoverEventContainer').hide();
		$('.clickEventContainer').hide();
		$('.insertionContainer').hide();
	}

	if (templates[localStorage.getItem('jtemplate')].formatType == 'signset') {
		$('.clickEventDisabledSigns').show();
		$('.hoverEventDisabledSigns').show();
	} else {
		$('.clickEventDisabledSigns').hide();
		$('.hoverEventDisabledSigns').hide();
	}


	/*EXTRA TRANSLATE STRING MANAGER*/

	if (extraTextFormat == "trn") {
		$('#obj_extra_container').hide();
		$('#text_extra_container').hide();
		$('#selector_extra_container').hide();
		$('#translate_selector_container').show();
		if (!hasAlertedTranslationObjects) {
			swal('Translation objects are currently broken and may crash your game.','Please test your translation before publishing it.','warning');
			hasAlertedTranslationObjects = true;
		}
	} else if (extraTextFormat == "obj") {
		$('#text_extra_container').hide();
		$('#translate_selector_container').hide();
		$('#selector_extra_container').hide();
		$('#obj_extra_container').show();
	} else if (extraTextFormat == "sel") {
		$('#text_extra_container').hide();
		$('#translate_selector_container').hide();
		$('#selector_extra_container').show();
		$('#obj_extra_container').hide();
	} else if (extraTextFormat == "raw") {
		$('#text_extra_container').show();
		$('#obj_extra_container').hide();
		$('#translate_selector_container').hide();
		$('#selector_extra_container').hide();
		$('.extraTranslationParameterRow').hide();
	}
	if (extraTextFormat == 'NEW_ITERATE_FLAG') {
		if (templates[localStorage.getItem('jtemplate')].formatType != 'bookarray' && templates[localStorage.getItem('jtemplate')].formatType != 'signset') {
			var swalObject = {
				title: "You must be using the book or sign templates",
				text: "Do you want to change your template?",
				showCancelButton: true,
				confirmButtonText: "Yes",
				cancelButtonText: "No",
				closeOnConfirm: false,
				closeOnCancel: true
			};
			var swalCallback = function(isConfirm) {
				var template = undefined;
				if (isConfirm) {
					template = "book";
				} else {
					template = "sign_item";
				}

				$('.templateButton').removeClass('btn-success').removeClass('btn-default').addClass('btn-default');
				$('.templateButton[template=' + template + ']').addClass('btn-success').removeClass('btn-default');

				localStorage.setItem('jtemplate',template);
				$('#command').val(templates[localStorage.getItem('jtemplate')]['command']);

				refreshOutput();

				swal("Done!", "Your template has been changed to " + getLanguageString('template.' + template,localStorage.getItem('langCode')), "success");
			}
			swal(swalObject, function(isConfirm){
				if (isConfirm) {
					swal({
						title: "Book or Sign?",
						text: "Do you want to make a book or a sign? (You can change this later)",
						type: "info",
						showCancelButton: true,
						confirmButtonText: "Book",
						cancelButtonText: "Sign",
						closeOnConfirm: false,
						closeOnCancel: false
					}, swalCallback);
				}
			});
			$('#fmtExtraRaw').click();
		}
		$('.NEW_ITERATE_FLAG_not_container').hide();
	} else {
		$('.NEW_ITERATE_FLAG_not_container').show();
	}

	/*COMMAND MANAGER*/
	if ($("#command").val() == "") $("#command").val(templates[localStorage.getItem('jtemplate')]['command']);

	/*PREPARING OUTPUT*/

	var commandString = $('#command').val();

	var JSONOutputString = '';
	var EscapedJSONOutputString = '';
	var formattedJObject = formatJObjectList(jobject);

	var newLineExpressions = {
		"bookarray": /\\\\\\\\n/g,
		"standardjson": /\\\\n/g,
		"signset": /\\\\\\\\n/g
	}
	if (!formattedJObject.length > 0) {
		JSONOutputString = '{}';
	} else {
		if (templates[localStorage.getItem('jtemplate')].formatType == 'bookarray') {
			JSONOutputString = JSON.stringify(formattedJObject);
			JSONOutputString = JSONOutputString.replace(newLineExpressions.bookarray,'\\n');
		} else if (templates[localStorage.getItem('jtemplate')].formatType == 'standardjson') {
			JSONOutputString = formattedJObject[0];
			JSONOutputString = JSONOutputString.replace(newLineExpressions.standardjson,'\\n');
		} else if (templates[localStorage.getItem('jtemplate')].formatType == 'signset') {
			JSONOutputString = 'Text1:' + JSON.stringify(formattedJObject[0]);
			if (formattedJObject.length > 1) {
				JSONOutputString += ',Text2:' + JSON.stringify(formattedJObject[1])
			}
			if (formattedJObject.length > 2) {
				JSONOutputString += ',Text3:' + JSON.stringify(formattedJObject[2])
			}
			if (formattedJObject.length > 3) {
				JSONOutputString += ',Text4:' + JSON.stringify(formattedJObject[3])
			}
			JSONOutputString = JSONOutputString.replace(newLineExpressions.signset,'\\n');
		}
	}

	commandString = commandString.replace('%s',JSONOutputString);

	outputString = commandString;

	$('#outputtextfield').val(outputString);
	if ($('#showNiceLookingOutput').is(':checked')) {
		localStorage.setItem('nlOutput','yes');
		$('#nicelookingoutput').show().html(JSON.stringify(jobject, null, 4).replace(newLineExpressions.standardjson,'\\n'));
	} else {
		localStorage.setItem('nlOutput','no');
		$('#nicelookingoutput').hide();
	}
	jsonParse();

	/*COMMAND BLOCK WARNING*/
	if ($('#outputtextfield').val().length > 90) {
		$('#commandblock').show();
	} else {
		$('#commandblock').hide();
	}

	/*SAVE VARIABLES*/
	localStorage['jobject'] = JSON.stringify(jobject);
	localStorage['jcommand'] = $('#command').val();

	/*RERUN*/
	if (input != 'noLoop' && input != 'previewLineChange') {
		refreshOutput('noLoop');
	}
}
function jsonParse() {
	$('#jsonPreview').css('background-color','#'+$('#previewcolor').val());
	$('#jsonPreview').css('font-size',$('#previewFontSize').val() + 'px');
	localStorage["color"] = $('#previewcolor').val();
	$('#jsonPreview').html('');
	if (templates[localStorage.getItem('jtemplate')].formatType == 'bookarray') {
		$('#jsonPreview').addClass('bookPreview');
		$('#previewBack').show();
		$('#previewForwards').show();
		$('#previewPage').show();
	} else {
		$('#jsonPreview').removeClass('bookPreview');
		$('#previewBack').hide();
		$('#previewForwards').hide();
		$('#previewPage').hide();
	}
	if (get_type(jobject) == "[object Array]") {
		var pageHash = {};
		var counter = 1;
		for (var i = 0; i < jobject.length; i++) {
			if (jobject[i].NEW_ITERATE_FLAG) {
				counter++;
			} else {
				pageHash['index.' + i] = counter;
				topPage = counter;
			}
		}

		//console.log(pageHash);

		$('#previewPage').html('Page ' + bookPage + ' of ' + topPage);

		for (var i = 0; i < jobject.length; i++) {
			if (jobject[i].NEW_ITERATE_FLAG) {
				if (/*templates[localStorage.getItem('jtemplate')].formatType == 'bookarray' || */templates[localStorage.getItem('jtemplate')].formatType == 'signset') {
					$('#jsonPreview').append('<span id="jsonPreviewSpanElement'+ i +'"><hr></span>');
				}
			} else if (pageHash['index.' + i] == bookPage || templates[localStorage.getItem('jtemplate')].formatType != 'bookarray') {
				var doClickEvent = false;
				var doHoverEvent = false;
				var popoverTitle = "";
				var popoverContentClick = "";
				var popoverContentHover = "";
				var hoverEventType = "";
				var hoverEventValue = "";
				var clickEventType = "";
				var clickEventValue = "";
				$('#jsonPreview').append('<span id="jsonPreviewSpanElement'+ i +'"></span>');

				if (jobject[i].text) {
					$('#jsonPreviewSpanElement'+i).html(jobject[i].text.replace(/\\\\n/g,'<br>').replace(/\\n/g,'<br>'));
				} else if (jobject[i].score) {
					$('#jsonPreviewSpanElement'+i).html('<span class="label label-info">' + jobject[i].score.name + ':' + jobject[i].score.objective + '</span>');
				} else if (jobject[i].translate) {
					$('#jsonPreviewSpanElement'+i).html('<span class="label label-warning">Translation</span>');
				} else if (jobject[i].selector) {
					$('#jsonPreviewSpanElement'+i).html('<span class="label label-primary">' + jobject[i].selector + '</span>');
				} else {
					$('#jsonPreviewSpanElement'+i).html('<span class="label label-danger">Unknown Element</span>');
				}

				if (jobject[i].bold == "true") {
					$('#jsonPreviewSpanElement'+i).addClass('bold');
				}
				if (jobject[i].italic == "true") {
					$('#jsonPreviewSpanElement'+i).addClass('italic');
				}
				if (jobject[i].underlined == "true") {
					$('#jsonPreviewSpanElement'+i).addClass('underlined');
				}
				if (jobject[i].strikethrough == "true") {
					if ($('#jsonPreviewSpanElement'+i).hasClass('underlined')) {
						$('#jsonPreviewSpanElement'+i).removeClass('underlined');
						$('#jsonPreviewSpanElement'+i).addClass('strikethroughunderlined');
					} else {
						$('#jsonPreviewSpanElement'+i).addClass('strikethrough');
					}
				}
				if (jobject[i].obfuscated == "true") {
					$('#jsonPreviewSpanElement'+i).addClass('jsonPreviewObfuscated');
				}

				/*COLORS*/
				$('#jsonPreviewSpanElement'+i).css('color',getCSSHEXFromWord(jobject[i].color));

				/*CLICK & HOVER EVENTS*/

				if (get_type(jobject[i].clickEvent) != "[object Undefined]" || get_type(jobject[i].hoverEvent) != "[object Undefined]") {
					if (get_type(jobject[i].clickEvent) != "[object Undefined]") doClickEvent = true;
					if (get_type(jobject[i].hoverEvent) != "[object Undefined]") doHoverEvent = true;
					if (doHoverEvent && doClickEvent) {
						popoverTitle = getLanguageString('textsnippets.hoverevent.header',localStorage.getItem('langCode')) + ' and ' + getLanguageString('textsnippets.clickevent.header',localStorage.getItem('langCode'));
						hoverEventType = jobject[i].hoverEvent.action;
						hoverEventValue = jobject[i].hoverEvent.value;
						clickEventType = jobject[i].clickEvent.action;
						clickEventValue = jobject[i].clickEvent.value;
					}
					if (doHoverEvent && !doClickEvent) {
						popoverTitle = getLanguageString('textsnippets.hoverevent.header',localStorage.getItem('langCode'));
						hoverEventType = jobject[i].hoverEvent.action;
						hoverEventValue = jobject[i].hoverEvent.value;
					}
					if (!doHoverEvent && doClickEvent) {
						popoverTitle = getLanguageString('textsnippets.clickevent.header',localStorage.getItem('langCode'));
						clickEventType = jobject[i].clickEvent.action;
						clickEventValue = jobject[i].clickEvent.value;
					}
					if (doClickEvent) {
						if (clickEventType == "open_url") {
							popoverContentClick = clickEventType+':<a href="'+clickEventValue+'">'+clickEventValue+'</a>';
						} else {
							popoverContentClick = clickEventType+':'+clickEventValue;
						}
					}
					if (doHoverEvent) {
						popoverContentHover = hoverEventType+':'+hoverEventValue;
					}
					if (doHoverEvent && doClickEvent) {
						popoverContentClick = popoverContentClick + '<br>';
					}
					$('#jsonPreviewSpanElement'+i).attr('rel','popover');
				}
				$('#jsonPreviewSpanElement'+ i).popover({ title: popoverTitle, content: popoverContentClick+popoverContentHover, html:true});
			}
		}
	} else {
		$('#jsonPreview').html(getLanguageString('output.nothing',localStorage.getItem('langCode')));
		$('#jsonPreview').css('color','white');
	}
}
function refreshLanguage(dropdownSelection) {
	if (lang[localStorage.getItem('langCode')]) {
		$('*').refreshLanguage(localStorage.getItem('langCode'));
	} else {
		localStorage.setItem('langCode','en_US')
	}
	$('*').each(function(){
		//if ($(this).attr('version') != undefined && (localStorage['versionIndicators'] == "true" || localStorage['versionIndicators'] == undefined)) {
			if (false) {
				var labelLevel = 'success';
				if ($(this).attr('version') == '1.9') {
					labelLevel = 'danger';
				}
				if ($(this).prop('tagName') == 'OPTION') {
					$(this).prepend('('+$(this).attr('version')+') ');
				} else {
					$(this).append(' <span class="label label-'+labelLevel+'">'+$(this).attr('version')+'</span>');
				}
			}
		});
}

function initialize() {
	if (localStorage.getItem('initialTimestamp') == undefined) {
		localStorage.setItem('initialTimestamp',new Date().getTime())
	}

	if (localStorage.getItem('langCode') == undefined) {
		if (lang[navigator.language.toLowerCase()] != undefined) {
			localStorage.setItem('langCode',navigator.language.toLowerCase());
		} else {
			if (webLangRelations[navigator.language.toLowerCase()] != undefined) {
				localStorage.setItem('langCode',webLangRelations[navigator.language.toLowerCase()]);
			}
		}
	}

	if (localStorage.getItem('langCode') == undefined) {
		localStorage.setItem('langCode','en_US');
	}

	quill = new Quill('#editor', {
		formats: ['bold', 'italic', 'underline', 'strike', 'color']
	});
	quill.addModule('toolbar', { container: '#toolbar' });
	quill.addFormat('obfuscated', { tag: 'OBFS', prepare: 'obfuscated' });
	quill.addFormat('clickEvent', { tag: 'CLICKEVENT', attribute: 'value'});
	quill.addFormat('hoverEvent', { tag: 'HOVEREVENT', attribute: 'value'});

	if (localStorage.getItem('jformat') != version && localStorage.getItem('jformat') != undefined) {
		swal({
			title: "Your cookie format is old!",
			text: "This may cause issues. Would you like to reset them? You won't be asked again until the next time the format changes.",
			showCancelButton: true,
			confirmButtonText: "Reset Cookies",
			cancelButtonText: "Don't Reset",
			closeOnCancel: false
		},function(isConfirm){
			if (isConfirm) {
				sessionStorage.setItem('nextTimeAlert',JSON.stringify({'title': 'All Done', 'text': 'Your cookies have successfully been reset.\n\nCookies are reset when the format changes drastically, or when a mistake causes the cookies to break the website.', 'type': 'success'}));
				localStorage.clear();
				location.reload();
			} else {
				swal('Nothing was reset','You won\'t be asked again until the cookie format changes. If you experience an issue, please clear your coookies for this website', 'info');
			}
		});
	} else {
		/*check if alert isn't correctly set. Do not show the alert is jformat isn't set – that means the user hasn't been here before*/
		if (localStorage.getItem('jalert') != notice.id && localStorage.getItem('jformat') != undefined && notice.show) {
			swal(notice.message);
		}
		localStorage.setItem('jalert',notice.id);
	}
	localStorage.setItem('jformat',version);

	if (sessionStorage.getItem('nextTimeAlert')) {
		swal(JSON.parse(sessionStorage.getItem('nextTimeAlert')));
		sessionStorage.removeItem('nextTimeAlert');
	}
	if (localStorage.getItem('nextTimeAlert')) {
		swal(JSON.parse(localStorage.getItem('nextTimeAlert')));
		localStorage.removeItem('nextTimeAlert');
	}

	if (localStorage.getItem('donateAlert') != "shown" && localStorage.getItem('donateAlert') != "not-shown") {
		localStorage.setItem('donateAlert','not-shown')
	} else {
		if (localStorage.getItem('donateAlert') == 'not-shown' && false) {
			swal({
				"title": "Please Consider Donating",
				"text": "Donations help support my developement of these programs!\n\nDonations can be done through a variety of services, it's up to you.",
				"confirmButtonText": "I want to donate",
				"cancelButtonText": "I have already or don't want to donate",
				"showCancelButton": true,
				"closeOnConfirm": false,
				"closeOnCancel": false
			}, function(want){
				if (want) {
					var swalCallback = function(amount){
						if (amount > 25 && amount < 40) {
							var swalMessage = {
								"title": "Overcast Network",
								"text": "That amount fits nicely with an upgrade to my <a href=\"http://oc.tc/ezfe\">Overcast Network</a> account",
								"html": true,
								"confirmButtonText": "Ok, show me the page",
								"cancelButtonText": "I'd rather just send the money",
								"showCancelButton": true,
								"closeOnConfirm": false,
								"closeOnCancel": false
							};
							var swalCallback = function(shouldGoToOvercast){
								if (shouldGoToOvercast) {
									swal({
										"title": "Almost done...",
										"text": "When you arrive, enter the username <i>ezfe</i>",
										"html": true,
									},function(){
										localStorage.setItem('nextTimeAlert',JSON.stringify({"title": "Thanks!", "text": "I'm assuming you donated, in which case thanks! Otherwise, perhaps later?", "type": "success"}));
										location.href = "https://oc.tc/shop";
									});
								} else {
									var swalMessage = {
										"title": "Ok, that's fine",
										"text": "Right now, I only offer PayPal, because my web payment system is broken.\n\nYou can find my email address at the bottom of the page!",
										"status": "success"
									};
									swal(swalMessage);
								}
							}
							swal(swalMessage,swalCallback);
						} else {
							var swalMessage = {
								"title": "Great!",
								"text": "Right now, I only offer PayPal, because my web payment system is broken.\n\nYou can find my email address at the bottom of the page!",
								"status": "success"
							};
							swal(swalMessage);
						}
					}
					swal({
						"title": "Awesome",
						"text": "How much do you want to donate?\n(Please enter a number, like 3 or 11. Don't enter the $ symbol)",
						"type": "input",
						"closeOnConfirm":  false
					},swalCallback);
				} else {
					swal('Awe...','I won\'t bother you again, so long as you don\'t reset your cookies.\n\nI can\'t remember things if you do that.');
				}
			});
localStorage.setItem('donateAlert','shown');
}
}
	//

	for (var i = 0; i < Object.keys(templates).length; i++) {
		var key = Object.keys(templates)[i]
		if (key == localStorage.getItem('jtemplate')) {
			var classString = 'btn-success';
		} else {
			var classString = 'btn-default';
		}
		$('#templateButtons').append('<button class="btn btn-xs ' + classString + ' templateButton" lang="template.' + key + '" version="' + templates[key]['version'] + '" template="'+ key +'"></button> ');
	}
	if (localStorage.getItem('jtemplate') == undefined) {
		localStorage.setItem('jtemplate', 'tellraw');
	}
	if (lang[localStorage.getItem('langCode')]) {
		errorString = getLanguageName(localStorage.getItem('langCode')) + '<br><br>';
	} else {
		errorString = '&lt;language unknown&gt;<br><br>';
	}
	/*var enCount = JSON.stringify(lang['en_US']).length;*/
	for (var i = 0; i < Object.keys(lang).length; i++) {
		/*var langKey = Object.keys(lang)[i];
		var currentCount = JSON.stringify(lang[langKey]).length;
		var currentPercentage = Math.round(currentCount/enCount*100);
		console.log(currentPercentage);*/
		$('#language_keys').append('<li><a onclick="errorString = \''+ getLanguageName(Object.keys(lang)[i]) +'<br><br>\'; localStorage.setItem(\'langCode\',\''+Object.keys(lang)[i]+'\'); refreshLanguage(true); refreshOutput();"><span class="' + Object.keys(lang)[i] + ' langSelect" id="language_select_'+Object.keys(lang)[i]+'">'+ getLanguageName(Object.keys(lang)[i]) +'</span></a></li>');
	};
	$('#language_keys').append('<li class="divider"></li>');
	$('#language_keys').append('<li><a href="http://translate.minecraftjson.com"><span class="language_area" lang="language.translate"></span></a></li>');

	$('.extraTranslationParameterRow').hide();

	if (localStorage['color'] != undefined) {
		$('#previewcolor').val(localStorage["color"]);
	} else {
		$('#previewcolor').val('617A80');
	}
	$('#previewcolor').css('background-color','#'+$('#previewcolor').val());

	jsonParse();

	if (localStorage['jobject'] != undefined) {
		jobject = verify_jobject_format(JSON.parse(localStorage["jobject"]));
		quill.setContents(build_quill_delta());
	}

	if (localStorage.getItem('nlOutput') == undefined) {
		localStorage.setItem('nlOutput','no');
	}

	if (localStorage.getItem('nlOutput') == 'no') {
		$('#showNiceLookingOutput').prop('checked', false);
	} else {
		$('#showNiceLookingOutput').prop('checked', true);
	}

	showView('pageheader',true,false);
	//JSON.stringify({"viewname":viewname,"suppressAnimation":suppressAnimation,"hideOthers":hideOthers,"hideMenubar":hideMenubar})
	if (localStorage.getItem('jview') != undefined/* && typeof JSON.stringify(localStorage.getItem('jview')) != "string"*/) {
		var viewObject = JSON.parse(localStorage.getItem('jview'));
		showView(viewObject.viewname,viewObject.suppressAnimation,viewObject.hideOthers,viewObject.hideMenubar);
	} else {
		showView('tellraw')
	}
	if (localStorage.getItem('jtosaccept') == undefined || localStorage.getItem('jtosaccept') != tos_version) {
		//showView('tos-header',true,false,true);
	}
	$('.templateButton').click(function(){
		$('.templateButton').removeClass('btn-success').removeClass('btn-default').addClass('btn-default');
		$(this).addClass('btn-success').removeClass('btn-default');

		var template = $(this).attr('template');

		localStorage.setItem('jtemplate',template);
		$('#command').val(templates[localStorage.getItem('jtemplate')]['command']);

		refreshOutput();
	});

	quill.on('text-change', function(delta, source) {
		refreshOutput();
	});

	$('.ql-obfs').on('click',function(){
		quill.focus();
		var range = quill.getSelection();
		quill.formatText(range, 'obfuscated', true);
	});
	$('.ql-click-event').on('click',function(){
		var action = prompt('action?: run_command, suggest_command, open_url, change_page');
		var value = prompt('value?');
		var object = {"action":action,"value":value};
		var tagid = storeSpecialTagItem(object);
		quill.focus();
		var range = quill.getSelection();
		quill.formatText(range, 'clickEvent', tagid);
	});
	$('.ql-hover-event').on('click',function(){
		var action = prompt('action?: show_text, show_item, show_entity, show_achievement');
		var value = prompt('value?');
		var object = {"action":action,"value":value};
		var tagid = storeSpecialTagItem(object);
		quill.focus();
		var range = quill.getSelection();
		quill.formatText(range, 'hoverEvent', tagid);
	});

	$('#command').val(localStorage.getItem('jcommand'));

	$('#command').change(function(){refreshOutput()});

	$('#import').click(function() {
		swal({
			"title": "Import",
			"text": getLanguageString('settings.importtext.exported',localStorage.getItem('langCode'),false,false),
			"type": "input",
			"closeOnConfirm": false
		},function(oinpt){
			var inpt = undefined
			try {
				inpt = JSON.parse(oinpt);
			} catch(err) {
				logIssue('Import failed','Provided input: ' + oinpt,true)
			}
			jobject = inpt['jobject'];
			if (inpt['jtemplate']) {
				localStorage.setItem('jtemplate',inpt['jtemplate'])
			}
			$('#command').val(inpt['command']);

			swal("Imported", "Your command has been imported", "success");
			refreshOutput();
		})
	});
	$('#export').click(function(){
		$('#exporter').remove();
		$('.alerts').append('<div id="exporter" class="alert alert-info"><h4 lang="export.heading"></h4><p><textarea readonly id="exportText">' + JSON.stringify({"command":$('#command').val(),"jobject":jobject,"jtemplate":localStorage.getItem('jtemplate')}) + '</textarea></p><p><button type="button" onclick="closeExport()" class="btn btn-default" lang="export.close"></button></p></div>');
		$exportText = $('#exportText');
		$exportText.select();
		$exportText.height('1px');
		$exportText.height(exportText.scrollHeight + "px");
		$exportText.click(function(){
			this.select();
		});
		goToByScroll('exporter');
		refreshLanguage();
	});
	$('#translate_input').change(function(){
		var val = translationStrings[$('#translate_input').val()];
		var match = val.match(/%./g);
		matchLength = match.length
		var c = getSelected('translate_selector');
		$('.extraTranslationParameterRow').hide();
		$('.extraTranslationParameterRow').val('');
		if (match != null) {
			for (var i = matchLength - 1; i >= 0; i--) {
				if (matchLength > 5) {
					swal('An unexpected error has occured.','EID-more than 5 matches','error');
				}
				for (var i = matchLength - 1; i >= 0; i--) {
					$('#parameter'+i+'row').show();
				};
			};
		}
	});
	refreshLanguage();
	refreshOutput();
	$('.fmtExtra').on('click', function(){
		extraTextFormat = $(this).attr('tellrawType');
		$('.fmtExtra').removeClass('active');
		$(this).addClass('active');
		refreshOutput();
	});
	$('#addHoverTextText').on('click',function(){
		textobj = JSON.parse($('#hoverEventText').val());
		snipobj = {"text":$('#hoverEventTextSnippet').val()};
		if ($('#snippetcolor').val() != 'none') {
			snipobj.color = $('#snippetcolor').val();
		}
		$('#hoverEventTextSnippet').val('');
		textobj.extra.push(snipobj)
		$('#hoverEventText').val(JSON.stringify(textobj));
	});
	$('#removeHoverTextText').on('click',function(){
		textobj = JSON.parse($('#hoverEventText').val());
		textobj.extra.splice(-1,1)
		$('#hoverEventText').val(JSON.stringify(textobj));
	});
	$('#addExtraButton').on('click',function(){
		showView('add-extra')
		editing = true;
	});
	$( "#translate_input" ).autocomplete({
		//source: Object.keys(translationStrings)
	});
	$( "#translate_input_edit" ).autocomplete({
		//source: Object.keys(translationStrings)
	});
	$('#show-saves').on('click',function(){
		showView('saves');
	});
	$('#hide-saves').on('click',function(){
		showView('tellraw');
	});
	$('#lang_request').on('click',function(){
		showView('lang-request');
		$('#lang-request-errorstring').html(errorString);
	});
	$('#helptoggle').click(function(){
		$('.help-box').toggle();
	});
	$('#enable_dark_mode').on('click',function(){
		localStorage.setItem('darkMode','true');
		$('body').addClass('black-theme');
		$(this).hide();
		$('#disable_dark_mode').show();
	});
	$('#disable_dark_mode').on('click',function(){
		localStorage.setItem('darkMode','false');
		$('body').removeClass('black-theme');
		$(this).hide();
		$('#enable_dark_mode').show();
	});

	if (is_prerelease) {
		$('.report-issue').attr('disabled','yes');
		$('.corner-ribbon').show();
	}

	$('.report-issue').on('click',function(){
		if (is_prerelease) {
			alert('Issues cannot be reported on a pre-release version');
			return false
		}
		$('.view-container[view="report-issue"]').children().not('.cancel-issue-row').hide();
		$('#issue-workflow-r1').show();
		showView('report-issue');
	});


	$('#previewBack').click(function(){
		if (bookPage != 1) bookPage--;
		refreshOutput();
	});

	$('#previewForwards').click(function(){
		if (bookPage < topPage) bookPage++;
		refreshOutput();
	});
	$('.issue-button').click(function(){
		var parentRow = $(this).parent().parent();
		parentRow.hide();
		var id = $(this).attr('id');
		if (id == "translation-issue-button") {
			$('#issue-workflow-r2-translation').fadeIn();
		} else if (id == "output-issue-button") {
			$('#issue-workflow-r2-output').fadeIn();
		} else if (id == "translation-current-issue-button") {
			reportAnIssue('Translation Issue (' + localStorage.getItem('langCode') + ')');
			showView('tellraw');
		} else if (id == "translation-other-issue-button") {
			reportAnIssue('Translation Issue (Other)');
			showView('tellraw');
		} else if (id == "output-quotes-issue-button") {
			$('.templateButton[template=tellraw]').click();
			swal('The issue should be fixed.','If it is not, please report as Output > Other, and note this event in your report..','info');
			showView('tellraw');
		} else if (id == "output-other-issue-button") {
			reportAnIssue('Output Issue (Other)');
			showView('tellraw');
		} else if (id == "cancel-issue-button") {
			showView('tellraw');
			parentRow.show();
		} else {
			showView('tellraw');
			reportAnIssue();
		}
	});

	//
	//Dark Mode

	if (localStorage.getItem('darkMode') && localStorage.getItem('darkMode') == 'true') {
		$('#enable_dark_mode').click(); //Finish setting up dark mode after handlers exist
	}

}
$(document).ready(function(){
	if (localStorage.getItem('darkMode') && localStorage.getItem('darkMode') == 'true') {
		$('body').addClass('black-theme'); //Rest of "dark mode" is handled later, color scheme handled early for appearance
	} else if (localStorage.getItem('darkMode') == undefined) {
		$('body').addClass('black-theme');
		localStorage.setItem('darkMode','true');
	}
	$('.view-container').hide();
	showView('loading',true,true,true);

	$('#loadingtxt').html('Loading Assets');
	try {
		data = getURL('resources.json');
	} catch(err) {
		swal({
			"title": "Error!",
			"text": "An error occured loading page assets. Please try again later.",
			"type": "error"
		},function(){
			$('html').html('Please try again later');
		});
	}
	if (typeof data == 'string') {
		try {
			data = JSON.parse(data);
		} catch(err) {
			swal({
				"title": "Error!",
				"text": "An error occured loading page assets. Please try again later.",
				"type": "error"
			},function(){
				$('html').html('Please try again later');
			});
		}
	}
	if (location.hash == "#embed") {
		$('.view-container[view="tellraw"]').children().filter('br').remove();
		embed = true;
	} else {
		embed = false;
	}
	translationStrings = data['minecraft_language_strings']['en_US'];
	webLangRelations = data['web_language_relations'];
	achievements = data['achievements'];
	commands = data['commands'];
	for (var i = 0; i < data['web_language_urls'].length; i++) {
		try {
			var urlFetch = getURL('lang/' + data['web_language_urls'][i] + '.json');
		} catch(err) {
			if (data['web_language_urls'][i] == 'en_US') {
				var urlFetch = {"language":{"name":"English"}};
			} else {
				continue;
			}
		}
		if (typeof urlFetch == 'string') {
			try {
				urlFetch = JSON.parse(urlFetch);
			} catch(err) {
				if (data['web_language_urls'][i] == 'en_US') {
					var urlFetch = {"language":{"name":"English"}};
				} else {
					continue;
				}
			}
		}
		lang[data['web_language_urls'][i]] = urlFetch;
	}
	delete lang.status;
	setTimeout(initialize,500);
});
