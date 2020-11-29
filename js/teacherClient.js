
$(document).ready(function () {
    var socket = io();
    var studentsReady = 0;
    var readyList = [];
    var myName = sessionStorage.getItem("teacherName");
    var idToken = sessionStorage.getItem("userToken");

    //temporary diversion to avoid tampering (by no means impossible)
    sessionStorage.removeItem("teacherName");
    sessionStorage.removeItem("userToken");

    //just in case
    sessionStorage.removeItem("studentName");

    if (!myName) {
        window.location.href = "/";
    }

    else {
        $("#teacherName").html(`Teacher Name: ${myName}`);
    }

    
    //prevents duplicate notifications from showing up (no trolling lol)
    toastr.options = {
        "preventDuplicates": true,
        "preventOpenDuplicates": true
    };

    function arrayRemove(array, element) {
        var arrayCopy = JSON.parse(JSON.stringify(array));
        return arrayCopy.filter(elem => JSON.stringify(elem) != JSON.stringify(element)); //watch for json.stringify it doesnt actually compare the elements
    }

    function makeid(length) { //ty SO
        var result = "";
        var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
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


    socket.on("updateTeacherInfo", function (data) {
        if (data.sessionID == mySessionID) {
            if (data.violation) {
                $("#groupSizeViolation").html(`There will be a group with ${data.leftOver} students with the current student list.`);
            }

            else {
                $("#groupSizeViolation").html(`All groups have ${$("#groupSize").val()} students.`);
            }

            console.log("update");
            console.log(data.type);
            if (data.studentList) { //refresh student list (delete all and rebuild with additional data)
                $("#studentList").empty();
                data.studentList.forEach((student) => {
                    $("#studentList").append(`<li>${student}</li>`);
                });

                if (data.studentList.length != 1) {
                    $("#numStudents").html(`<b>${data.studentList.length}</b> students joined.`);
                }
                else if (data.studentList.length == 1) {
                    $("#numStudents").html("<b>1</b> student joined.");
                }

                if ($("#studentListHeading").html() == "" && data.studentList.length > 0) {
                    $("#studentListHeading").html("Students:");
                }

                //recolor any students who are ready
                readyList.forEach((readyStudent) => {
                    $(`li:contains(${readyStudent})`).css("color", "green");
                });

            }

            if (data.type == "readyUp") {
                studentsReady++;
                if (studentsReady != 1) {
                    $("#numStudentsReady").html(`<b>${studentsReady}</b> students ready.`);
                }

                else if (studentsReady == 1) {
                    $("#numStudentsReady").html("<b>1</b> student ready.");
                }

                $(`li:contains(${data.name})`).css("color", "green");
                readyList.push(data.name);
            }

            if (data.type == "studentLeave") {
                console.log("sad to see the leaving");
                console.log(readyList);
                if (readyList.includes(data.name)) { //if that student was previously ready
                    console.log("bruh");
                    readyList = arrayRemove(readyList, data.name);
                    studentsReady = studentsReady - 1;
                    if (studentsReady != 1) {
                        $("#numStudentsReady").html(`<b>${studentsReady}</b> students ready.`);
                    }

                    else if (studentsReady == 1) {
                        $("#numStudentsReady").html("<b>1</b> student ready.");
                    }
                }
            }
        }

    });

    socket.on("GetGroups", function (data) {
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

    $("#startSession").click(function () {
        if (mySessionID != "") {
            if ($("#groupSize").val() != "") {
                socket.emit("sessionCreate", {
                    sessionID: mySessionID,
                    groupSize: $("#groupSize").val(),
                    token: idToken
                });

                $("#sID").prop("disabled", true);
                $("#groupSize").prop("disabled", true);
                $("#startSession").css("display", "none");

                $("#sIDindicator").html("<b>Session ID: </b>" + mySessionID);
                $("#gSizeindicator").html("<b>Group Size: </b>" + $("#groupSize").val());

                toastr.success("Session Created");

                $("#endSession").css("display", "inline");
                $("#sID").css("display", "none");

            }
        }
    });

    $("#endSession").click(function () {
        socket.emit("endSession", {
            sessionID: mySessionID,
            disconnect: false,
            token: idToken
        });
        toastr.success(`Ended Session ID "${mySessionID}"`);
    });

    $("#Back").click(function () {
        window.location.href = '/';
    });

    document.getElementById("groupSize").addEventListener("change", function(){
        if (this.value <= 1) {
            this.value = 2;
        }
    });

    window.onunload = function () {
        socket.emit("endSession", {
            sessionID: mySessionID,
            disconnect: true,
            token: idToken
        });
        // $("#endSession").click();
    };
});