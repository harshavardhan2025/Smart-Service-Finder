// Centralized, synchronized Wallet & Payment Ledger Utility

export const getWalletBalance = () => {
  try {
    const val = localStorage.getItem("userWalletBalance");
    if (val !== null && !isNaN(parseFloat(val))) {
      return parseFloat(val);
    }
  } catch (e) {}
  return 5000; // Authoritative default baseline wallet balance
};

export const setWalletBalance = (newBalance) => {
  const rounded = Math.max(0, Math.round(newBalance * 100) / 100);
  try {
    localStorage.setItem("userWalletBalance", rounded);
    window.dispatchEvent(new CustomEvent("walletUpdated", { detail: { balance: rounded } }));
  } catch (e) {}
  return rounded;
};

export const addToWallet = async (amount, reason = "Top Up", method = "Wallet Credit") => {
  const current = getWalletBalance();
  const updated = current + amount;
  setWalletBalance(updated);

  try {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: sessionStorage.getItem("userName") || "Verified User",
        worker: "System Admin",
        service: `Wallet Credit: ${reason}`,
        amount: amount,
        method: method,
        status: "Refunded"
      })
    });
  } catch (e) {
    console.error("Wallet credit transaction log error:", e);
  }

  return updated;
};

export const deductFromWallet = async (amount, reason = "Payment", method = "Wallet") => {
  const current = getWalletBalance();
  if (current < amount) {
    return { success: false, balance: current, error: `Insufficient Wallet Balance! Required ₹${amount}, Available ₹${current}` };
  }
  const updated = current - amount;
  setWalletBalance(updated);

  try {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: sessionStorage.getItem("userName") || "Verified User",
        worker: "System Admin",
        service: `Wallet Debit: ${reason}`,
        amount: amount,
        method: method,
        status: "Paid"
      })
    });
  } catch (e) {
    console.error("Wallet debit transaction log error:", e);
  }

  return { success: true, balance: updated };
};
