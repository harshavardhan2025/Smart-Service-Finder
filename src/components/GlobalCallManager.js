import React, { useState, useEffect, useRef } from "react";

function GlobalCallManager() {
  const [activeCall, setActiveCall] = useState(null); // 'ringing' | 'connected' | null
  const [callDuration, setCallDuration] = useState(0);
  const [callSessionId, setCallSessionId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { sessionId, offerSdp, callerName, bookingId }
  const [targetName, setTargetName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const addedCandidatesRef = useRef(new Set());

  // Update sessionStorage and dispatch state changes
  useEffect(() => {
    sessionStorage.setItem("activeCallState", activeCall || "");
    window.dispatchEvent(new CustomEvent("callStateChanged", {
      detail: { activeCall }
    }));
  }, [activeCall]);

  // Call duration counter
  useEffect(() => {
    let interval;
    if (activeCall === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Poll for incoming calls
  useEffect(() => {
    const checkIncoming = async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;

      // Don't poll if we're already in a call
      if (activeCall || incomingCall) return;

      try {
        const res = await fetch("/api/call/incoming", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hasIncoming) {
            setIncomingCall({
              sessionId: data.sessionId,
              offerSdp: data.offerSdp,
              callerName: data.callerName,
              bookingId: data.bookingId
            });
            setTargetName(data.callerName);
          }
        }
      } catch (err) {
        console.error("Error polling incoming calls:", err);
      }
    };

    checkIncoming();
    const interval = setInterval(checkIncoming, 3000);
    return () => clearInterval(interval);
  }, [activeCall, incomingCall]);

  // Active call status/signaling polling
  useEffect(() => {
    if (!callSessionId) return;
    const token = sessionStorage.getItem("authToken");
    if (!token) return;

    const pollSession = async () => {
      try {
        const res = await fetch(`/api/call/session/${callSessionId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const session = await res.json();

        // If call ended/declined/missed
        if (["ended", "declined", "missed"].includes(session.status)) {
          handleEndCallCleanup();
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) return;

        // If callee answered and caller gets the answer SDP
        if (session.status === "connected" && session.answer_sdp && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: session.answer_sdp }));
          setActiveCall("connected");
        }

        // Apply new ICE candidates
        const isCaller = session.caller_id === sessionStorage.getItem("userId");
        const remoteIceCandidates = isCaller ? session.callee_ice : session.caller_ice;

        if (pc.remoteDescription && remoteIceCandidates && remoteIceCandidates.length > 0) {
          for (const candStr of remoteIceCandidates) {
            if (!addedCandidatesRef.current.has(candStr)) {
              try {
                const candidate = JSON.parse(candStr);
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                addedCandidatesRef.current.add(candStr);
              } catch (e) {
                console.error("Error adding remote ICE candidate:", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error polling call session state:", err);
      }
    };

    const interval = setInterval(pollSession, 2000);
    return () => clearInterval(interval);
  }, [callSessionId]);

  // Clean up Peer Connections & Streams
  const handleEndCallCleanup = () => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      localStreamRef.current = null;
    }
    setActiveCall(null);
    setCallSessionId(null);
    setIncomingCall(null);
    addedCandidatesRef.current = new Set();
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeaker(true);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeaker(true);
    const remoteAudio = document.getElementById("remoteAudio");
    if (remoteAudio) remoteAudio.volume = 1.0;
  };

  const toggleReceiver = () => {
    setIsSpeaker(false);
    const remoteAudio = document.getElementById("remoteAudio");
    if (remoteAudio) remoteAudio.volume = 0.2;
  };

  // Start outbound call
  const handleStartCall = async (bookingId, recipientName) => {
    if (activeCall) {
      alert("You are already in an active call.");
      return;
    }
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) return alert("Not logged in");

      setTargetName(recipientName);

      // Request microphone permissions
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr) {
        alert("Microphone permission is required to make calls. Please allow microphone access in your browser settings.");
        return;
      }

      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const remoteAudio = document.getElementById("remoteAudio");
        if (remoteAudio) {
          const remoteStream = event.streams[0] || new MediaStream([event.track]);
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play().catch(e => console.error("Audio playback error:", e));
        }
      };

      let tempSessionId = null;
      const iceQueue = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (tempSessionId) {
            fetch(`/api/call/ice/${tempSessionId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ candidate: event.candidate, role: 'caller' })
            }).catch(err => console.error("Error sending ice candidate:", err));
          } else {
            iceQueue.push(event.candidate);
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: bookingId,
          offerSdp: offer.sdp
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start call");
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const sId = data.sessionId;
      tempSessionId = sId;
      setCallSessionId(sId);
      setActiveCall('ringing');

      // Flush queued candidates
      for (const candidate of iceQueue) {
        fetch(`/api/call/ice/${sId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ candidate, role: 'caller' })
        }).catch(err => console.error("Error sending queued ice candidate:", err));
      }

    } catch (err) {
      console.error("Call initiation error:", err);
      alert("Error starting app call: " + err.message);
    }
  };

  // Answer inbound call
  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    const { sessionId, offerSdp } = incomingCall;
    const token = sessionStorage.getItem("authToken");

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permErr) {
        alert("Microphone permission is required to answer calls. Please allow microphone access.");
        handleDeclineCall();
        return;
      }

      localStreamRef.current = stream;
      setCallSessionId(sessionId);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const remoteAudio = document.getElementById("remoteAudio");
        if (remoteAudio) {
          const remoteStream = event.streams[0] || new MediaStream([event.track]);
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play().catch(e => console.error("Audio playback error:", e));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`/api/call/ice/${sessionId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ candidate: event.candidate, role: 'callee' })
          }).catch(err => console.error("Error sending ice candidate:", err));
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offerSdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const res = await fetch(`/api/call/answer/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answerSdp: answer.sdp })
      });

      if (res.ok) {
        setActiveCall('connected');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to answer call");
        handleEndCallCleanup();
      }

    } catch (err) {
      console.error("Error answering call:", err);
      alert("Error answering call: " + err.message);
      handleDeclineCall();
    }
  };

  // Decline inbound call
  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    const { sessionId } = incomingCall;
    const token = sessionStorage.getItem("authToken");

    handleEndCallCleanup();

    if (sessionId && token) {
      try {
        await fetch(`/api/call/decline/${sessionId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error declining call:", err);
      }
    }
  };

  // Hang up call
  const handleHangUp = async () => {
    const sId = callSessionId;
    const token = sessionStorage.getItem("authToken");

    handleEndCallCleanup();

    if (sId && token) {
      try {
        await fetch(`/api/call/end/${sId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }
  };

  // Listen to the outbound trigger event
  useEffect(() => {
    const handleOutboundCallEvent = (e) => {
      const { bookingId, targetName } = e.detail;
      handleStartCall(bookingId, targetName);
    };

    window.addEventListener("initiateCall", handleOutboundCallEvent);
    return () => window.removeEventListener("initiateCall", handleOutboundCallEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <audio id="remoteAudio" autoPlay style={{ display: "none" }} />
      {/* Active Call Floating Overlay Panel (Glassmorphism layout) */}
      {activeCall && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "320px",
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 99999,
          color: "white",
          fontFamily: "'Outfit', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Pulse ring decoration for ringing state */}
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            marginBottom: "16px",
            boxShadow: activeCall === 'ringing' ? "0 0 20px rgba(52, 211, 153, 0.4)" : "0 0 20px rgba(99, 102, 241, 0.4)",
            border: "1px solid rgba(255,255,255,0.15)"
          }}>
            👤
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, textAlign: "center" }}>
            {targetName || "User"}
          </h3>
          <p style={{
            margin: "0 0 20px 0",
            fontSize: "13px",
            color: activeCall === 'ringing' ? "#34d399" : "#818cf8",
            fontWeight: 600
          }}>
            {activeCall === 'ringing' ? "🔔 Calling via Workzy..." : `🎙️ In Call: ${formatDuration(callDuration)}`}
          </p>

          {activeCall === 'connected' && (
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              {/* Mute Mic Button */}
              <button
                onClick={toggleMute}
                style={{
                  backgroundColor: isMuted ? "#ef4444" : "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? "🔇" : "🎙️"}
              </button>

              {/* Speaker Button */}
              <button
                onClick={toggleSpeaker}
                style={{
                  backgroundColor: isSpeaker ? "#6366f1" : "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title="Speaker Mode"
              >
                🔊
              </button>

              {/* Receiver Button */}
              <button
                onClick={toggleReceiver}
                style={{
                  backgroundColor: !isSpeaker ? "#6366f1" : "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "none",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title="Receiver Mode"
              >
                📞
              </button>
            </div>
          )}

          {/* End Call Button */}
          <button
            onClick={handleHangUp}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 6px 15px rgba(239,68,68,0.4)"
            }}
          >
            🛑
          </button>
        </div>
      )}

      {/* Incoming Call Toast Banner (WhatsApp Style) */}
      {incomingCall && !activeCall && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: "420px",
          backgroundColor: "#1e293b",
          borderRadius: "16px",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
          zIndex: 100000,
          fontFamily: "'Outfit', sans-serif",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          animation: "slideDown 0.3s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px"
            }}>
              👤
            </div>
            <div>
              <h4 style={{ color: "white", margin: 0, fontSize: "15px", fontWeight: 700 }}>
                {incomingCall.callerName}
              </h4>
              <p style={{ color: "#34d399", margin: "2px 0 0 0", fontSize: "12px", fontWeight: 500 }}>
                📞 Incoming App Call...
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAnswerCall}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(22,163,74,0.3)"
              }}
              title="Answer"
            >
              📞
            </button>
            <button
              onClick={handleDeclineCall}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(239,68,68,0.3)"
              }}
              title="Decline"
            >
              🛑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalCallManager;
