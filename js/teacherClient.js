
$(document).ready(function () {
    var socket = io();
    var studentsReady = 0;
    var readyList = [];
    var myName = sessionStorage.getItem("teacherName");
    var idToken = sessionStorage.getItem("userToken");

    var groups;
    var emailAdresses;
    var numStudents;
    // console.log(process);
    //temporary diversion to avoid tampering (by no means impossible)
    // sessionStorage.removeItem("teacherName");
    // sessionStorage.removeItem("userToken");

    // //just in case
    // sessionStorage.removeItem("studentName");

    if (!myName) {
        window.location.href = "/";
    }

    else {
        $("#teacherName").html(`Teacher Name: ${myName}`);
    }

    $("#teacherName").html(`Teacher Name: ${myName}`);
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

            else if (data.violation == false) { //must be explicitly false cuz .violation is not always defined
                $("#groupSizeViolation").html(`All groups have ${$("#groupSize").val()} students.`);
            }

            if (data.studentList) { //refresh student list (delete all and rebuild with additional data)
                $("#studentList").empty();
                data.studentList.forEach((student) => {
                    $("#studentList").append(`<li id="${student}">${student}</li>`);
                });

                if (data.studentList.length != 1) {
                    $("#numStudents").html(`<b>${data.studentList.length}</b> students joined.`);
                    numStudents = data.studentList.length;
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
        groups = data.groups;
        if (data.sessionID == mySessionID) {
            //actual group html creation 
            groups.forEach((group, index) => {
                $("#groupsList").append(`
                <h3>Group ${index + 1} </h3>
                <ul id="GroupList${index + 1}"></ul>
                `);

                group.forEach((person) => {
                    $(`#GroupList${index + 1}`).append(`<li>${person}</li>`);
                });
            });

            //prefrences adding
            data.prefs.forEach((studentPref) => {
                let student = studentPref[0];

                //build a string with the student prefrences
                let studentPrefString = studentPref[1].join().replace(",", ", ");
                let tdClass = "";

                //change background to green if that student was ready
                if (readyList.includes(student)) {
                    tdClass = "table-success";
                }

                $("studentPrefsList").css("display", "inline");
                //add the table data to the table
                $("#studentPrefsList").append(`
                    <tr>
                        <td class=${tdClass}>${student}</td>
                        <td class=${tdClass}>${studentPrefString}</td>
                    </tr>
                `);

                $("#studentList").css("display", "none");
                $("#studentListHeading").css("display", "none");
                document.getElementById("studentPrefsList").style = "display: inline;";
            });
        }
    });


    socket.on("getEmails", function (data) {
        if (data.sessionID == mySessionID) {
            emailAdresses = data.emails;
        }
    });

    $("#numberOfGroups").tooltip();
    $("#groupSize").tooltip();
    $("#maxSelections").tooltip();

    //copy button functionality
    $("#copy-button").tooltip();
    $('#copy-button').click(function() {
    var textArea = document.createElement("textarea");
    textArea.value = mySessionID;
    document.body.appendChild(textArea);       
    textArea.select();
    try {
        var success = document.execCommand('copy');
        if (success) {
            $("#copy-button").attr('data-original-title', "Copied!").tooltip('show');
            setTimeout(() => {$("#copy-button").removeAttr("data-original-title")}, 1000);
        } else {
            $("#copy-button").attr('data-original-title', "Copy with Ctrl-C").tooltip('show');
        }
    } catch (err) {
        $("#copy-button").attr('data-original-title', "Copy with Ctrl-C").tooltip('show');
    }

    textArea.remove();
    });

    $("#startSession").click(function () {
        if (mySessionID != "") {
            if ( ($("#groupSize").val() != "") ||  ($("#numberOfGroups").val() != "") ) { //if either field is filled
                if ($("#groupSize").val() >= 2) {
                    socket.emit("sessionCreate", {
                        sessionID: mySessionID,
                        groupSize: $("#groupSize").val(),
                        token: idToken
                    });
                }

                if ($("#numberOfGroups").val() >= 2) {
                    socket.emit("sessionCreate", {
                        sessionID: mySessionID,
                        numGroups: $("#groupSize").val(), 
                        token: idToken
                    });
                }


                // socket.emit("sessionCreate", {
                //     sessionID: mySessionID,
                //     groupSize: groupInfo, //if the group val is "" then so be it    
                //     token: idToken
                // });

                $("#sID").prop("disabled", true);
                $("#groupSize").prop("disabled", true);
                $("#startSession").css("display", "none");

                $("#sIDindicator").html("<b>Session ID: </b>" + mySessionID);
                $("#gSizeindicator").html("<b>Group Size: </b>" + $("#groupSize").val());


                $("#endSession").css("display", "inline");
                $("#copy-button").css("display", "inline");
                
                $("#sID").css("display", "none");


                toastr.success("Session Created");
            }

            
        }
    });

    $("#endSession").click(function () {
        socket.emit("endSession", {
            sessionID: mySessionID,
            disconnect: false,
            token: idToken
        });   

        console.log(idToken);
        $("#saveGroups").css("display", "inline");
        toastr.success(`Ended Session ID "${mySessionID}"`);
    });

    $("#saveGroups").click(function () {
        //format the csv so that it can be used to assign breakout rooms in Zoom
        //Add the recomended header to the csv data
        let csvData = [["Pre-assign Room Name", "Email Address"]];
        groups.forEach((group, groupIndex) => {
            group.unshift(`Group ${groupIndex+1}`); //add group name to each group

            for (let i = 1; i < group.length; i++) {
                //skip the very first element cuz it is the group name
                csvData.push([group[0], emailAdresses[group[i]]]);
            }
        });
    

        console.log(csvData);

        let csvContent = "data:text/csv;charset=utf-8," 
            + csvData.map(e => e.join(",")).join("\n");

        link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `${myName}_groups.csv`);
        link.click();
        link.remove();

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