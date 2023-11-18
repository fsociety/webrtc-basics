import "./app.scss";

const ICEServers = {
    iceServers: [
        {
            urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"]
        }
    ],
    iceCandidatePoolSize: 10
}

let pc = null;
let localStream = null;
let remoteStream = null;

//elements
const startWebcam = document.getElementById("start-webcam");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const createOfferBtn = document.getElementById("create-offer");
const createAnswerBtn = document.getElementById("create-answer");
const addAnswerBtn = document.getElementById("addAnswer");
const hangupBtn = document.getElementById("hangup");

const offerTextarea = document.getElementById("offer-textarea");
const answerTextarea = document.getElementById("answer-textarea");

document.addEventListener("DOMContentLoaded", init);
startWebcam.addEventListener("click", startCamera);
createOfferBtn.addEventListener("click", createOffer);
createAnswerBtn.addEventListener("click", createAnswer);
addAnswerBtn.addEventListener("click", addAnswer);
hangupBtn.addEventListener("click", hangup);

function init(){
    pc = new RTCPeerConnection(ICEServers);

    pc.ontrack = (event) => {
        console.log("pc ontrack!", pc.getSenders());
        event.streams[0].getTracks().forEach(track => {
            console.log("pc-ontrack",track)
            remoteStream.addTrack(track);
        })
    }

    pc.onconnectionstatechange = (event) => {
        console.log("connection state changed: " + pc.connectionState);
        if(["disconnected", "closed"].includes(pc.connectionState)){
            remoteStream = null;
            remoteVideo.srcObject = null;
        }
    }

}

async function startCamera(){
    if(!pc) init();
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio: true});
    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
        console.log("local tracks added!", pc.getSenders());
    });

    remoteVideo.srcObject = remoteStream;
    localVideo.srcObject = localStream;
}

async function createOffer(){
    pc.onicecandidate = (event) => {
        if(event.candidate){
            offerTextarea.value = JSON.stringify(pc.localDescription);
        }
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
}

async function createAnswer(){
    const offer = JSON.parse(offerTextarea.value);
    pc.onicecandidate = (event) => {
        if(event.candidate){
            answerTextarea.value = JSON.stringify(pc.localDescription);
        }
    }
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
}

async function addAnswer(){
    const answer = JSON.parse(answerTextarea.value);
    if(!pc.currentRemoteDescription){
        pc.setRemoteDescription(answer);
    }
}

function hangup(){
    pc.close();
    localStream.getTracks().forEach(track => {
        track.stop();
    });
    localVideo.srcObject = null;
    pc = null;
    localStream = null;
    remoteStream = null;
}
