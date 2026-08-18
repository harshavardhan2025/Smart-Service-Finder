// Wallet balance is stored in localStorage and synced via a custom event
export const getWalletBalance = () => {
  try {
    const val = localStorage.getItem("userWalletBalance");
    if (val !== null && !isNaN(parseFloat(val))) return parseFloat(val);
  } catch {}
  return 5000;
};

export const setWalletBalance = (newBalance) => {
  const rounded = Math.max(0, Math.round(newBalance * 100) / 100);
  try {
    localStorage.setItem("userWalletBalance", rounded);
    window.dispatchEvent(new CustomEvent("walletUpdated", { detail: { balance: rounded } }));
  } catch {}
  return rounded;
};

const logTransaction = async (payload) => {
  try {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Transaction log error:", e);
  }
};

export const addToWallet = async (amount, reason = "Top Up", method = "Wallet Credit") => {
  const updated = getWalletBalance() + amount;
  setWalletBalance(updated);
  await logTransaction({
    customer: sessionStorage.getItem("userName") || "User",
    worker: "System Admin", service: `Wallet Credit: ${reason}`,
    amount, method, status: "Refunded",
  });
  return updated;
};

export const deductFromWallet = async (amount, reason = "Payment", method = "Wallet") => {
  const current = getWalletBalance();
  if (current < amount)
    return { success: false, balance: current, error: `Insufficient balance. Required ₹${amount}, Available ₹${current}` };
  const updated = current - amount;
  setWalletBalance(updated);
  await logTransaction({
    customer: sessionStorage.getItem("userName") || "User",
    worker: "System Admin", service: `Wallet Debit: ${reason}`,
    amount, method, status: "Paid",
  });
  return { success: true, balance: updated };
};
