//Create an account on Firebase, and use the credentials they give you in place of the following
var config = {
    apiKey: "AIzaSyCVn7qrbzMlhM_qBeg5TqwrtBXn8fSzGJA",
    authDomain: "chatbar-195301.firebaseapp.com",
    databaseURL: "https://chatbar-195301.firebaseio.com",
    projectId: "chatbar-195301",
    storageBucket: "chatbar-195301.appspot.com",
    messagingSenderId: "822096113564"
};

firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random()*1000000000);
//Create an account on Viagenie (http://numb.viagenie.ca/), and replace {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'} with the information from your account
var servers = { 
	'iceServers': [
		{'urls': 'stun:stun.services.mozilla.com'}, 
		{'urls': 'stun:stun.l.google.com:19302'}, 
		{'urls': 'turn:numb.viagenie.ca','credential': 'beaver','username': 'james14123@yahoo.com.tw'}]};

var pc = {};
var otherplayers = [];

var mainuser = document.createElement("div");
		mainuser.innerHTML = yourId;
		mainuser.id = yourId + "_name";
		document.getElementById("owner").appendChild(mainuser);

const listener = {
        init(ctx) {
            this.ctx = ctx;
            this.listener = this.ctx.listener;
        },
        update(position,quaternion) {
            const {listener} = this;
			
			//確認方位
			listener.setPosition(position.x,position.y,position.z);
		
			let forward = new THREE.Vector3(0,0,-1);
			forward.applyQuaternion(quaternion); // forward初始向量与camera四元数矩阵相乘，得到当前的forward向量
			forward.normalize(); // 向量归一
			// 赋值给AudioListener的forward分量
			listener.forwardX.value = forward.x;
			listener.forwardY.value = forward.y;
			listener.forwardZ.value = forward.z;
			
        }
	
}



class Speaker {
   constructor(ctx,path) {
        this.path = path;
        this.ctx = ctx;		
        this.source = ctx.createBufferSource();
        this.panner = ctx.createPanner();
       	this.panner.refDistance = 1; 
	   	this.panner.maxDistance = 2;
	   	
	   	this.source.loop = true; // 设置音频循环播放
        this.source.connect(this.panner); // 将输入结点连至PannerNode
        this.panner.connect(ctx.destination); // 将PannerNode连至输出结点
        this._processAudio(); // 异步函数，请求与加载音频数据
    }
    update(position) {
        const { panner } = this;
        panner.setPosition(position.x, position.y, position.z); // 将发声体坐标传给PannerNode
    }
    _loadAudio(path) { 
        // 使用fetch请求音频文件
        return fetch(path).then(res => res.arrayBuffer());
    }
    async _processAudio() {
        const { path, ctx, source } = this;
        try {
            const data = await this._loadAudio(path); // 异步请求音频
            const buffer = await ctx.decodeAudioData(data); // 解码音频数据
            source.buffer = buffer; // 将解码数据赋值给BufferSourceNode输入结点
            source.start(0); // 播放音频
        } catch(err) {
            console.err(err);
        }
    }
}


class Speakerlive {
   constructor(ctx,path) {
        this.path = path;
        this.ctx = ctx;		
        this.source = ctx.createMediaStreamSource(path);
        this.panner = ctx.createPanner();
       	this.panner.refDistance = 2; 
	   	this.panner.maxDistance = 5; 
        this.source.connect(this.panner); // 将输入结点连至PannerNode
        this.panner.connect(ctx.destination); // 将PannerNode连至输出结点
	   
       
    }
    update(position) {
        const { panner } = this;
        panner.setPosition(position.x, position.y, position.z); // 将发声体坐标传给PannerNode
    }
  
}


//listener code here!
ac = new (window.AudioContext || window.webkitAudioContext || AudioContext)();
listener.init(ac);
var sp;


//= new Speaker(ac,'History.mp3');


firebase.auth().onAuthStateChanged(function(user) { 
    if (user) { 
		// User is signed in. 	
		//yourId = user.uid;
		//console.log("MainPlayer: " + yourId);
		//Cant add other imformation here
		playerlist = database.child( "Players/list/" + yourId).set({ 
			player: yourId, 
			location:{
				position: {x: 0, y:0, z:-6},
				rotation: {x: 0, y:0, z:0},
			}
			
		});
		
		setTimeout(animate(),500);
		
		
    } else { 
    firebase.auth().signInAnonymously().catch(function(error) { 
     // Handle Errors here. 
     var errorCode = error.code; 
     var errorMessage = error.message; 
		console.log(errorMessage);
    }); 
    } 
}); 


