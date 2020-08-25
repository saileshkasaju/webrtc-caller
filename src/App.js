import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

// const pc_config = null;

const pc_config = {
  iceServers: [
    { url: "stun:stun01.sipphone.com" },
    { url: "stun:stun.ekiga.net" },
    { url: "stun:stun.fwdnet.net" },
    { url: "stun:stun.ideasip.com" },
    { url: "stun:stun.iptel.org" },
    { url: "stun:stun.rixtelecom.se" },
    { url: "stun:stun.schlund.de" },
    { url: "stun:stun.l.google.com:19302" },
    { url: "stun:stun1.l.google.com:19302" },
    { url: "stun:stun2.l.google.com:19302" },
    { url: "stun:stun3.l.google.com:19302" },
    { url: "stun:stun4.l.google.com:19302" },
    { url: "stun:stunserver.org" },
    { url: "stun:stun.softjoys.com" },
    { url: "stun:stun.voiparound.com" },
    { url: "stun:stun.voipbuster.com" },
    { url: "stun:stun.voipstunt.com" },
    { url: "stun:stun.voxgratia.org" },
    { url: "stun:stun.xten.com" },
    {
      url: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      url: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      url: "turn:192.158.29.39:3478?transport=tcp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },

    // {
    //   urls: "stun:stun.stunprotocol.org",
    // },
    // {
    //   urls: "turn:numb.viagenie.ca",
    //   credential: "muazkh",
    //   username: "webrtc@live.com",
    // },
    // {
    //   urls: "stun:[STUN-IP]:[PORT]",
    //   credential: "[YOUR CREDENTIAL]",
    //   username: "[USERNAME]",
    // },

    // {
    //   urls: "stun:stun.l.google.com:19302",
    // },
  ],
};

// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
// create an instance of RTCPeerConnection
const thisPc = new RTCPeerConnection(pc_config);
let thisSocket = null;

const App = () => {
  const [candidates, setCandidates] = useState([]);
  const [info, setInfo] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const success = (stream) => {
    localVideoRef.current.srcObject = stream;
    thisPc.addStream(stream);
  };
  const sendToPeer = (messageType, payload) => {
    thisSocket.emit(messageType, {
      socketID: thisSocket.id,
      payload,
    });
  };
  useEffect(() => {
    thisSocket = io("/webrtcPeer", {
      path: "/webrtc",
      query: {},
    });

    thisSocket.on("connection-success", (success) => {
      console.log("success", success);
    });

    thisSocket.on("offerOrAnswer", (sdp) => {
      setInfo(JSON.stringify(sdp));

      console.log(sdp);
      // set sdp as remote description automatically
      thisPc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    thisSocket.on("candidate", (candidate) => {
      // console.log("From peer... ", JSON.stringify(candidate));
      setCandidates((prev) => [...prev, candidate]);

      thisPc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    thisPc.onicecandidate = (e) => {
      // send the candidates to the remote peer
      // see addCandidate below to be triggered on the remote peer
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate))
        sendToPeer("candidate", e.candidate);
      }
    };

    thisPc.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    // thisPc.onaddstream = (e) => {
    //   // deprecated in new browser!! https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onaddstream
    //   remoteVideoRef.current.srcObject = e.stream;
    // };
    thisPc.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };
    const constraints = {
      video: true,
      // audio: true,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(success)
      .catch(console.log);
  }, []);

  /* ACTION METHODS FROM THE BUTTONS ON SCREEN */

  const createOffer = () => {
    // console.log("Offer");

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
    // initiates the creation of SDP
    thisPc
      .createOffer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        // console.log(JSON.stringify(sdp));
        // set offer sdp as local description
        thisPc.setLocalDescription(sdp);
        sendToPeer("offerOrAnswer", sdp);
      })
      .catch(console.log);
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
  // creates an SDP answer to an offer received from remote peer
  const createAnswer = () => {
    console.log("Answer");
    thisPc
      .createAnswer({ offerToReceiveVideo: 1 })
      .then((sdp) => {
        // console.log(JSON.stringify(sdp));
        // set answer sdp as local description
        thisPc.setLocalDescription(sdp);
        sendToPeer("offerOrAnswer", sdp);
      })
      .catch(console.log);
  };

  const setRemoteDescription = () => {
    // console.log(thisPc);
    // retrieve and parse the SDP copied from the remote peer
    const desc = JSON.parse(info);

    // set sdp as remote description
    thisPc.setRemoteDescription(new RTCSessionDescription(desc));
  };

  const addCandidate = () => {
    // retrieve and parse the Candidate copied from the remote peer
    // const candidate = JSON.parse(info);
    // console.log("Adding candidate", candidate);

    // add the candidate to the peer connection
    // thisPc.addIceCandidate(new RTCIceCandidate(candidate));
    candidates.forEach((candidate) => {
      console.log(JSON.stringify(candidate));
      thisPc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };
  return (
    <div>
      <video
        style={{ width: 240, height: 240, margin: 5, backgroundColor: "black" }}
        ref={localVideoRef}
        muted
        controls
        autoPlay
      ></video>

      <video
        style={{ width: 240, height: 240, margin: 5, backgroundColor: "black" }}
        ref={remoteVideoRef}
        controls
        autoPlay
      ></video>
      <div className="">
        <button onClick={createOffer}>Offer</button>
        <button onClick={createAnswer}>Answer</button>
      </div>
      <div className="">
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
        ></textarea>
      </div>
      {/* <div className="">
        <button onClick={setRemoteDescription}>Set Remote Description</button>
        <button onClick={addCandidate}>Add Candidate</button>
      </div> */}
    </div>
  );
};

export default App;
