import { Link } from "react-router-dom";

function UserDashboard() {

  return (
    <div
      style={{
        padding: "20px"
      }}
    >

      <h1>User Dashboard</h1>

      <div
        style={{
          border: "1px solid gray",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "15px"
        }}
      >

        <h3>My Bookings</h3>

        <p>
          Electrician booking on
          20 May
        </p>

      </div>

      <div
        style={{
          border: "1px solid gray",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "15px"
        }}
      >

        <h3>Payments</h3>

        <p>
          ₹500 Paid Successfully
        </p>

      </div>

      <div
        style={{
          border: "1px solid gray",
          padding: "15px",
          borderRadius: "10px"
        }}
      >

        <h3>Support</h3>

        <Link to="/support">
          <button>
            Create Ticket
          </button>
        </Link>

      </div>

    </div>
  );
}

export default UserDashboard;