function sendMessage(senderId, remoteId,data) {
    var msg = database.child( "Players/data/").push({ 
		sender: senderId, 
		recevier:remoteId,
		message: data,
		
	});
   msg.remove();
}

function readMessage(data) {
	
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
	var recevier = data.val().recevier;
	
	
	if (sender != yourId && recevier == yourId) {
		
		if (msg.ice != undefined){
				pc[sender].addIceCandidate(new RTCIceCandidate(msg.ice));	
				
		}
		else if (msg.sdp.type == "answer"){
				console.log(sender+"發出"+msg.sdp.type+"給"+recevier );
				pc[sender].setRemoteDescription(new RTCSessionDescription(msg.sdp));
				
		}
		else if (msg.sdp.type == "offer"){
				
				console.log(recevier+"接收"+msg.sdp.type+"從"+sender );
				
				pc[sender].setRemoteDescription(new RTCSessionDescription(msg.sdp))
				  .then(() => pc[sender].createAnswer())
				  .then(answer => pc[sender].setLocalDescription(answer))
				  .then(() => sendMessage(recevier,sender,JSON.stringify({'sdp': pc[sender].localDescription})));
				
		}
		
	}
	
	
};

 var speak = {};

function readListMessage(player) {
	if(player.val().player != yourId){
		console.log(player.val().player +" 加入！");
		
		
		pc[player.val().player] = new RTCPeerConnection(servers);
		showMyFace(player.val().player);
		document.getElementById("yourVideo").muted = true;
		
		var othervideos = document.getElementById("yourVideo").cloneNode(true);
					document.getElementById("videolist").appendChild(othervideos);
					othervideos.id = player.val().player + "_video";
					othervideos.autoplay = true;
					othervideos.playinliine = true;
					//othervideos.muted = true;
		
		
					
		pc[player.val().player].onaddstream = (event => {
					othervideos.srcObject = event.stream;		
					//sp = new Speaker(ac,);
					speak[player.val().player] = new Speakerlive(ac,event.stream);
					/*
					var panner;
					const src = ac.createMediaStreamSource(event.stream);
					panner = ac.createPanner();
					panner.setPosition(0,2,0); // 将发声体坐标传给PannerNode
					panner.refDistance = 2;
					src.connect(panner);
					panner.connect(ac.destination);
					*/
		
					/*
					var au = document.createElement('audio');
					au.id = player.val().player+"_audio";
					au.srcObject = event.stream;	
					au.autoplay = true;
					document.querySelector('a-scene').appendChild(au);
					*/
			
					
					const metername = document.createElement("metername");
					metername.id = player.val().player + "_meter";
					metername.innerHTML = player.val().player + "'s volume : ";
					const instantMeter = document.createElement("meter");
					const instantValueDisplay = document.createElement("div");

					instantMeter.class = "value";
					document.getElementById("videolist").appendChild(metername);
					metername.appendChild(instantMeter);
					instantMeter.appendChild(instantValueDisplay);
					handleSuccess(event.stream,instantMeter,instantValueDisplay)
				
					otherusers.innerHTML = player.val().player+ " Status: Connected";
					
					
		});
		
		var otherusers = document.createElement("div");
		otherusers.innerHTML = player.val().player+ " Status: waiting";
		otherusers.id = player.val().player + "_name";
		document.getElementById("userlist").appendChild(otherusers);
		
		var el = document.createElement('a-obj-model');
		
		var te = document.createElement('a-text');
		te.setAttribute('value',player.val().player);
		te.setAttribute('position', {x: -0.5, y: 2, z: 0});
		
		el.setAttribute('src',"#pika-obj");
		el.setAttribute('mtl',"#pika-mtl");
		el.id = player.val().player+"_character";
		el.setAttribute('static-body',"mass=5");
		el.appendChild(te);
		document.querySelector('a-scene').appendChild(el);
		
		
		el.setAttribute('position',player.val().location.position);
		el.setAttribute('rotation',player.val().location.rotation);

		
		database.child( "Players/list/"+player.val().player).on( "child_changed", function( data ) {
			
		el.setAttribute('position',data.val().position);	
		el.setAttribute('rotation',data.val().rotation);	
		
			
			
		if(speak[player.val().player] != undefined){
			speak[player.val().player].update(data.val().position);
		}
			
			
		
		});	

	}
	
}

		
try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioContext = new AudioContext();
} catch (e) {
  alert('Web Audio API not supported.');
}

