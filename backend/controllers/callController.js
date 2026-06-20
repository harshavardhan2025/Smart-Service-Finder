import CallSession from "../models/CallSession.js";
import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

// Initiate a call — caller creates an offer SDP
export const initiateCall = async (req, res) => {
  try {
    const { bookingId, offerSdp } = req.body;
    if (!bookingId || !offerSdp) {
      return res.status(400).json({ error: "bookingId and offerSdp are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Only allow calls during active statuses
    if (!["Accepted", "On the Way", "Started"].includes(booking.status)) {
      return res.status(400).json({ error: "Calls only available during active job execution." });
    }

    // End any existing ringing/connected calls for this booking
    await CallSession.updateMany(
      { booking_id: bookingId, status: { $in: ["ringing", "connected"] } },
      { status: "ended", ended_at: new Date() }
    );

    const callerId = req.user._id.toString();
    const callerEmail = (req.user.email || "").toLowerCase();

    // Determine who the callee is
    let calleeId, callerName, calleeName;
    const worker = await Worker.findById(booking.worker_id);
    const workerUser = worker ? await User.findOne({ email: worker.email }) : null;

    // Is the caller the customer?
    const isCallerCustomer = callerId === booking.customer_id?.toString();
    // Is the caller the worker?
    const isCallerWorker = worker && (
      callerEmail === (worker.email || "").toLowerCase() ||
      callerId === worker._id.toString()
    );

    if (isCallerCustomer) {
      calleeId = workerUser ? workerUser._id.toString() : booking.worker_id;
      callerName = booking.customer_name || "Customer";
      calleeName = worker ? worker.name : "Service Provider";
    } else if (isCallerWorker) {
      calleeId = booking.customer_id;
      callerName = worker ? worker.name : "Service Provider";
      calleeName = booking.customer_name || "Customer";
    } else {
      return res.status(403).json({ error: "You are not a participant in this booking." });
    }

    const session = await CallSession.create({
      booking_id: bookingId,
      caller_id: callerId,
      callee_id: calleeId,
      caller_name: callerName,
      callee_name: calleeName,
      status: "ringing",
      offer_sdp: offerSdp,
      caller_ice: [],
      callee_ice: []
    });

    console.log(`📞 [Call Initiated] ${callerName} → ${calleeName} | Session: ${session._id}`);
    res.status(201).json({ sessionId: session._id, status: "ringing" });
  } catch (err) {
    console.error("Error initiating call:", err);
    res.status(500).json({ error: err.message });
  }
};

// Check for incoming calls for the current user
export const checkIncomingCall = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userEmail = (req.user.email || "").toLowerCase();

    // Find ringing calls where this user is the callee
    let call = await CallSession.findOne({
      callee_id: userId,
      status: "ringing"
    }).sort({ createdAt: -1 }).lean();

    // Also check by email match (in case IDs differ between collections)
    if (!call) {
      // Find all ringing calls and check if any callee matches by booking lookup
      const ringingCalls = await CallSession.find({ status: "ringing" }).sort({ createdAt: -1 }).lean();
      for (const c of ringingCalls) {
        const booking = await Booking.findById(c.booking_id);
        if (!booking) continue;
        
        const worker = await Worker.findById(booking.worker_id);
        const isCalleeWorker = worker && userEmail === (worker.email || "").toLowerCase();
        const isCalleeCustomer = userId === booking.customer_id?.toString();
        
        if ((c.callee_id === userId) || isCalleeWorker || isCalleeCustomer) {
          // Verify this user is actually the callee, not the caller
          if (c.caller_id !== userId) {
            call = c;
            break;
          }
        }
      }
    }

    if (!call) {
      return res.status(200).json({ hasIncoming: false });
    }

    // Auto-expire calls older than 30 seconds
    const callAge = (Date.now() - new Date(call.createdAt).getTime()) / 1000;
    if (callAge > 30) {
      await CallSession.findByIdAndUpdate(call._id, { status: "missed", ended_at: new Date() });
      try {
        await Message.create({
          booking_id: call.booking_id,
          sender_id: call.caller_id,
          receiver_id: call.callee_id,
          text: "📞 App Call Missed"
        });
      } catch (err) {
        console.error("Error logging missed call message:", err);
      }
      return res.status(200).json({ hasIncoming: false });
    }

    res.status(200).json({
      hasIncoming: true,
      sessionId: call._id,
      callerName: call.caller_name,
      bookingId: call.booking_id,
      offerSdp: call.offer_sdp
    });
  } catch (err) {
    console.error("Error checking incoming call:", err);
    res.status(500).json({ error: err.message });
  }
};

// Answer a call — callee sends answer SDP
export const answerCall = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answerSdp } = req.body;

    if (!answerSdp) return res.status(400).json({ error: "answerSdp is required" });

    const session = await CallSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Call session not found" });
    if (session.status !== "ringing") {
      return res.status(400).json({ error: `Cannot answer call with status: ${session.status}` });
    }

    session.answer_sdp = answerSdp;
    session.status = "connected";
    session.started_at = new Date();
    await session.save();

    console.log(`📞 [Call Answered] Session: ${sessionId}`);
    res.status(200).json({ status: "connected" });
  } catch (err) {
    console.error("Error answering call:", err);
    res.status(500).json({ error: err.message });
  }
};

// Add ICE candidate
export const addIceCandidate = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { candidate, role } = req.body; // role: 'caller' or 'callee'

    if (!candidate) return res.status(400).json({ error: "candidate is required" });

    const session = await CallSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Call session not found" });

    if (role === "caller") {
      session.caller_ice.push(JSON.stringify(candidate));
    } else {
      session.callee_ice.push(JSON.stringify(candidate));
    }
    await session.save();

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error adding ICE candidate:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get full session state (for polling answer SDP + ICE candidates)
export const getCallSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await CallSession.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: "Call session not found" });

    res.status(200).json(session);
  } catch (err) {
    console.error("Error getting call session:", err);
    res.status(500).json({ error: err.message });
  }
};

// End a call
export const endCall = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await CallSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Call session not found" });

    session.status = "ended";
    session.ended_at = new Date();
    await session.save();

    console.log(`📞 [Call Ended] Session: ${sessionId}`);

    try {
      let durationStr = "";
      if (session.started_at) {
        const durationSec = Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 1000);
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        durationStr = ` (${minutes}m ${seconds}s)`;
      }
      await Message.create({
        booking_id: session.booking_id,
        sender_id: session.caller_id,
        receiver_id: session.callee_id,
        text: `📞 Call Ended${durationStr}`
      });
    } catch (err) {
      console.error("Error logging ended call message:", err);
    }

    res.status(200).json({ status: "ended" });
  } catch (err) {
    console.error("Error ending call:", err);
    res.status(500).json({ error: err.message });
  }
};

// Decline a call
export const declineCall = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await CallSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Call session not found" });

    session.status = "declined";
    session.ended_at = new Date();
    await session.save();

    console.log(`📞 [Call Declined] Session: ${sessionId}`);

    try {
      await Message.create({
        booking_id: session.booking_id,
        sender_id: session.callee_id,
        receiver_id: session.caller_id,
        text: `📞 Call Declined by ${session.callee_name}`
      });
    } catch (err) {
      console.error("Error logging declined call message:", err);
    }

    res.status(200).json({ status: "declined" });
  } catch (err) {
    console.error("Error declining call:", err);
    res.status(500).json({ error: err.message });
  }
};
