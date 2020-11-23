
function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    myName = profile.getName();
}



$(document).ready(function(){
    // $("#hi").html(localStorage.getItem("studentName"));
    var myName = localStorage.getItem("studentName");
    $("#studentName").html(`Name: ${myName}`);

    var socket = io();
    var mySessionID;

    var sessionData;
    var addedStudents = [];

    var myMaxStudents;
    var selections = 0;


    // //prevents duplicate notifications from showing up (no trolling lol)
    // toastr.options = {
    //     "preventDuplicates": true,
    //     "preventOpenDuplicates": true
    // };


    socket.on("sessionReject", function() {
        toastr.error("Invalid Session ID");
    });

    socket.on("sessionSuccess", function(data) {
        toastr.success("Joined Session ID '" + data.sessionID + "'");
        mySessionID = data.sessionID;

        myMaxStudents = data.maxSelections;
        $("#maxStudents").html(`Select a maximum of ${data.maxSelections} students.`);

    });

    socket.on("updateStudentList", function(retrieved) {
        if (mySessionID == retrieved.SessionData[0]) {
            retrieved.SessionData[2].forEach(studentName => {
                console.log($(`input[name ="${studentName}"]`));
                if (myName != studentName) {
                    if (!addedStudents.includes(studentName)){
                        $("#studentList").append(`
                        <input type="checkbox" id="${studentName}" name="${studentName}" value="${studentName}">
                        <label for="${studentName}" onclick="$(#${studentName}).prop( "checked", !$(#${studentName}).is(":checked") );">${studentName}</label><br>
                        `);

                        console.log(document.getElementById(`${studentName}`));
                        
                        document.getElementById(`${studentName}`).addEventListener("click", function() {

                            if (this.checked) {
                                selections++;
                                if (selections > myMaxStudents) {
                                    this.checked = false;
                                    toastr.warning("Max student selections reached");
                                    selections--;
                                }
                            }

                            else if (!this.checked){
                                selections--;   
                            }

                           

                            
                        });
                        addedStudents.push(studentName);
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
            var myPrefs = []; //prepare to send data to server
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
                    name: myName,
                    sessionID: $("#sID").val()
                });
            }
        }
    });

    window.onbeforeunload = function() {
        socket.emit("sessionLeave", {
            name: myName,
            sessionID: $("#sID").val()
        })
    }

});