function handleSuccess(stream,instantMeter,instantValueDisplay) {
  const soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
  soundMeter.connectToSource(stream, function(e) {
    if (e) {
      alert(e);
      return;
    }
    setInterval(() => {
      instantMeter.value = instantValueDisplay.innerText =
        soundMeter.instant.toFixed(2);
      
    }, 200);
  });
}


function deb(){
	
	console.log(ste[0]);	
	
}


function remove(){
	database.remove();
}


function readplayerexitMessage(player) {
	if(player.val().player != yourId){
		
		
		
		document.getElementById(player.val().player+"_character").parentNode.removeChild(document.getElementById(player.val().player+"_character"));
		if(document.getElementById(player.val().player + "_meter") != null){
		document.getElementById(player.val().player + "_meter").remove();
		}
		
		
		
		document.getElementById(player.val().player+"_video").remove();
		document.getElementById(player.val().player+"_name").remove();
		
		database.child( "Players/list/" + yourId).remove();
	}
	
	
}




database.child( "Players/data").on('child_added', readMessage);
database.child( "Players/list").on('child_added', readListMessage);
database.child( "Players/list" ).on( "child_removed",readplayerexitMessage);

console.log("MainPlayer:"+yourId);


function loadplayer(){
	database.child( "Players/list").once('value').then(function(snapshot) {
		
		snapshot.forEach(function (childSnapshot) {
			if(yourId!=childSnapshot.val().player){
				
				showFriendsFace(childSnapshot.val().player);
				setTimeout(showFriendsFace(childSnapshot.val().player),500);
				setTimeout(showFriendsFace(childSnapshot.val().player),500);
				
				
			}
		});
	});

}

const metername = document.createElement("metername");
		metername.innerHTML = yourId + "'s volume : ";
		const instantMeter = document.createElement("meter");
		const instantValueDisplay = document.createElement("div");
	  
		instantMeter.class = "value";
		document.getElementById("videolist").appendChild(metername);
		metername.appendChild(instantMeter);
		instantMeter.appendChild(instantValueDisplay);
	
var ste = {};

navigator.mediaDevices.getUserMedia({audio:true, video:false})
		.then(stream => {
			ste[0] = stream; 
		});

function showMyFace(remoteId) {
		
	
	 
		  yourVideo.srcObject = ste[0];
		  pc[remoteId].addStream(ste[0]);	
		  handleSuccess(ste[0],instantMeter,instantValueDisplay); 

    //.then(stream => pc[remoteId].addStream(stream))
	//.then(stream => handleSuccess(stream,instantMeter,instantValueDisplay));

		
	
}



function showFriendsFace(remoteId) {
	
  pc[remoteId].createOffer()
    .then(offer => pc[remoteId].setLocalDescription(offer) )
    .then(() => sendMessage(yourId,remoteId, JSON.stringify({'sdp': pc[remoteId].localDescription})) );
	
  pc[remoteId].onicecandidate = (event => event.candidate?sendMessage(yourId, remoteId,JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
	
  
}



window.addEventListener('pagehide', () => {
    	database.child( "Players/list/" + yourId).remove();
    });
window.unload = function () {
		database.child( "Players/list/" + yourId).remove();

	};
window.onunload = function() {
		database.child( "Players/list/" + yourId).remove();
	};

window.onbeforeunload = function() {
		database.child( "Players/list/" + yourId).remove();
	};

//console.log(document.querySelector('[camera]').getAttribute('position'));			






function animate(){
		
	if (yourId){
		
		if(document.querySelector('[camera]') != null){
			
			
			database.child( "Players/list/" + yourId).set({ 
				player: yourId, 
				location:{
					position: {
						x:document.querySelector('[camera]').getAttribute('position').x,
						y:document.querySelector('[camera]').getAttribute('position').y-3.6,	
						z:document.querySelector('[camera]').getAttribute('position').z
					},
					rotation:
						document.querySelector('[camera]').getAttribute('rotation'),
					}
			});
			listener.update(document.querySelector('[camera]').getAttribute('position'),document.querySelector('a-camera').object3D.quaternion);
			
			//console.log(document.querySelector('a-camera').getAttribute('rotation'));
			
		}
		
		
		
		
		if (typeof sp !== 'undefined') {
			sp.panner.setPosition(0,1.6,0);
			
				
		}
		
	
	}	
	requestAnimationFrame(animate);
	
}