import React, { useState, useEffect, useRef, useCallback } from "react";

function GlobalCallManager() {
  const [activeCall, setActiveCall] = useState(null); // 'ringing' | 'connected' | null
  const [callDuration, setCallDuration] = useState(0);
  const [callSessionId, setCallSessionId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [targetName, setTargetName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const addedCandidatesRef = useRef(new Set());
  const remoteAudioRef = useRef(null);
  const ringtoneAudioRef = useRef(null);
  const callerTuneAudioRef = useRef(null);
  const isAnsweringRef = useRef(false);
  const recentlyEndedCallsRef = useRef(new Set());

  // FIX 1: Mirror callSessionId in a ref so event-handler closures always
  //        see the current value (avoids stale-state closure bug).
  const callSessionIdRef = useRef(null);
  useEffect(() => {
    callSessionIdRef.current = callSessionId;
  }, [callSessionId]);

  // ── Broadcast active-call state to rest of the app ────────────────────────
  useEffect(() => {
    sessionStorage.setItem("activeCallState", activeCall || "");
    window.dispatchEvent(new CustomEvent("callStateChanged", {
      detail: { activeCall }
    }));
  }, [activeCall]);

  // ── Call duration timer ───────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (activeCall === "connected") {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Audio helpers ─────────────────────────────────────────────────────────
  const stopTones = useCallback(() => {
    [callerTuneAudioRef, ringtoneAudioRef].forEach(ref => {
      if (ref.current) {
        try { 
          ref.current.dataset.playing = "false";
          ref.current.pause(); 
          ref.current.currentTime = 0; 
        } catch (_) {}
      }
    });
  }, []);

  const startRingbackTone = useCallback(() => {
    stopTones();
    if (callerTuneAudioRef.current) {
      callerTuneAudioRef.current.dataset.playing = "true";
      callerTuneAudioRef.current.play().catch(e => console.warn("caller tune:", e));
    }
  }, [stopTones]);

  const startRingtone = useCallback(() => {
    stopTones();
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.dataset.playing = "true";
      ringtoneAudioRef.current.play().catch(e => console.warn("ringtone:", e));
    }
  }, [stopTones]);

  // Tone effect
  useEffect(() => {
    if (activeCall === "ringing") startRingbackTone();
    else if (incomingCall && !activeCall) startRingtone();
    else stopTones();
    return () => stopTones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall, incomingCall]);

  // Unlock audio on first user gesture (browser autoplay policy)
  useEffect(() => {
    const handleUnlock = () => {
      [ringtoneAudioRef.current, callerTuneAudioRef.current].forEach(a => {
        if (a && !a.dataset.unlocked) {
          a.muted = true;
          a.play().then(() => {
            if (a.dataset.playing !== "true") {
              a.pause();
              a.currentTime = 0;
            }
            a.muted = false;
            a.dataset.unlocked = "true";
          }).catch(() => {});
        }
      });
    };
    window.addEventListener("click", handleUnlock);
    window.addEventListener("keydown", handleUnlock);
    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
    };
  }, []);

  // ── Cleanup helper ────────────────────────────────────────────────────────
  // FIX 1 (continued): read session ID from ref — never stale inside closures.
  const handleEndCallCleanup = useCallback(() => {
    stopTones();
    const sId = callSessionIdRef.current;
    if (sId) {
      recentlyEndedCallsRef.current.add(sId);
      setTimeout(() => recentlyEndedCallsRef.current.delete(sId), 15000);
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (_) {}
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      try { localStreamRef.current.getTracks().forEach(t => t.stop()); } catch (_) {}
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      try { remoteAudioRef.current.pause(); remoteAudioRef.current.srcObject = null; } catch (_) {}
    }
    setActiveCall(null);
    setCallSessionId(null);
    setIncomingCall(null);
    addedCandidatesRef.current = new Set();
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeaker(true);
  }, [stopTones]);

  // ── Poll for incoming calls ───────────────────────────────────────────────
  useEffect(() => {
    const checkIncoming = async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;
      if (activeCall || incomingCall) return;
      try {
        const res = await fetch("/api/call/incoming", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          ["authToken","userId","userName","userEmail","userRole"]
            .forEach(k => sessionStorage.removeItem(k));
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.hasIncoming && !recentlyEndedCallsRef.current.has(data.sessionId)) {
            setIncomingCall(prev => {
              if (prev && prev.sessionId === data.sessionId) return prev;
              return {
                sessionId: data.sessionId,
                offerSdp: data.offerSdp,
                callerName: data.callerName,
                bookingId: data.bookingId
              };
            });
            setTargetName(data.callerName);
            setCallSessionId(data.sessionId);
          }
        }
      } catch (err) {
        console.error("Incoming call poll error:", err);
      }
    };

    checkIncoming();
    const id = setInterval(checkIncoming, 3000);
    return () => clearInterval(id);
  }, [activeCall, incomingCall]);

  // ── Poll active session (signalling + ICE) ────────────────────────────────
  useEffect(() => {
    if (!callSessionId) return;
    const token = sessionStorage.getItem("authToken");
    if (!token) return;

    const pollSession = async () => {
      try {
        const res = await fetch(`/api/call/session/${callSessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          ["authToken","userId","userName","userEmail","userRole"]
            .forEach(k => sessionStorage.removeItem(k));
          handleEndCallCleanup();
          return;
        }
        if (res.status === 404) { handleEndCallCleanup(); return; }
        if (!res.ok) return;
        const session = await res.json();

        if (["ended","declined","missed"].includes(session.status)) {
          handleEndCallCleanup();
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) return;

        // Caller side: apply answer SDP when callee responds
        if (
          session.status === "connected" &&
          session.answer_sdp &&
          pc.signalingState === "have-local-offer"
        ) {
          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp: session.answer_sdp })
            );
          } catch (e) {
            console.error("setRemoteDescription (answer) failed:", e);
          }
          setActiveCall("connected");
        }

        // Apply remote ICE candidates we haven't seen yet
        const isCaller = session.caller_id === sessionStorage.getItem("userId");
        const remoteCandidates = isCaller ? session.callee_ice : session.caller_ice;

        if (pc.remoteDescription && remoteCandidates?.length) {
          for (const candStr of remoteCandidates) {
            if (!addedCandidatesRef.current.has(candStr)) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candStr)));
                addedCandidatesRef.current.add(candStr);
              } catch (e) {
                console.error("addIceCandidate failed:", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Session poll error:", err);
      }
    };

    const id = setInterval(pollSession, 2000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSessionId]);

  // ── Mic mute toggle ───────────────────────────────────────────────────────
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleSpeaker = () => {
    setIsSpeaker(true);
    if (remoteAudioRef.current) remoteAudioRef.current.volume = 1.0;
  };

  const toggleReceiver = () => {
    setIsSpeaker(false);
    if (remoteAudioRef.current) remoteAudioRef.current.volume = 0.2;
  };

  // ── RTCPeerConnection factory (shared by caller + callee) ─────────────────
  const createPC = (token, sessionId, role) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => console.error("Remote audio play:", e));
      }
    };

    let disconnectTimer = null;
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "failed" || s === "closed") {
        handleEndCallCleanup();
      } else if (s === "disconnected") {
        disconnectTimer = setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") handleEndCallCleanup();
        }, 10000);
      } else if (s === "connected" || s === "completed") {
        if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // FIX 1: use ref so we always have the current sessionId
        const sId = sessionId || callSessionIdRef.current;
        if (!sId) return;
        fetch(`/api/call/ice/${sId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ candidate: event.candidate, role })
        }).catch(e => console.error("ICE send error:", e));
      }
    };

    return pc;
  };

  // ── Start outbound call ───────────────────────────────────────────────────
  const handleStartCall = async (bookingId, recipientName) => {
    if (activeCall) { alert("You are already in an active call."); return; }
    const token = sessionStorage.getItem("authToken");
    if (!token) { alert("Not logged in"); return; }

    setTargetName(recipientName);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      alert("Microphone permission is required to make calls.");
      return;
    }
    localStreamRef.current = stream;

    // Temporary session ID holder before server responds
    let resolvedSessionId = null;
    const iceQueue = [];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    peerConnectionRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        const s = event.streams[0] || new MediaStream([event.track]);
        remoteAudioRef.current.srcObject = s;
        remoteAudioRef.current.play().catch(e => console.error("Remote audio:", e));
      }
    };

    let disconnectTimer = null;
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "failed" || s === "closed") handleEndCallCleanup();
      else if (s === "disconnected") {
        disconnectTimer = setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") handleEndCallCleanup();
        }, 10000);
      } else if (s === "connected" || s === "completed") {
        if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const sId = resolvedSessionId || callSessionIdRef.current;
      if (sId) {
        fetch(`/api/call/ice/${sId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ candidate: event.candidate, role: "caller" })
        }).catch(e => console.error("ICE send:", e));
      } else {
        iceQueue.push(event.candidate);
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, offerSdp: offer.sdp })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start call");
        // FIX 4: fully clean up on error
        stream.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        try { pc.close(); } catch (_) {}
        peerConnectionRef.current = null;
        return;
      }

      resolvedSessionId = data.sessionId;
      setCallSessionId(data.sessionId);
      setActiveCall("ringing");

      // Flush queued ICE candidates
      for (const candidate of iceQueue) {
        fetch(`/api/call/ice/${data.sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ candidate, role: "caller" })
        }).catch(e => console.error("ICE flush:", e));
      }
    } catch (err) {
      console.error("Call initiation error:", err);
      alert("Error starting call: " + err.message);
      // FIX 4: clean up on exception too
      stream.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      try { pc.close(); } catch (_) {}
      peerConnectionRef.current = null;
    }
  };

  // ── Answer inbound call ───────────────────────────────────────────────────
  const handleAnswerCall = async () => {
    if (isAnsweringRef.current || !incomingCall) return;
    isAnsweringRef.current = true;
    const { sessionId, offerSdp } = incomingCall;
    const token = sessionStorage.getItem("authToken");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      isAnsweringRef.current = false;
      alert("Microphone permission is required to answer calls.");
      handleDeclineCall();
      return;
    }

    localStreamRef.current = stream;
    setCallSessionId(sessionId);

    const pc = createPC(token, sessionId, "callee");
    peerConnectionRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offerSdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const res = await fetch(`/api/call/answer/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answerSdp: answer.sdp })
      });

      isAnsweringRef.current = false;

      if (res.ok) {
        // FIX 2: clear incomingCall state after answering
        // FIX 6: stop tones explicitly
        stopTones();
        setIncomingCall(null);
        setActiveCall("connected");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to answer call");
        handleEndCallCleanup();
      }
    } catch (err) {
      isAnsweringRef.current = false;
      console.error("Answer error:", err);
      alert("Error answering call: " + err.message);
      handleDeclineCall();
    }
  };

  // ── Decline inbound call ──────────────────────────────────────────────────
  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    const { sessionId } = incomingCall;
    const token = sessionStorage.getItem("authToken");
    handleEndCallCleanup();
    if (sessionId && token) {
      try {
        await fetch(`/api/call/decline/${sessionId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Decline error:", err);
      }
    }
  };

  // ── Hang up ───────────────────────────────────────────────────────────────
  const handleHangUp = async () => {
    // FIX 1 (continued): read from ref, not from potentially stale state
    const sId = callSessionIdRef.current;
    const token = sessionStorage.getItem("authToken");
    handleEndCallCleanup();
    if (sId && token) {
      try {
        await fetch(`/api/call/end/${sId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("End call error:", err);
      }
    }
  };

  // ── Listen for outbound call events from other components ─────────────────
  useEffect(() => {
    const handler = (e) => {
      const { bookingId, targetName: tName } = e.detail;
      handleStartCall(bookingId, tName);
    };
    window.addEventListener("initiateCall", handler);
    return () => window.removeEventListener("initiateCall", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* FIX 3: define the missing slideDown keyframe animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulsRing {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); }
          70%  { box-shadow: 0 0 0 14px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
      `}</style>

      {/* Hidden audio elements */}
      <audio ref={remoteAudioRef} autoPlay style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
      <audio ref={ringtoneAudioRef} src="/new_ringtone.mp3" loop style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
      <audio ref={callerTuneAudioRef} src="/caller_tune.wav" loop style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />

      {/* ── Active Call Panel ─────────────────────────────────────────────── */}
      {activeCall && (
        <div style={{
          position: "fixed", bottom: 30, right: 30, width: 320,
          backgroundColor: "rgba(15,23,42,0.88)", backdropFilter: "blur(16px)",
          borderRadius: 24, padding: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 99999, color: "white",
          fontFamily: "'Outfit', sans-serif",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          {/* Avatar with pulse ring when ringing */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, marginBottom: 16,
            animation: activeCall === "ringing" ? "pulsRing 1.4s ease-out infinite" : "none",
            border: "1px solid rgba(255,255,255,0.15)"
          }}>
            👤
          </div>

          <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, textAlign: "center" }}>
            {targetName || "User"}
          </h3>
          <p style={{
            margin: "0 0 20px 0", fontSize: 13, fontWeight: 600,
            color: activeCall === "ringing" ? "#34d399" : "#818cf8"
          }}>
            {activeCall === "ringing"
              ? "🔔 Ringing via Workzy..."
              : `🎙️ In Call: ${formatDuration(callDuration)}`}
          </p>

          {activeCall === "connected" && (
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} style={{
                backgroundColor: isMuted ? "#ef4444" : "rgba(255,255,255,0.1)",
                color: "white", border: "none", width: 40, height: 40,
                borderRadius: "50%", fontSize: 16, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>
                {isMuted ? "🔇" : "🎙️"}
              </button>
              <button onClick={toggleSpeaker} title="Speaker" style={{
                backgroundColor: isSpeaker ? "#6366f1" : "rgba(255,255,255,0.1)",
                color: "white", border: "none", width: 40, height: 40,
                borderRadius: "50%", fontSize: 16, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>🔊</button>
              <button onClick={toggleReceiver} title="Earpiece" style={{
                backgroundColor: !isSpeaker ? "#6366f1" : "rgba(255,255,255,0.1)",
                color: "white", border: "none", width: 40, height: 40,
                borderRadius: "50%", fontSize: 16, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>📞</button>
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); handleHangUp(); }} style={{
            backgroundColor: "#ef4444", color: "white", border: "none",
            width: 50, height: 50, borderRadius: "50%", fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 6px 15px rgba(239,68,68,0.4)"
          }}>
            🛑
          </button>
        </div>
      )}

      {/* ── Incoming Call Toast ───────────────────────────────────────────── */}
      {incomingCall && !activeCall && (
        <div style={{
          position: "fixed", top: 20, left: "50%",
          transform: "translateX(-50%)", width: "90%", maxWidth: 420,
          backgroundColor: "#1e293b", borderRadius: 16, padding: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
          zIndex: 100000, fontFamily: "'Outfit', sans-serif",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          // FIX 3: animation now works because keyframe is defined above
          animation: "slideDown 0.3s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
            }}>👤</div>
            <div>
              <h4 style={{ color: "white", margin: 0, fontSize: 15, fontWeight: 700 }}>
                {incomingCall.callerName}
              </h4>
              <p style={{ color: "#34d399", margin: "2px 0 0 0", fontSize: 12, fontWeight: 500 }}>
                📞 Incoming App Call…
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleAnswerCall(); }}
              title="Answer"
              style={{
                backgroundColor: "#16a34a", color: "white", border: "none",
                width: 40, height: 40, borderRadius: "50%", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 10px rgba(22,163,74,0.3)"
              }}
            >📞</button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeclineCall(); }}
              title="Decline"
              style={{
                backgroundColor: "#ef4444", color: "white", border: "none",
                width: 40, height: 40, borderRadius: "50%", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 10px rgba(239,68,68,0.3)"
              }}
            >🛑</button>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalCallManager;
