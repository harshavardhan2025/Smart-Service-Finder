/**
 * sharedStore.js
 * Central localStorage bridge connecting Customer, Worker, and Admin modules.
 * All three modules read/write through these helper functions.
 */

// ─── TRANSACTIONS & WALLET ────────────────────────────────────────────────────────────
export function getTransactions() {
  return load(KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
}

export function addTransaction(txn) {
  const all = getTransactions();
  all.unshift({
    id: "TXN-" + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
    status: "Paid",
    ...txn
  });
  save(KEYS.TRANSACTIONS, all);
}

export function getWalletBalance() {
  return parseInt(localStorage.getItem("wallet_balance") || "1250");
}

export function updateWalletBalance(amountChange) {
  const current = getWalletBalance();
  const next = current + amountChange;
  localStorage.setItem("wallet_balance", next.toString());
  // Dispatch global event so UI updates instantly
  window.dispatchEvent(new Event("local-storage"));
  return next;
}

// ─── KEYS ───────────────────────────────────────────────────────
const KEYS = {
  BOOKINGS: "sh_bookings",
  REVIEWS: "sh_reviews",
  COMPLAINTS: "sh_complaints",
  WORKERS: "sh_workers",
  TRANSACTIONS: "sh_transactions",
  PLANS: "sh_plans",
  OFFERS: "sh_offers",
  NOTIFICATIONS: "sh_notifications"
};

// ─── SEED DEFAULTS (loaded once on first use) ────────────────────
const DEFAULT_BOOKINGS = [];

const DEFAULT_REVIEWS = [];

const DEFAULT_COMPLAINTS = [];

const DEFAULT_WORKERS = [];

const DEFAULT_TRANSACTIONS = [];

const DEFAULT_NOTIFICATIONS = [];

// ─── HELPERS ─────────────────────────────────────────────────────
const STORE_VERSION = "v5_local_sync";

function load(key, defaults) {
  try {
    const currentVersion = localStorage.getItem("sh_version");
    if (currentVersion !== STORE_VERSION) {
      localStorage.clear();
      localStorage.setItem("sh_version", STORE_VERSION);
      save(key, defaults);
      return defaults;
    }
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a global event so active components can listen and re-render if needed
  window.dispatchEvent(new Event("store_updated"));
}

// ─── BOOKINGS ─────────────────────────────────────────────────────
export function getBookings() { 
  return load(KEYS.BOOKINGS, DEFAULT_BOOKINGS); 
}
export function saveBookings(list) { save(KEYS.BOOKINGS, list); }

export function addBooking(booking) {
  const all = getBookings();
  const newBooking = {
    id: "BK" + Date.now(),
    ...booking,
    status: "Pending", // Start as pending for Worker to accept
  };
  save(KEYS.BOOKINGS, [newBooking, ...all]);

  addNotification({
    role: "worker",
    title: "New Booking Request!",
    message: `${booking.customer} requested ${booking.service}.`,
    type: "info"
  });

  addNotification({
    role: "admin",
    title: "New Booking Placed",
    message: `${booking.customer} booked ${booking.workerName}.`,
    type: "info"
  });

  // If payment done, add transaction
  if (booking.paymentMethod) {
    addTransaction({
      bookingId: newBooking.id,
      customer: booking.customer,
      worker: booking.workerName,
      service: booking.service,
      amount: booking.amount,
      method: booking.paymentMethod,
      icon: "💳"
    });
  }

  return newBooking;
}

export function updateBookingStatus(bookingId, newStatus) {
  const all = getBookings();
  const booking = all.find(b => b.id === bookingId);
  if (!booking) return;

  const updated = all.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
  save(KEYS.BOOKINGS, updated);

  // Notify User
  addNotification({
    role: "user",
    userId: booking.customer, // Normally an ID
    title: `Booking Update: ${newStatus}`,
    message: `Your booking for ${booking.service} is now ${newStatus}.`,
    type: newStatus === "Completed" ? "success" : "info"
  });
}

export function cancelBooking(bookingId, cancelledBy) {
  const all = getBookings();
  const booking = all.find(b => b.id === bookingId);
  if (!booking || booking.status === "Cancelled") return;

  const updated = all.map(b => b.id === bookingId ? { ...b, status: "Cancelled" } : b);
  save(KEYS.BOOKINGS, updated);

  // Refund if they paid via Wallet
  if (booking.paymentMethod === "Wallet") {
    updateWalletBalance(booking.amount);
    addTransaction({
      service: "Refund - " + booking.service,
      worker: booking.workerName,
      amount: booking.amount,
      method: "Wallet Refund",
      status: "Refunded",
      icon: "↩️"
    });
  }

  addNotification({
    role: cancelledBy === "worker" ? "user" : "worker",
    title: "Booking Cancelled",
    message: `Booking ${bookingId} was cancelled by ${cancelledBy}.`,
    type: "warning"
  });
}

// ─── REVIEWS ─────────────────────────────────────────────────────
export function getReviews() { return load(KEYS.REVIEWS, DEFAULT_REVIEWS); }

export function addReview(review) {
  const all = getReviews();
  const newReview = { id: "RV" + Date.now(), date: new Date().toISOString().slice(0, 10), ...review };
  save(KEYS.REVIEWS, [newReview, ...all]);

  // Update worker's rating dynamically
  const workers = getWorkers();
  const updated = workers.map(w => {
    if (w.id === review.workerId) {
      const newTotalReviews = w.reviews + 1;
      const newRating = ((w.rating * w.reviews) + review.rating) / newTotalReviews;
      return { ...w, rating: Math.min(5, parseFloat(newRating.toFixed(1))), reviews: newTotalReviews };
    }
    return w;
  });
  save(KEYS.WORKERS, updated);

  return newReview;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────
export function getNotifications(role) {
  const all = load(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  return role ? all.filter(n => n.role === role || n.role === "all") : all;
}

export function addNotification(notification) {
  const all = getNotifications();
  const newNotif = {
    id: "NTF" + Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };
  save(KEYS.NOTIFICATIONS, [newNotif, ...all]);
}

export function markNotificationsRead(role) {
  const all = load(KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  const updated = all.map(n => n.role === role ? { ...n, read: true } : n);
  save(KEYS.NOTIFICATIONS, updated);
}

// ─── COMPLAINTS ───────────────────────────────────────────────────
export function getComplaints() { return load(KEYS.COMPLAINTS, DEFAULT_COMPLAINTS); }

export function addComplaint(complaint) {
  const all = getComplaints();
  const newComplaint = {
    id: "CP" + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    adminVerdict: "Pending",
    ratingDeducted: 0,
    status: "Under Review",
    ...complaint,
  };
  save(KEYS.COMPLAINTS, [newComplaint, ...all]);

  return newComplaint;
}

export function verdictComplaint(complaintId, verdict) {
  const all = getComplaints();
  const updated = all.map(c => {
    if (c.id === complaintId) {
      const deduction = verdict === "Valid" ? 0.2 : 0;
      // Deduct rating from worker if valid
      if (verdict === "Valid") {
        const workers = getWorkers();
        const updatedWorkers = workers.map(w =>
          w.id === c.workerId ? { ...w, rating: Math.max(1, parseFloat((w.rating - deduction).toFixed(1))) } : w
        );
        save(KEYS.WORKERS, updatedWorkers);
      }
      return { ...c, adminVerdict: verdict, ratingDeducted: deduction, status: "Resolved" };
    }
    return c;
  });
  save(KEYS.COMPLAINTS, updated);
}

// ─── WORKERS ─────────────────────────────────────────────────────
export function getWorkers() { 
  return load(KEYS.WORKERS, DEFAULT_WORKERS); 
}
export function saveWorkers(list) { save(KEYS.WORKERS, list); }

// Duplicate getTransactions removed here to fix SyntaxError
// ─── PLANS & OFFERS SEEDS & ACCESSORS ──────────────────────────────
const DEFAULT_PLANS = [];

const DEFAULT_OFFERS = [];

export function getPlans() { return load(KEYS.PLANS, DEFAULT_PLANS); }
export function savePlans(list) { save(KEYS.PLANS, list); }

export function getOffers() { return load(KEYS.OFFERS, DEFAULT_OFFERS); }
export function saveOffers(list) { save(KEYS.OFFERS, list); }
