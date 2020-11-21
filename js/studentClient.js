
function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    myName = profile.getName();
    document.getElementById("hi").innerHTML = myName;
}


$(document).ready(function(){
    // $("#hi").html(localStorage.getItem("studentName"));
    var myName = localStorage.getItem("studentName");
    $("#studentName").html(`Name: ${myName}`);

    var socket = io();
    var mySessionID;
    var sessionData;


    //prevents duplicate notifications from showing up (no trolling lol)
    toastr.options = {
        "preventDuplicates": true,
        "preventOpenDuplicates": true
    };


    socket.on("sessionReject", function() {
        toastr.error("Invalid Session ID");
    });

    socket.on("sessionSuccess", function(sessionID) {
        toastr.success("Joined Session ID '" + sessionID + "'");
        mySessionID = $("#sID").val();
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

    socket.on("GetGroups", function(data) {
        var groups = data.groups;
        if (data.sessionID == mySessionID) {
            groups.forEach((group, index) => {
                $("#groupsList").append(`
                <h3>Group ${index + 1}: </h3>
                <ul id="GroupList${index + 1}"></ul>
                `);

                group.forEach((person) => {
                    $(`#GroupList${index + 1}`).append(`<li>${person}</li>`);
                });
            });
        }
    });


    $("#joinSession").click(function() {
        if ($("#sID").val() != "") {
            if (myName != "") {
                socket.emit("sessionJoin", {
                    name: localStorage.getItem("studentName"),
                    sessionID: $("#sID").val()
                });
            }
        }
    });

});

