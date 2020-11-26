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
      attachSignin(document.getElementById('studentBtn'));
    });
  };

  function attachSignin(element) {
    console.log(element.id);
    auth2.attachClickHandler(element, {},
        function(googleUser) {
          sessionStorage.setItem('studentName', googleUser.getBasicProfile().getName());
          var id_token = googleUser.getAuthResponse().id_token;
          sessionStorage.setItem('userToken', id_token);
          window.location.href = "./html/studentClient.html";
        // }, function(error) {
        //   alert(JSON.stringify(error, undefined, 2));
        });
  }

  startApp();