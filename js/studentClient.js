$(document).ready(function(){
    var socket = io();

    $("#joinSession").click(function() {
        if ($("#sID").val() != "") {
            if ($("#studentName").val() != "") {
                socket.emit("sessionJoin", {
                    name: $("#studentName").val(),
                    sessionID: $("#sID").val()
                });

            }
        }
    });
});