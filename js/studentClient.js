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

    socket.on("updateStudentList", function(retrieved) {
        if (mySessionID == retrieved.SessionData[0]) {
            retrieved.SessionData[2].forEach(studentName => {
                if (myName != studentName) {
                    if ($(`#${studentName}`).get().length == 0){
                        $("#studentList").append(`
                        <input type="checkbox" id="${studentName}" name="${studentName}" value="${studentName}">
                        <label for="${studentName}" onclick="$(#${studentName}).prop( "checked", !$(#${studentName}).is(":checked") );">${studentName}</label><br>
                        `);
                        console.log($(`#${studentName}`));
                    }
                }
            });

            // socket.emit("Get", mySessionID);
            //asdasdasdasd
            $("#joinSession").prop("disabled", true);

        }
    });

    socket.on("clientSessionEnd", function(sessionID) {
        if (mySessionID == sessionID) {
            var myPrefs = [];
            $("input[type=checkbox]").each(function() {
                if ($(this).is(":checked")) {
                    myPrefs.push($(this).val());
                }
            });

            console.log(myPrefs);
            socket.emit("studentSendData", {
                prefs: [myName, myPrefs],
                sessionID: mySessionID
            });
            toastr.info("This session has ended.");

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