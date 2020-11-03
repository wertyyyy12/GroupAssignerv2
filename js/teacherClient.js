$(document).ready(function(){
    var socket = io();

    $("#startSession").click(function() {
        if ($("#sID").val() != "") {
            if ($("#groupSize").val() != "") {
                socket.emit("sessionCreate", {
                    sessionID: $("#sID").val(),
                    groupSize: $("#groupSize").val()
                });
                
                $("#sID").prop("disabled", true);
                $("#groupSize").prop("disabled", true);
                $("#startSession").css("display", "none");

                $("#sIDindicator").html("<b>Session ID: </b>" + $("#sID").val());
                $("#gSizeindicator").html("<b>Group Size: </b>" + $("#groupSize").val());

                toastr.success("Session Created");

                $("#endSession").css("display", "inline");
            }
        }
    });

    $("#endSession").click(function() {
        socket.emit("endSession", $("#sID").val());
    });
    
    $("#Back").click(function() {
        window.location.href = '/';
    });
});