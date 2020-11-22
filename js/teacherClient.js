
$(document).ready(function(){
    var socket = io();
    
    //prevents duplicate notifications from showing up (no trolling lol)
    toastr.options = {
        "preventDuplicates": true,
        "preventOpenDuplicates": true
    };

    function makeid(length) { //ty SO
        var result           = '';
        var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;

    }

    var mySessionID = makeid(7);
    socket.emit("validateSessionID", mySessionID);

    socket.on("sIDvalidationResult", (result) => {
        if (result) { //if that sessionID was not a duplicate
            $("#sID").html(`Session ID: ${mySessionID}`);
        }

        else {
            mySessionID = makeid(7);  //otherwise, try making a new one and see if that works
            socket.emit("validateSessionID", mySessionID);
        }
    });


    socket.on("potentialViolation", function(data) {
        if (data.violation) {
            if (data.sessionID == mySessionID) {
                $("#groupSizeViolation").html(`There will be a group with ${data.leftOver} students with the current student list.`);
            }
        }

        else {
            $("#groupSizeViolation").html(`All groups have ${$("#groupSize").val()} students.`);
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

    $("#startSession").click(function() {
        if (mySessionID != "") {
            if ($("#groupSize").val() != "") {
                socket.emit("sessionCreate", {
                    sessionID: mySessionID,
                    groupSize: $("#groupSize").val()
                });
                
                $("#sID").prop("disabled", true);
                $("#groupSize").prop("disabled", true);
                $("#startSession").css("display", "none");

                $("#sIDindicator").html("<b>Session ID: </b>" + mySessionID);
                $("#gSizeindicator").html("<b>Group Size: </b>" + $("#groupSize").val());

                toastr.success("Session Created");

                $("#endSession").css("display", "inline");

            }
        }
    });

    $("#endSession").click(function() {
        socket.emit("endSession", {
            sessionID: mySessionID,
            disconnect: false
        });
        toastr.success(`Ended Session ID "${mySessionID}"`);
    });
    
    $("#Back").click(function() {
        window.location.href = '/';
    });

    window.onbeforeunload = function(){
        socket.emit("endSession", {
            sessionID: mySessionID,
            disconnect: true
        });
        // $("#endSession").click();
    };
});