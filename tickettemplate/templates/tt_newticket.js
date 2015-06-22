jQuery(document).ready(function($) {
  function _(message) {
    return message;
  }

  messages = [
    _('My Template'),
    _('Create'),
    _('Delete'),
    _('Save template success: '),
    _('Delete template success: '),
    _('Please input template name (overwriting existing one with equal name).'),
    _('Sure to restore the last edited content?'),
    _('Submit ticket?'),
    _('Replace ticket content with template?'),
    _('')
  ];

  var myTemplateHtml = "<div id='tt_custom' style='position:absolute; right: -160pt; margin: 3em 0pt 4em; clear: right; float: right; width: 200px;'><fieldset><legend>" + "${_('My Template')}" + "</legend><select id='tt_custom_select' name='tt_custom_select' style='width: 10em;'></select><br/><input type='button' name='tt_custom_save' value='" + "${_('Create')}" + "' id='tt_custom_save'/><input type='button' name='tt_custom_delete' value='" + "${_('Delete')}" + "' id='tt_custom_delete'/></fieldset><div id='tt_custom_tip' name='tt_custom_tip' style='color: rgb(0, 255, 0); width: 10em;'/></div>";
  var rel_url = "tt/";
  var queryResult = null;
  var isLoad = true;

  function _updateTargetElem(ticketType) {
    // for TracWysiwyg
    var wysiwyg_mode = $("#editor-wysiwyg-1:checked").length;
    if (wysiwyg_mode) {
      $("#editor-textarea-1").click();
    }

    for (field in ticketType) {
      // update targetElem value
      var targetElem = document.getElementById('field-' + field);

      if (targetElem) {
        if (targetElem.type == 'checkbox') {
          targetElem.checked = ticketType[field] == 1;
        } else if (targetElem.type == 'select-one') {
          var options = targetElem.getElementsByTagName('option');
          for (var i = 0; i < options.length; i++) {
            var elem = options[i];
            if (elem.text == ticketType[field]) {
              elem.selected = true;
            }
          }
        } else {
          targetElem.value = ticketType[field];
        }
      } else {
        var targetElems = document.getElementsByName('field_' + field);
        for (var i = 0; i < targetElems.length; i++) {
          var elem = targetElems[i];
          if (elem.value == ticketType[field]) {
            if (elem.type == 'checkbox') {
              elem.checked = ticketType[field] == 1;
            }
          }
        }
      }
    }
    // for TracWysiwyg
    if (wysiwyg_mode) {
      $("#editor-wysiwyg-1").click();
    }
  }

  function handleResponseQuery(result) {
    if (result == 0 || result == -1) {
      return;
    }
    queryResult = result;

    if (isLoad == true && queryResult.enable_custom) {
      // custom
      var tt_custom_select = $("#tt_custom_select");
      $("#content").prepend(myTemplateHtml);
      tt_custom_select.append("<option></option>");

      $("#tt_custom_save").click(onCustomSave);
      $("#tt_custom_delete").click(onCustomDelete);
      tt_custom_select.change(onCustomChanged);
      $("#tt_custom_tip").click(onCustomTip);
      // set custom to null
      tt_custom_select.val("");
    }

    // fill custom template select
    var custom_names = [];
    for (name in queryResult.field_value_mapping_custom) {
      custom_names.push(name);
    }
    custom_names.sort();

    for (var i in custom_names) {
      var name = custom_names[i];
      $("#tt_custom_select").append("<option>" + name + "</option>");
    }

    // delete edit_buffer from my template
    tt_custom_select.find("option:contains('edit_buffer')").remove();

    if (isLoad == true) {
      var evt = {"type": "change"};
      // trigger type change
      var params = location.search.slice(1).split("&");
      var ticket_preset = false;
      for (var i = 0; i < params.length; i++) {
        var param = params[i];
        var param_name = param.split("=")[0];
        if (param_name == "description") {
          ticket_preset = true;
          break;
        }
      }

      if (!ticket_preset) {
        $("#field-type").change();
      }

      var reapplyTemplate = result["warning"] != "1" && !preview;
      initTypeChanged(reapplyTemplate);
    }
  }

  function handleResponseSave(jsonStr) {

    var result = JSON.parse(jsonStr, null);
    if (result == 0 || result == -1) {
      return;
    }

    var tt_name = result.tt_name;

    // update field_value_mapping_custom
    queryResult.field_value_mapping_custom[tt_name] = result.new_template;

    // insert options
    var tt_custom_select = $("tt_custom_select");
    if (!tt_custom_select.find("option:contains('" + tt_name + "')").length) {
      var optionNew = '<option>' + tt_name + '</option>';
      tt_custom_select.append(optionNew);
    }

    var tt_custom_tip = $('#tt_custom_tip');
    tt_custom_tip.empty();
    tt_custom_tip.append("${_('Save template success: ')}" + tt_name);
  }

  function handleResponseDelete(jsonStr) {

    var result = JSON.parse(jsonStr, null);
    if (result == 0 || result == -1) {
      return;
    }

    var tt_name = result.tt_name;

    var tt_custom_select = $("tt_custom_select");
    tt_custom_select.find('option:selected').remove();

    // set custom to null
    tt_custom_select.val("");

    var tt_custom_tip = $('#tt_custom_tip');
    tt_custom_tip.empty();
    tt_custom_tip.append("${_('Delete template success: ')}" + tt_name);

  }

  function onCustomChanged(evt) {
    var tt_name = $("#tt_custom_select").val();
    if (!tt_name) {
      return;
    }

    if (evt.type == "change") {
      var answer = confirm("${_('Replace ticket content with template?')}");
      if (!answer) {
        return;
      }
    }

    // apply custom template
    var ticketType = queryResult.field_value_mapping_custom[tt_name];
    _updateTargetElem(ticketType);
  }

  function onCustomTip(evt) {
    $("#tt_custom_tip").empty();
  }

  function onCustomSave(evt) {
    var tt_name = prompt("${_('Please input template name (overwriting existing one with equal name).')}");
    if (!tt_name) {
      return;
    }

    // for TracWysiwyg
    var wysiwyg_mode = $("#editor-wysiwyg-1:checked").length;
    if (wysiwyg_mode) {
      $("#editor-textarea-1").click();
    }

    // get new_template
    var new_template = {};
    for (var i = 0; i < queryResult.field_list.length; i++) {
      var field = queryResult.field_list[i];
      var elem = document.getElementById('field-' + field);
      if (elem) {
        if (elem.type == 'checkbox') {
          if (elem.checked) {
            new_template[field] = 1;
          } else {
            new_template[field] = 0;
          }
        }
        else if (elem.type == 'select-one') {
          var options = elem.getElementsByTagName('option');
          for (var j = 0; j < options.length; j++) {
            if (options[j].selected) {
              new_template[field] = options[j].text;
            }
          }
        } else {
          new_template[field] = elem.value;
        }
      }
    }

    // for TracWysiwyg
    if (wysiwyg_mode) {
      $("#editor-wysiwyg-1").click();
    }

    // dump json string
    data = {
      "tt_name": tt_name,
      "custom_template": new_template
    };
    var json_string = JSON.stringify(data);

    $.ajax(
      {
        cache: false,
        async: true,
        url: rel_url + "custom_save",
        success: handleResponseSave,
        type: "POST",
        contentType: "application/json",
        data: json_string
      }
    );
  }

  function onCustomDelete(evt) {
    var tt_name = $("#tt_custom_select").val();
    if (!tt_name) {
      return;
    }

    // dump json string
    data = {
      "tt_name": tt_name
    };
    var json_string = JSON.stringify(data);

    $.ajax(
      {
        cache: false,
        async: true,
        url: rel_url + "custom_delete",
        success: handleResponseDelete,
        type: "POST",
        contentType: "application/json",
        data: json_string
      }
    );

  }

  function loadEditBuffer(evt) {
    var answer = confirm("${_('Sure to restore the last edited content?')}");
    if (!answer) {
      return;
    }

    // get last ticket field values
    $.getJSON(rel_url + "query", function (result) {
      // replace ticket fields
      queryResult = result;
      var ticketType = queryResult.field_value_mapping_custom["edit_buffer"];
      _updateTargetElem(ticketType);
    });

  }

  function onTypeChanged(evt) {
    var tt_name = $("#field-type").val();
    if (!tt_name) {
      tt_name = $("#field-type", ttTypeCache["Default"]).val();
    }

    if (!queryResult) {
      return;
    }

    if (isLoad) {
      return;
    }

    if (evt.type == "change" && isLoad == false) {
      var answer = confirm("${_('Replace ticket content with template?')}");
      if (!answer) {
        return;
      }
    }

    var ticketType = queryResult.field_value_mapping[tt_name];
    if (!ticketType) {
      ticketType = queryResult.field_value_mapping['default'];
    }
    _updateTargetElem(ticketType);

  }

  function initTypeChanged(reapplyTemplate) {
    // reset isLoad
    isLoad = false;

    if (location.href.indexOf("newticket#ticket", location.href.length - "newticket#ticket".length) !== -1) {
      return;
    }

    var tt_name = $("#field-type").val();
    if (!tt_name) {
      tt_name = $("#field-type", ttTypeCache["Default"]).val();
    }

    if (!queryResult) {
      return;
    }

    if (reapplyTemplate) {
      var ticketType = queryResult.field_value_mapping[tt_name];
      if (!ticketType) {
        ticketType = queryResult.field_value_mapping['default'];
      }
      _updateTargetElem(ticketType);
    }
  }

  $("#field-type").change(onTypeChanged);

  // requery
  if ($("#warning").get(0)) {
    $.getJSON("tt/query" + location.search, {warning: "1"}, handleResponseQuery);
  } else {
    $.getJSON("tt/query" + location.search, handleResponseQuery);
  }
});
