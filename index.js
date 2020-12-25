const { rejects } = require("assert");
const { group } = require("console");
var express = require("express");
var app = express();
// let path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3001;

const { OAuth2Client } = require('google-auth-library');
const clientID = "984134543663-o74ijsk609uufcapnp6isnqi8eje8a2t.apps.googleusercontent.com"
const client = new OAuth2Client(clientID);

async function verify(token, type) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientID,  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  const userid = payload['sub'];
  const username = payload['name'];
  const email = payload['email'];
  // If request specified a G Suite domain:
  
  // if (type == "student") {
  //   const domain = payload['hd'];
  //   if (domain != "my.cuhsd.org") {
  //     throw Invalid_Domain;
  //   }
  // }

  return {
    userID: userid, 
    name: username,
    email: email
  };
}

let data = [];

/*
data (each dataCell) is stored like

  {
    sessionID: *alpha numeric code*,
    groupSize: [may not always exist] *number*,
    numGroups: [may not always exist] *number*,
    studentList: *array*,
    prefs: *array*,
    userActions: *dictionary*,
    emailAddresses: *dictionary*,
    maxSelections: *number*
  }

*/

//utility functions (usually for array manupulation)
function arrayRemove(array, element) {
  let arrayCopy = JSON.parse(JSON.stringify(array));
  return arrayCopy.filter(elem => JSON.stringify(elem) != JSON.stringify(element)); //watch for json.stringify it doesnt actually compare the elements
}

//finds if there is a duplicate
function checkDuplicates(array) {
  //stores all the values
  let bank = {};

  for(let i = 0; i <= array.length; i++) {
      // If the key is empty it fills it
      // If the key isnt empty then we found a duplicate
      if (!bank[array[i]] === undefined) {
          bank[array[i]] = 1;
      } else {
          return true;
      }
  }
  return false;
}

