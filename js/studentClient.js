$(document).ready(function(){
    var socket = io();
    var mySessionID;
    var myName;
    var sessionData;

    socket.on("sessionReject", function() {
        toastr.error("Invalid Session ID");
    });

    socket.on("sessionSuccess", function(sessionID) {
        toastr.success("Joined Session ID '" + sessionID + "'");
        mySessionID = $("#sID").val();
        myName = $("#studentName").val();
    });

    socket.on("GetReply", function(retrievedSessionData) {
        console.log(retrievedSessionData);
        sessionData = retrievedSessionData;
        console.log(sessionData);

        $("#studentList").html("");
        sessionData[2].forEach(studentName => { 
            $("#studentList").append(`
            <input type="checkbox" name="${studentName}" value="${studentName}">
            <label for="${studentName}">${studentName}</label><br>
            `);
        });
    });

    socket.on("updateStudentList", function(studentData) {
        if (mySessionID == studentData.sessionID) {
            // if (myName != studentData.name) {
                socket.emit("Get", mySessionID);
                $("#joinSession").prop("disabled", true);
            // }

        }

        else {
            toastr.error("uh oh lks");
        }
    });

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