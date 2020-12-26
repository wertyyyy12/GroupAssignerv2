
$(document).ready(function () {
    // $("#hi").html(sessionStorage.getItem("studentName"));
    let myName = sessionStorage.getItem("studentName");
    let idToken = sessionStorage.getItem("userToken");

    //makes tampering with these values a fair bit harder; not impossible though
    // sessionStorage.removeItem("userToken");
    // sessionStorage.removeItem("studentName");

    // //jsut in case
    // sessionStorage.removeItem("teacherName");

    if (!myName) {
        window.location.href = "/";
    }

    else {
        $("#studentName").html(`Name: ${myName}`);
    }

    $("#studentName").html(`Name: ${myName}`); //remove on prod
    var socket = io();
    let mySessionID;

    let addedStudents = [];
    let sessionEnded = false;
    let ready = false;
    let inSession = false;

    let myMaxStudents;
    let selections = 0;


    // //prevents duplicate notifications from showing up (no trolling lol)
    // toastr.options = {
    //     "preventDuplicates": true,
    //     "preventOpenDuplicates": true
    // };

    function arrayRemove(array, element) {
        let arrayCopy = JSON.parse(JSON.stringify(array));
        return arrayCopy.filter(elem => JSON.stringify(elem) != JSON.stringify(element)); //watch for json.stringify it doesnt actually compare the elements
    }

    socket.on("sessionReject", function (reason) {
        switch (reason) {
            case "invalidSessionID":
                toastr.error("Invalid Session ID");
                break;
            case "duplicateLogin":
                toastr.warning("Duplicate login blocked");
                break;
            case "invalidUserAction":
                toastr.warning("Invalid User Action");
                break;
            case "invalidPrefs":
                toastr.warning("Prefrences rejected");
        }
        // if (reason == "invalidSessionID") {
        //     toastr.error("Invalid Session ID");
        // }

        // else if (reason == "duplicateLogin") {
        //     toastr.warning("Duplicate login blocked");
        // }

        // else if (reason == "invalidUserAction") {
        //     toastr.warning("Invalid User Action");
        // }

    });

    socket.on("sessionSuccess", function (data) {
        toastr.success("Joined Session ID '" + data.sessionID + "'");
        mySessionID = data.sessionID;
        inSession = true;

        myMaxStudents = data.maxSelections;
        if (data.maxSelections == 1) {
            $("#maxStudents").html(`Select a maximum of 1 student.`);
        }

        else {
            $("#maxStudents").html(`Select a maximum of ${myMaxStudents} students.`);
        }

        $("#selectionReady").css("display", "inline");



    });

    socket.on("updateStudentList", function (data) { //data: sessionData, name, type
        if (data.type == "add") {
            console.log("adding student list: ")
            console.log(data.sessionData.studentList);
            data.sessionData.studentList.forEach(studentName => {
                if (myName != studentName) {
                    if (!addedStudents.includes(studentName)) {
                        $("#studentList").append(`
                            <input type="checkbox" id="${studentName}" name="${studentName}" value="${studentName}">
                            <label for="${studentName}" onclick="$(#${studentName}).prop( "checked", !$(#${studentName}).is(":checked") );">${studentName}</label><br>
                            `);

                        if (ready) {
                            document.getElementById(`${studentName}`).disabled = true;
                        }

                        document.getElementById(`${studentName}`).addEventListener("click", function () { //for some reason the jquery equivalent starts acting up when i give it this so 

                            if (this.checked) {
                                selections++;
                                if (selections > myMaxStudents) {
                                    this.checked = false;
                                    toastr.warning("Max student selections reached");
                                    selections--;
                                }
                            }

                            else if (!this.checked) {
                                selections--;
                            }


                        });
                        addedStudents.push(studentName);
                    }

                    else {
                        console.log("student already addded");
                        console.log(addedStudents);
                    }
                }

                else {
                    console.log("skipped over my own name: " + myName);
                }
            });

            // socket.emit("Get", mySessionID);
            //asdasdasdasd
            $("#joinSession").prop("disabled", true);
        }

        if (data.type == "remove") {
            $(`input[id="${data.name}"]`).remove();
            $(`label[for = "${data.name}"] + br`).remove(); //remove the br after the label cuz apparently that is there
            $(`label[for = "${data.name}"]`).remove();

            addedStudents = arrayRemove(addedStudents, data.name);
        }

    });

    socket.on("clientSessionEnd", function (data) { //data: sessionID, disconnect
        if (!data.disconnect) {
            let myPrefs = []; //prepare to send data to server
            $("input[type=checkbox]").each(function () {
                if ($(this).is(":checked")) {
                    myPrefs.push($(this).val());
                }
            });
            socket.emit("studentSendData", {
                prefs: [myName, myPrefs],
                sessionID: mySessionID,
                token: idToken
            });
            toastr.info("This session has ended.");
            sessionEnded = true;
            $("#studentList").empty();
            $("#maxStudents").empty();
            $("#selectionReady").prop("disabled", true);
        }

        else { //this session was a result of teacher disconnect
            if (!sessionEnded) { //if the session has not already ended by normal means
                toastr.info("Session aborted by teacher.");
                setTimeout(function () { location.reload(); }, 1500);
            }
        }



    });

    socket.on("GetGroups", function (data) {
        let groups = data.groups;
        groups.forEach((group, index) => {
            $("#groupsList").append(`
                <div id="GroupList${index + 1}div" style="display: inline-block; padding: 7px;">
                <h3 id="GroupList${index + 1}heading">Group ${index + 1} </h3>
                <ul id="GroupList${index + 1}"></ul>
                </div>
                `);

            group.forEach((person) => {
                $(`#GroupList${index + 1}`).append(`<li>${person}</li>`);
                if (person == myName) {
                    $(`#GroupList${index + 1}`).css("color", "green");
                    $(`#GroupList${index + 1}`).parent().css("border", "1px solid green");

                    $(`#GroupList${index + 1}heading`).css("color", "green");
                }
            });
        });

    });


    $("#joinSession").click(function () {
        if ($("#sID").val() != "") {
            if (myName != "") {
                socket.emit("sessionJoin", {
                    sessionID: $("#sID").val(),
                    token: idToken
                });
            }
        }
    });

    $("#selectionReady").click(function () {
        $("#selectionReady").prop("disabled", true); //disable the button itself
        socket.emit("studentReady", { //tell the server to tell the teacher that the student is ready
            sessionID: mySessionID,
            token: idToken
        });

        $("input[type=checkbox]").each(function () {
            $(this).prop("disabled", true);
            if ($(this).is(":checked")) {
                let checkedLabel = $(`label[for="${$(this).attr("id")}"]`)
                checkedLabel.css("color", "green");
                checkedLabel.css("font-weight", "bold");
            }
        });

        ready = true;

    });



    window.onunload = function () {
        if (inSession) {
            socket.emit("sessionLeave", {
                sessionID: $("#sID").val(),
                token: idToken
            });
        }
    }

});

