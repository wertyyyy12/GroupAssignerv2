var express = require("express");
var app = express();
// var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3001;

const { OAuth2Client } = require('google-auth-library');
const clientID = "984134543663-o74ijsk609uufcapnp6isnqi8eje8a2t.apps.googleusercontent.com"
const client = new OAuth2Client(clientID);

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientID,  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  return userid;
  // If request specified a G Suite domain:
  // const domain = payload['hd'];
}

var data = [];
//            sessionData              [0]  [1]      [2]      [3]       [4]
//data (each dataCell) is stored like [sID, g#, studentList, prefs, userActions]
function arrayRemove(array, element) {
  var arrayCopy = JSON.parse(JSON.stringify(array));
  return arrayCopy.filter(elem => JSON.stringify(elem) != JSON.stringify(element)); //watch for json.stringify it doesnt actually compare the elements
}

function findOptimum(groupSize, studentList, prefs) {

  function splitIntoGroups(groupSize, studentList) {
    var numGroups = Math.ceil(studentList.length / groupSize);
    var splitGroups = [];
    for (var i = 0; i < numGroups; i++) {
      splitGroups.push([]);
    }

    var j = 0;
    for (var i = 0; i < studentList.length; i++) {
      if (splitGroups[j].length >= groupSize) {
        j++;
      }
      splitGroups[j].push(studentList[i]);
    }

    return splitGroups;
  }


  function findWanting(person, prefs) { //find who wants a certain person in their group
    var people = [];
    prefs.forEach((pref) => {
      var student = pref[0];
      var studentPrefs = pref[1];

      if (studentPrefs.includes(person)) {
        people.push(student);
      }
    });

    return people;

  }

  function findStudentPrefs(student, prefs) {
    var studentPrefs = false;
    prefs.forEach((pref) => {
      if (pref[0] == student) {
        studentPrefs = pref;
      }
    });

    return studentPrefs;
  }

  function swapTwoPeople(sG, studentA, studentB) {

    var splitGroups = JSON.parse(JSON.stringify(sG));
    var Agroup = splitGroups.find(group => group.includes(studentA));
    var Bgroup = splitGroups.find(group => group.includes(studentB));

    if (Agroup == Bgroup) {
      return splitGroups;
    }

    var Aindex = splitGroups.indexOf(Agroup);
    var Bindex = splitGroups.indexOf(Bgroup);


    Agroup = arrayRemove(Agroup, studentA); //remove the students from their groups
    Bgroup = arrayRemove(Bgroup, studentB);

    Bgroup.push(studentA); //shove them in different groups
    Agroup.push(studentB);

    splitGroups[Aindex] = Agroup;
    splitGroups[Bindex] = Bgroup;

    return splitGroups;
  }

  var splitGroups = splitIntoGroups(groupSize, studentList);
  for (var i = 0; i < 2; i++) {
    prefs.forEach((pref) => {
      var student = pref[0];
      var studentPrefs = pref[1];
      var studentGroup = splitGroups.find(group => group.includes(student));

      studentPrefs.forEach((person) => {
        var personGroup = splitGroups.find(group => group.includes(person));

        //the person wants a swap; "student" wants to be in "person""s group | "student" may swap with "swapPerson" in order to do so
        var swapPeople = arrayRemove(personGroup, person);

        swapPeople.forEach((swapPerson) => { //for every person to swap with
          var gain = 0;
          //student -> A, swapPerson -> B 
          //A group = studentGroup, B group = personGroup (same as swap group)
          //Aprefs = studentPrefs, Bprefs = Bprefs
          var wantingA = findWanting(student, prefs);
          var wantingB = findWanting(swapPerson, prefs);
          var Bprefs = findStudentPrefs(swapPerson, prefs)[1];

          personGroup.forEach((Bperson) => {
            if (wantingB.includes(Bperson)) { //someone in B"s group wanted B
              gain--;
            }

            if (wantingA.includes(Bperson)) { //somone in B"s group wants A
              gain++;
            }

            if (Bprefs.includes(Bperson)) { //B wanted someone in group B
              gain--;
            }

            if (studentPrefs.includes(Bperson)) { //A wants someone in B group
              gain++;
            }
          });

          studentGroup.forEach((Aperson) => {
            if (wantingA.includes(Aperson)) { //someone in A"s group wanted A
              gain--;
            }

            if (wantingB.includes(Aperson)) { //somone in A"s group wants B
              gain++;
            }

            if (studentPrefs.includes(Aperson)) { //A wanted someoen in their group
              gain--;
            }

            if (Bprefs.includes(Aperson)) { //B wants someone in A group
              gain++;
            }
          });

          if (gain > 0) {
            splitGroups = swapTwoPeople(splitGroups, swapPerson, student);
            //swap
          }

          // studentGroup.forEach((Aperson) => {
          //   if (wantingA.includes(Aperson)) { //someone in A"s group wanted A
          //     gain--;
          //   }
          // });

        });

      });
    });
  }

  if (splitGroups[splitGroups.length - 1].length < 2) {
    splitGroups[splitGroups.length - 2].push(splitGroups[splitGroups.length - 1][0]);
    splitGroups.pop();
  }
  return splitGroups;
}

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});


app.use(express.static(__dirname + "/html"));
app.use("/html", express.static(__dirname + "/html"));

