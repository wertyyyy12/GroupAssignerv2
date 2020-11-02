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

function findStudentID(sessionID) {
  var found = false;
  data.forEach(function(element) {
    if (element[0] == sessionID) {
      found = element;
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
      findStudentID(studentData.sessionID)[2].push(studentData.name);
    });
});


