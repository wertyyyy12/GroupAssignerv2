$(document).ready(function(){
    var socket = io();
    var mySessionID = $("#sID").val();

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
        toastr.success(`Ended Session ID "${$("#sID").val()}"`);
    });
    
    $("#Back").click(function() {
        window.location.href = '/';
    });
});