app.use(express.static(__dirname + "/js"));
app.use("/js", express.static(__dirname + "/js"));

function findElementInArray(array, desiredElement, subIndex) {
  var found = false;
  array.forEach(function (element) {
    if (subIndex === undefined) {
      if (element == desiredElement) {
        found = element;
      }
    }

    else {
      if (element[subIndex] == desiredElement) {
        found = element;
      }
    }
  });
  return found;
}

io.on("connection", (socket) => {
  console.log("User connected.");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("sessionCreate", (teacherData) => {
    var templateUserActions = {
      //tracks who has done what action (w/ subject IDs from tokens)
      "sessionJoin": [],
      "studentSendData": [],
      "sessionLeave": [],
      "studentReady": [],
      //only person authorized to do teacher actions
      "teacher": []
    }
    data.push([teacherData.sessionID, teacherData.groupSize, [], [], templateUserActions]);
  });

  socket.on("sessionJoin", (studentData) => {
    var sessionData = findElementInArray(data, studentData.sessionID, 0); //find sessionID in data at [0] of element
    if (sessionData) {
      verify(studentData.token).then((userID) => {
        if (userID && !sessionData[4]["sessionJoin"].includes(userID)) { //if (the result of the validation returned a userID) AND (sessionJoin array doesnt already have the user in it)
          sessionData[2].push(studentData.name);
          sessionData[4]["sessionJoin"].push(userID);
          console.log(userID);
          socket.emit("sessionSuccess", {
            sessionID: studentData.sessionID,
            maxSelections: Math.ceil(sessionData[1] / 2)
          });
          io.emit("updateStudentList", {
            sessionData: sessionData,
            name: studentData.name,
            type: "add"
          });

          socket.broadcast.emit("updateTeacherInfo", { //tells teachers to update student leftover counters
            studentList: sessionData[2],
            sessionID: studentData.sessionID
          });

          var leftOverStudents = sessionData[2].length % sessionData[1];
          if (leftOverStudents != 0) {
            if (sessionData[2].length >= sessionData[1]) {
              var violationGroupSize;
              if (leftOverStudents == 1) {
                violationGroupSize = parseInt(sessionData[1]) + 1;
              }

              else if (leftOverStudents > 1) {
                violationGroupSize = leftOverStudents;
              }

              socket.broadcast.emit("updateTeacherInfo", { //tells teachers to update student leftover counters
                violation: true,
                sessionID: studentData.sessionID,
                leftOver: violationGroupSize
              });
            }
          }

          else {
            socket.broadcast.emit("updateTeacherInfo", {
              violation: false,
              sessionID: studentData.sessionID
            });
          }


        }
      }).catch(() => {
        socket.emit("sessionReject", "invalidUser");
      });
    }

    else {
      socket.emit("sessionReject", "invalidSessionID");
    }
  });

  socket.on("endSession", (sentData) => {
    console.log(`ending session ${sentData.sessionID}`);
    var sessionID = sentData.sessionID;
    var sessionData = findElementInArray(data, sessionID, 0);
    if (!sentData.disconnect) { //we dont want to tell the other students that the session has ended if their teacher disconnected.
      io.emit("clientSessionEnd", {
        sessionID: sessionID,
        disconnect: false
      });
    }

    else {
      if (sentData.disconnect || sessionData[2].length == 0) { //clear that session if disconncected OR no students
        data = arrayRemove(data, sessionData);
      }

      io.emit("clientSessionEnd", {
        sessionID: sessionID,
        disconnect: true
      });
    }
  });

  socket.on("studentSendData", (sentData) => {
    var sessionData = findElementInArray(data, sentData.sessionID, 0);

    verify(sentData.token).then()
    sessionData[3].push(sentData.prefs);

    if (sessionData[3].length == sessionData[2].length) { //all student data has arrived
      if (sessionData[3].length > 1) {
        io.emit("GetGroups", {
          sessionID: sessionData[0],
          groups: findOptimum(sessionData[1], sessionData[2], sessionData[3])
        });
      }
      data = arrayRemove(data, sessionData);
    }

    else {
      console.log("data not ready.");
    }
  });

  socket.on("validateSessionID", (sessionID) => {
    var flag = false; //is this sID a duplicate?
    data.forEach((dataCell) => {
      if (dataCell[0] == sessionID) {
        flag = true;
      }
    });

    if (!flag) {
      socket.emit("sIDvalidationResult", true); //true = yes, this sessionID is fine
    }

    else {
      socket.emit("sIDvalidationResult", false); //false -> no, this sessionID is a duplicate
    }
  });

  socket.on("sessionLeave", (studentData) => { //for students who disconnect while inside a session
    var sessionData = findElementInArray(data, studentData.sessionID, 0);
    if (sessionData) {
      sessionData[2] = arrayRemove(sessionData[2], studentData.name);
    }

    io.emit("updateStudentList", {
      sessionData: sessionData,
      name: studentData.name,
      type: "remove"
    });

    socket.broadcast.emit("updateTeacherInfo", {
      sessionID: studentData.sessionID,
      studentList: sessionData[2],
      type: "studentLeave"
    });
  });

  socket.on("studentReady", (studentData) => { //when a student ready up
    socket.broadcast.emit("updateTeacherInfo", {
      sessionID: studentData.sessionID,
      name: studentData.name,
      type: "readyUp"
    });
  });


});


