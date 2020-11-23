
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
    var sessionEnded = false;

    var myMaxStudents;
    var selections = 0;


    // //prevents duplicate notifications from showing up (no trolling lol)
    // toastr.options = {
    //     "preventDuplicates": true,
    //     "preventOpenDuplicates": true
    // };


    socket.on("sessionReject", function(reason) {
        console.log(reason);
        if (reason == "invalidSessionID") {
            toastr.error("Invalid Session ID");
        }

        else if (reason == "duplicateLogin") {
            toastr.warning("Duplicate login blocked");
        }
    });

    socket.on("sessionSuccess", function(data) {
        toastr.success("Joined Session ID '" + data.sessionID + "'");
        mySessionID = data.sessionID;

        myMaxStudents = data.maxSelections;
        if (data.maxSelections == 1) { 
            $("#maxStudents").html(`Select a maximum of 1 student.`);
        }

        else {
            $("#maxStudents").html(`Select a maximum of ${myMaxStudents} students.`);
        }



        

    });

    socket.on("updateStudentList", function(data) { //data: sessionData, name, type
        if (mySessionID == data.sessionData[0]) {
            if (data.type == "add") {
                data.sessionData[2].forEach(studentName => {
                    console.log($(`input[name ="${studentName}"]`));
                    if (myName != studentName) {
                        if (!addedStudents.includes(studentName)){
                            $("#studentList").append(`
                            <input type="checkbox" id="${studentName}" name="${studentName}" value="${studentName}">
                            <label for="${studentName}" onclick="$(#${studentName}).prop( "checked", !$(#${studentName}).is(":checked") );">${studentName}</label><br>
                            `);
                            
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

            if (data.type == "remove") {
                $(`input[id="${data.name}"]`).remove();
                $(`label[for = "${data.name}"]`).remove();
            }
        }
    });

    socket.on("clientSessionEnd", function(data) { //data: sessionID, disconnect
        var sessionID = data.sessionID;
        if (mySessionID == sessionID) { //if this event is for me, the person that entered the session
            if (!data.disconnect) {
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
                    sessionEnded = true;
            }

            else { //this session was a result of teacher disconnect
                if (!sessionEnded) { //if the session has not already ended by normal means
                    toastr.info("Session aborted by teacher.");
                    setTimeout(function() { location.reload(); }, 1500);
                }
            }
        }


    });

    socket.on("GetGroups", function(data) {
        var groups = data.groups;
        if (data.sessionID == mySessionID) {
            groups.forEach((group, index) => {
                $("#groupsList").append(`
                <h3>Group ${index + 1} </h3>
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

    window.onunload = function() {
        socket.emit("sessionLeave", {
            name: myName,
            sessionID: $("#sID").val()
        })
    }

});

