$(document).ready(function(){
    var socket = io();

    $("#startSession").click(function() {
        if ($("#sID").val() != "") {
            socket.emit("sessionCreate", {
                sessionID: $("#sID").val(),
                groupSize: $("#groupSize").val()
            });
            
            $("#sID").prop("disabled", true);
            $("#groupSize").prop("disabled", true);
            $("#startSession").prop("disabled", true);

            $("#sIDindicator").html("<b>Session ID: </b>" + $("#sID").val());
            $("#gSizeindicator").html("<b>Group Size: </b>" + $("#groupSize").val());

            toastr.success("Session Created");
        }
    });

    $("#Back").click(function() {
        window.location.href = '/';
    });
});