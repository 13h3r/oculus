
$(document).ready(function(){
    
    menu = new Menu({
        menuSchemas:{div:"schemas", cb: refreshSchemas},
        menuTablespaces:{div:"tablespaces", cb: refreshTablespace},
        menuDumps:{div:"dumps", cb:refreshDumps},
        schemaRefresh:{div:"schemaInfo", cb:refreshSchemaInfo}
        });
    menu.init();
    
   $('#reloadSidList').click(function(){
       _ajaxCall("/api/sid", reloadSidListCB);
   });
   
   $("#confirmModalNo").click(function(){$("#confirmModal").modal('hide');});
   $("#schemaInfoDrop").click(dropSchema);
   $("#schemaInfoDisconnect").click(disconnectSchema);
   $("#dumpInstall").click(function(){ _notificationInfo('test1')});
 });


function _getSelectedSid() {
    var selectedOption = $("#sids").find(":selected");
    return selectedOption.attr('host') + "/" + selectedOption.attr('sid');
}

function _getSelectedSchema() {
	return $("#schemaDetailsName").text();
}

function refreshSchemas() {
    $("#schemas").find("tbody").children().remove();
    _ajaxCall("/api/sid/" + _getSelectedSid() + "/schema?withTable=DB_PATCHES", refreshSchemasCB);
}
function refreshSchemasCB(json) {
    table = $("#schemas").find("tbody");
    for (i in json) {
        $('#tmplSchema').tmpl(json[i]).appendTo(table);
    }
    table.find("tr").click(showSchemaDetails);
}
function showSchemaDetails(source) {    
    var clickedSchema = $(source.target).parent().find("td").first().text();
    console.log("schema info for" + clickedSchema);
    $("#schemaDetailsName").text(clickedSchema);
    menu.activate("schemaRefresh");
}
function refreshSchemaInfo() {
    $("#schemaInfoSize").text("");
    $("#schemaInfoLastPatch").text("");
    $("#schemaInfoConnectionCount").text("");
    _ajaxCall("/api/sid/" + _getSelectedSid() + "/schema/" + _getSelectedSchema(), refreshSchemaInfoCB);
}
function refreshSchemaInfoCB(json) {
    $("#schemaInfoSize").text(json['size']);
    $("#schemaInfoLastPatch").text(json['lastPatch']);
    $("#schemaInfoConnectionCount").text(json['connectionCount']);
}

function refreshDumpsCB(json) {
    table = $("#dumps").find("tbody");
    for (i in json) {
        $('#tmplDump').tmpl(json[i]).appendTo(table);
    }
}
function refreshDumps() {
	$("#dumps").find("tbody").children().remove();
	_ajaxCall("/api/sid/" + _getSelectedSid() + "/dump", refreshDumpsCB);
}


function refreshTablespace() {
    $("#tablespaces").find("tbody").children().remove();
    _ajaxCall("/api/sid/" + _getSelectedSid() + "/tablespace", refreshTablespaceCB);
}
function refreshTablespaceCB(json) {
    table = $("#tablespaces").find("tbody");
    for (i in json) {
        $('#tmplTablespace').tmpl(json[i]).appendTo(table);
    }
}

function reloadSidListCB(json) {
    list = $('#sids');
    list.children().remove();
    for (i in json) {
        $('#tmplSidItem').tmpl(json[i]).appendTo(list);
    }
}


function disconnectSchema() {
	_confirmedCall("Disconnect all clients?", disconnectSchemaDo);
}
function disconnectSchemaDo() {
	_confirmedCallFinished();
	_ajaxCall("/api/sid/" + _getSelectedSid() + "/schema/" + _getSelectedSchema() + "?action=disconnectAll", disconnectSchemaDoCB, 'Disconnecting');
}
function disconnectSchemaDoCB(json) {
	menu.activate('schemaRefresh');
}

function dropSchema() {
	_confirmedCall("Drop schema?", dropSchemeDo);
}
function dropSchemeDo() {
	_confirmedCallFinished();
	_ajaxCall("/api/sid/" + _getSelectedSid() + "/schema/" + _getSelectedSchema() + "?action=drop", dropSchemaDoCB, 'Dropping');
}
function dropSchemaDoCB(json) {
	menu.activate('menuSchemas');
}