/*
constraintType can be either:
"groupSize": the number of people in each group
"numGroups": the total number of groups to be formed
*/
function findOptimum(constraintType, constraint, studentList, prefs) {

  function splitIntoGroups(constraintType, constraint, studentList) {
      let groupSize;
      let numGroups;
      if (constraintType == "groupSize") {
          groupSize = constraint;
          numGroups = Math.ceil(studentList.length / groupSize);
      }

      if (constraintType == "numGroups") {
          groupSize = Math.ceil(studentList.length / constraint);
          numGroups = constraint;
      }



      let splitGroups = [];

      for (let i = 0; i < numGroups; i++) {
          splitGroups.push([]);
      }

      let j = 0;
      for (let i = 0; i < studentList.length; i++) {
          if (splitGroups[j].length >= groupSize) {
              j++;
          }
          splitGroups[j].push(studentList[i]);
      }

      return splitGroups;
  }


  function findWanting(person, prefs) { //find who wants a certain person in their group
      let people = [];
      prefs.forEach((pref) => {
          let student = pref[0];
          let studentPrefs = pref[1];

          if (studentPrefs.includes(person)) {
              people.push(student);
          }
      });

      return people;

  }

  function findStudentPrefs(student, prefs) {
      let studentPrefs = false;
      prefs.forEach((pref) => {
          if (pref[0] == student) {
              studentPrefs = pref;
          }
      });

      return studentPrefs;
  }

  function swapTwoPeople(sG, studentA, studentB) {

      let splitGroups = JSON.parse(JSON.stringify(sG));
      let Agroup = splitGroups.find(group => group.includes(studentA));
      let Bgroup = splitGroups.find(group => group.includes(studentB));

      if (Agroup == Bgroup) {
          return splitGroups;
      }

      let Aindex = splitGroups.indexOf(Agroup);
      let Bindex = splitGroups.indexOf(Bgroup);


      Agroup = arrayRemove(Agroup, studentA); //remove the students from their groups
      Bgroup = arrayRemove(Bgroup, studentB);

      Bgroup.push(studentA); //shove them in different groups
      Agroup.push(studentB);

      splitGroups[Aindex] = Agroup;
      splitGroups[Bindex] = Bgroup;

      return splitGroups;
  }

  function shuffleArray(array) {
      let arrayCopy = array.slice(0);
      for (let i = arrayCopy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
      }

      return arrayCopy;
  }

  function evaluateGroupSet(groups, prefs) {
      let cost = 0; //# of student prefrences NOT fulfilled
      let numPrefrences = 0;
      prefs.forEach((pref) => {

          let student = pref[0];
          let studentGroup = groups.find(group => group.includes(student));
          pref[1].forEach((person) => {
              numPrefrences++;
              if (!studentGroup.includes(person)) {
                  cost++;
              }
          });

      });

      return {
          cost: cost,
          numPrefrences: numPrefrences
      };
  }


  //MAIN LOOP
  let bestCost = 9999;
  let bestGroup;
  let numPrefrences;
  for (let j = 0; j <= studentList.length * 2; j++) {
      let randStudentList = shuffleArray(studentList);
      splitGroups = splitIntoGroups(constraintType, constraint, randStudentList);
      for (let i = 0; i < 2; i++) { //twice for good measure
          prefs.forEach((pref) => { //for every student prefrence
              let student = pref[0];
              let studentPrefs = pref[1];
              let studentGroup = splitGroups.find(group => group.includes(student));

              studentPrefs.forEach((person) => {
                  let personGroup = splitGroups.find(group => group.includes(person));

                  //the person wants a swap; "student" wants to be in "person""s group | "student" may swap with "swapPerson" in order to do so
                  let swapPeople = arrayRemove(personGroup, person);

                  swapPeople.forEach((swapPerson) => { //for every person to swap with
                      let gain = 0;
                      //student -> A, swapPerson -> B 
                      //A group = studentGroup, B group = personGroup (same as swap group)
                      //Aprefs = studentPrefs, Bprefs = Bprefs
                      let wantingA = findWanting(student, prefs);
                      let wantingB = findWanting(swapPerson, prefs);
                      let Bprefs = findStudentPrefs(swapPerson, prefs)[1];

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

                          if (studentPrefs.includes(Aperson)) { //A wanted someone in their group
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



      if (splitGroups[splitGroups.length - 1].length < 2) { //shove a lone student into a group
          if (splitGroups[splitGroups.length - 1][0]) { //this will happen if numGroups > studentList.length (aka troll input)
              splitGroups[splitGroups.length - 2].push(splitGroups[splitGroups.length - 1][0]);
              splitGroups.pop();
          }
      }

      splitGroups = splitGroups.filter(group => group.length > 0); //filter out any empty groups

      let evaluationData = evaluateGroupSet(splitGroups, prefs);
      groupCost = evaluationData.cost;
      numPrefrences = evaluationData.numPrefrences;
      if (groupCost < bestCost) {
          bestCost = groupCost;
          bestGroup = splitGroups;
      }

  }

  return {
      best: bestGroup,
      cost: bestCost,
      numPrefs: numPrefrences
  };
}


server.listen(port, () => {
  console.log("Server listening at port %d", port);
});


app.use(express.static(__dirname + "/html"));
app.use("/html", express.static(__dirname + "/html"));

app.use(express.static(__dirname + "/js"));
app.use("/js", express.static(__dirname + "/js"));

function findSessionByID(data, sessionID) {
  return data.find(session => session.sessionID == sessionID);
}

io.on("connection", (socket) => {
  console.log("User connected.");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("sessionCreate", (teacherData) => {
    verify(teacherData.token).then((payload) => {
      let templateUserActions = {
        //tracks who has done what action (w/ subject IDs from tokens)
        "sessionJoin": [],
        "studentSendData": [],
        "sessionLeave": [],
        "studentReady": [],
        //only person authorized to do teacher actions
        "teacher": payload.userID
      }
      console.log("teacher set as " + payload.userID);

      newSessionData = {
        sessionID: teacherData.sessionID,
        studentList: [],
        prefs: [],
        emailAddresses: {}, 
        userActions: templateUserActions,
        maxSelections: teacherData.maxSelections
      };


      if (teacherData.groupSize >= 2) {
        newSessionData.groupSize = teacherData.groupSize;
        data.push(newSessionData);
      }
      else if (teacherData.numGroups >= 2) {
        newSessionData.numGroups = teacherData.numGroups;
        data.push(newSessionData);
      }

      else {
        console.log("teacher didnt enter group size OR a num Groups??");
      }
    }).catch(() => {
      console.log("invalid teacher attempt");
    });
  });

  socket.on("sessionJoin", (studentData) => {
    let sessionData = findSessionByID(data, studentData.sessionID); //find sessionID in data at [0] of element)
    if (sessionData) {
      verify(studentData.token, "student").then((payload) => {
        if (!sessionData.userActions["sessionJoin"].includes(payload.userID)) { //if (sessionJoin array doesnt already have the user in it)
          sessionData.studentList.push(payload.name);
          sessionData.userActions.sessionJoin.push(payload.userID);
          sessionData.userActions.sessionLeave = arrayRemove(sessionData.userActions.sessionLeave, payload.userID);

          console.log("student user ID " + payload.userID + " joined");
          socket.emit("sessionSuccess", {
            sessionID: studentData.sessionID,
            maxSelections: sessionData.maxSelections
          });
          io.emit("updateStudentList", {
            sessionData: sessionData,
            name: payload.name,
            type: "add"
          });

          sessionData.emailAddresses[`${payload.name}`] = payload.email;
          socket.broadcast.emit("updateTeacherInfo", { //tells teachers to update student leftover counters
            studentList: sessionData.studentList,
            sessionID: studentData.sessionID
          });

          let leftOverStudents = sessionData.studentList.length % sessionData.groupSize;
          if (leftOverStudents != 0) {
            if (sessionData.studentList.length >= sessionData.groupSize) {
              let violationGroupSize;
              if (leftOverStudents == 1) {
                violationGroupSize = parseInt(sessionData.groupSize) + 1;
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

        else {
          socket.emit("sessionReject", "duplicateLogin");
          console.log("session rejected for duplicate login!");
        }
      }).catch((err) => {
        socket.emit("sessionReject", "invalidUserAction");
        console.log("session rejected: invalid action (after dlogin)");
      });
    }

    else {
      socket.emit("sessionReject", "invalidSessionID");
      console.log("invalid session ID attempt");
    }
  });

  socket.on("endSession", (teacherData) => {
    let sessionID = teacherData.sessionID;
    let sessionData = findSessionByID(data, sessionID);
    verify(teacherData.token).then((payload) => {
      if (sessionData.userActions.teacher == payload.userID) {
        console.log(`ending session ${teacherData.sessionID}`);

        socket.emit("getEmails", {
          sessionID: sessionID,
          emails: sessionData.emailAddresses
        });

        if (!teacherData.disconnect) { //we dont want to tell the other students that the session has ended if their teacher disconnected.
          io.emit("clientSessionEnd", {
            sessionID: sessionID,
            disconnect: false
          });
        }

        else {
          if (teacherData.disconnect || sessionData.studentList.length == 0) { //clear that session if disconncected OR no students
            data = arrayRemove(data, sessionData);
          }

          io.emit("clientSessionEnd", {
            sessionID: sessionID,
            disconnect: true
          });
        }
      }
    }).catch(() => {
      console.log("invalid teacher action");
    });
  });

  socket.on("studentSendData", (sentData) => {
    let sessionData = findSessionByID(data, sentData.sessionID);
    if (sessionData) {
      verify(sentData.token, "student").then((payload) => {
        let currentActionArray = sessionData.userActions.studentSendData;
        if (!currentActionArray.includes(payload.userID)) {
          let invalidPrefs = !checkDuplicates(sentData.prefs[1]); //will initialize "invalidPrefs" to false if there are no duplicates in array
          if (!invalidPrefs) {
            sentData.prefs[1].forEach((pref) => {
              if (!sessionData.studentList.includes(pref)) { //checking if student selections actually exist
                console.log("DNE!");
                invalidPrefs = true;
              }
            });
            

          }

          if (!invalidPrefs) { //checking again looks weird at first glance but there is a purpose
            sessionData.prefs.push(sentData.prefs);
            sessionData.userActions.studentSendData.push(payload.userID);
          }
          
          else {
            socket.emit("sessionReject", "invalidPrefs"); //this goes straight to the student
            console.log("prefrenced were rejected");
          }

          if (sessionData.prefs.length == sessionData.studentList.length) { //all student data has arrived
            let constraint, constraintValue;
            if (sessionData.groupSize) {
              constraint = "groupSize"; 
              constraintValue = sessionData.groupSize;
            }

            if (sessionData.numGroups) {
              constraint = "numGroups";
              constraintValue = sessionData.numGroups;
            }
            if (sessionData.prefs.length > 1) {
              let groupData = findOptimum(constraint, constraintValue, sessionData.studentList, sessionData.prefs);
              io.emit("GetGroups", {
                sessionID: sessionData.sessionID,
                groups: groupData.best,
                prefs: sessionData.prefs
              });

              socket.broadcast.emit("updateTeacherInfo", {
                cost: groupData.cost,
                numPrefs: groupData.numPrefs,
                sessionID: sessionData.sessionID,
                type: "GroupInfo"
              });


            }
            data = arrayRemove(data, sessionData);
          }

          else {
            console.log("data not ready.");
          }
        }
      })
      .catch((err) => {
        socket.emit("sessionReject", "invalidUserAction");
        console.log("invalid user action, after (not ready)");
        console.log(err);
      });
    }
  });

  socket.on("validateSessionID", (sessionID) => {
    let flag = false; //is this sID a duplicate?
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
    let sessionData = findSessionByID(data, studentData.sessionID);
    if (sessionData) {
      verify(studentData.token, "student").then((payload) => {
        sessionData.studentList = arrayRemove(sessionData.studentList, payload.name);
        let currentActionArray = sessionData.userActions.sessionLeave;
        if (!currentActionArray.includes(payload.userID)) {
          currentActionArray.push(payload.userID);
          //remove the student id from all student actions; they left so they should be able to do them again
          sessionData.userActions.sessionJoin = arrayRemove(sessionData.userActions.sessionJoin, payload.userID);
          sessionData.userActions.studentSendData = arrayRemove(sessionData.userActions.studentSendData, payload.userID);
          sessionData.userActions.studentReady = arrayRemove(sessionData.userActions.studentReady, payload.userID);

          //remove their name from the email list
          delete sessionData.emailAddresses[`${payload.name}`];


          io.emit("updateStudentList", {
            sessionData: sessionData,
            name: payload.name,
            type: "remove"
          });

          socket.broadcast.emit("updateTeacherInfo", {
            sessionID: studentData.sessionID,
            studentList: sessionData.studentList,
            name: payload.name,
            type: "studentLeave"
          });
        }

        else {
          console.log("didnt happen");
        }
      }).catch((err) => {
        socket.emit("sessionReject", "invalidUserAction");
        console.log("invalid user action, after 'didnt happen'");
        console.log(err);
      });
    }
  });

  socket.on("studentReady", (studentData) => { //when a student ready up
    let sessionData = findSessionByID(data, studentData.sessionID);
    if (sessionData) {
      verify(studentData.token, "student").then((payload) => {
        let currentActionArray = sessionData.userActions.studentReady;
        if (!currentActionArray.includes(payload.userID)) {
          currentActionArray.push(payload.userID);
          socket.broadcast.emit("updateTeacherInfo", {
            sessionID: studentData.sessionID,
            name: payload.name,
            type: "readyUp"
          });
        }

        else {
          console.log("diplicate reayd");
        }
      }).catch(() => {
        socket.emit("sessionReject", "invalidUserAction");
        console.log("invalid user action, after duplicate ready");
      });
    }
  });


});


