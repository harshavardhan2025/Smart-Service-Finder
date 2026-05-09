import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const navigate = useNavigate();

  const handlePayment = () => {
    if (!paymentMethod) {
      alert("Please select a payment method!");
      return;
    }
    alert(`Payment of ₹500 via ${paymentMethod} successful! 🎉 Redirecting to Dashboard...`);
    navigate("/dashboard");
  };

  return (
    <div
      style={{
        padding: "20px"
      }}
    >
      <h1>Payment Page</h1>

      <h3>Select Payment Method</h3>

      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="">Choose</option>
        <option value="UPI">UPI</option>
        <option value="Card">Card</option>
        <option value="Cash">Cash</option>
      </select>

      <br />
      <br />

      <button onClick={handlePayment}>
        Pay Now
      </button>

      <h3>
        Selected: {paymentMethod}
      </h3>
    </div>
  );
}

export default PaymentPage;
