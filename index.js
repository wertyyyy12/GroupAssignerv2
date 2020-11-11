var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 3001;
var data = [];
// data is stored like [sID, g#, studentList, prefs]


server.listen(port, () => {
  console.log('Server listening at port %d', port);
});


app.use(express.static(__dirname + '/html'));
app.use('/html', express.static(__dirname + '/html'));

app.use(express.static(__dirname + '/js'));
app.use('/js', express.static(__dirname + '/js'));

function findElementInArray(array, desiredElement, subIndex) {
  var found = false;
  array.forEach(function(element) {
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

io.on('connection', (socket) => {
    console.log('User connected.');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('sessionCreate', (teacherData) => {
      data.push([teacherData.sessionID, teacherData.groupSize, [], []]);
    });

    socket.on('sessionJoin', (studentData) => {
      var sessionData = findElementInArray(data, studentData.sessionID, 0);
      if (sessionData) {
        sessionData[2].push(studentData.name);
        socket.emit('sessionSuccess', studentData.sessionID);
        io.emit('updateStudentList', {
          SessionData: sessionData, 
          name: studentData.name
        });
      }

      else {
        socket.emit('sessionReject');
      }
    });

    socket.on('endSession', (sessionID) => {
      io.emit('clientSessionEnd', sessionID);
    });

    socket.on('studentSendData', (sentData) => {
      var sessionData = findElementInArray(data, sentData.sessionID, 0);
      sessionData[3].push(sentData.prefs);
    });

});


