var config = {
    apiKey: "AIzaSyCVn7qrbzMlhM_qBeg5TqwrtBXn8fSzGJA",
    authDomain: "chatbar-195301.firebaseapp.com",
    databaseURL: "https://chatbar-195301.firebaseio.com",
    projectId: "chatbar-195301",
    storageBucket: "chatbar-195301.appspot.com",
    messagingSenderId: "822096113564"
  };

firebase.initializeApp(config);
var playerID = Math.floor(Math.random()*1000000000);;
var fbRef = firebase.database().ref();

var peer = new Peer({key: 'lwjd5qra8257b9'});
var peerid;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

peer.on('open', function(id) {
  	console.log('My peer ID is: ' + id);	
	
	fbRef.child( "Players/" + playerID ).set({
		id: playerID,	
		name: id
		
	});
});	

navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
						 navigator.mediaDevices.getUserMedia


fbRef.child( "Players" ).on( "child_added", function( playerData ) {
	if(playerData.key != playerID){
	
	if (navigator.mediaDevices.getUserMedia) {
			
		   navigator.mediaDevices.getUserMedia({ audio: false, video: true },
			  function(stream) {
						   console.log("OK")
				 	if(stream){
			   		var call = peer.call(playerData.val().name,stream);
						peer.on('call', function(call) {
							// Answer the call, providing our mediaStream
							call.answer(stream);
							
							
						});
					
					call.on('stream', function(stream) {
							  // `stream` is the MediaStream of the remote peer.
							  // Here you'd add it to an HTML video/canvas element.
								//var remotevideo = document.getElementById('remotevideo');
							var remotevideo = document.createElement("video"); 
							remotevideo.id = 'remotevideo';
							var x = document.getElementById('myvideo')
							document.body.insertBefore(remotevideo,x);
							remotevideo.srcObject = stream;
							remotevideo.onloadedmetadata = function(e) {
							remotevideo.play();
							console.log('1 stream added!');				 			

							};
								
						});			
						
					}
			   	
			   		//myvideo.onloadedmetadata = function(e) {
				   	//myvideo.play();
			   		//};
			  	},
			  function(err) {
				 console.log("The following error occurred: " + err.name);
			  }
		   );
		} else {
		   console.log("getUserMedia not supported");
	}
	}
});


 window.addEventListener("pagehide", function(){
    fbRef.child( "Players/" + playerID ).remove();
    setTimeout(function(){},100 ); 
    }, false);
    
	window.onunload = function() {
		fbRef.child( "Players/" + playerID ).remove();
	};

	window.onbeforeunload = function() {
		fbRef.child( "Players/" + playerID ).remove();
	};

