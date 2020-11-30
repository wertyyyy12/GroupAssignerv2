var socket = io();

var googleUser = {};
  var startApp = function() {
    gapi.load('auth2', function(){
      // Retrieve the singleton for the GoogleAuth library and set up the client.
      auth2 = gapi.auth2.init({
        client_id: '984134543663-o74ijsk609uufcapnp6isnqi8eje8a2t.apps.googleusercontent.com',
        cookiepolicy: 'single_host_origin'  
        // Request scopes in addition to 'profile' and 'email'
        //scope: 'additional_scope'
      });
      attachSignin(document.getElementById('teacherBtn'), "teacher");
      attachSignin(document.getElementById('studentBtn'), "student");

    });
  };

  function attachSignin(element, type) {
    auth2.attachClickHandler(element, {},
        function(googleUser) {
          if (type == "student") {
            localStorage.setItem('studentName', googleUser.getBasicProfile().getName());
            window.location.href = "./html/studentClient.html";
          }

          if (type == "teacher") {
            localStorage.setItem('teacherName', googleUser.getBasicProfile().getName());
            window.location.href = "./html/teacherClient.html";
          }

          var id_token = googleUser.getAuthResponse().id_token;
          localStorage.setItem('userToken', id_token);
        // }, function(error) {
        //   alert(JSON.stringify(error, undefined, 2));
        });
  }

  startApp();