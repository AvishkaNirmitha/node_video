// public/main.js
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const socket = io.connect();

let localStream;
let remoteStream;
let peerConnection;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    localStream = stream;

    socket.emit("join", "room1"); // assuming single room for simplicity
  })
  .catch((error) => {
    console.error("Error accessing media devices.", error);
  });

socket.on("offer", (offer) => {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.addEventListener("icecandidate", handleICECandidateEvent);
  peerConnection.addEventListener("track", handleTrackEvent);
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));
  peerConnection
    .createAnswer()
    .then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit("answer", answer);
    })
    .catch((error) => {
      console.error("Error creating answer.", error);
    });
});

socket.on("answer", (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", (candidate) => {
  const iceCandidate = new RTCIceCandidate(candidate);
  peerConnection.addIceCandidate(iceCandidate);
});

socket.on("join", () => {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.addEventListener("icecandidate", handleICECandidateEvent);
  peerConnection.addEventListener("track", handleTrackEvent);
  localStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection
    .createOffer()
    .then((offer) => {
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    })
    .catch((error) => {
      console.error("Error creating offer.", error);
    });
});

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate);
  }
}

function handleTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}
