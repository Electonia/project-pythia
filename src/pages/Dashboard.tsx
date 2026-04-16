import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StockChart from "../components/StockChart";
import FinbertSentimentChart from "../components/FinbertChart";
import GainLossChart from "../components/GainLossChart";
import CommulativeChart from "../components/CommulativGainLoss";

/**
 * Helper function to retrieve user data safely from localStorage 
 * without causing cascading renders.
 */
const getInitialUser = () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Failed to parse user session", e);
      return null;
    }
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Initialize state directly from localStorage
  const [user, setUser] = useState(getInitialUser());
  const [selectedCompany, setSelectedCompany] = useState("AAPL");

  // Redirect to login if no session exists
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const cardStyle = {
    background: "linear-gradient(145deg, #1e1e1e, #161616)",
    padding: "24px",
    borderRadius: "16px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.05)",
    color: "#eaeaea",
    transition: "all 0.3s ease"
  };

  // Prevent rendering if user is being redirected
  if (!user) return null;

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Inter, Arial, sans-serif",
        background: "radial-gradient(circle at top left, #1a1a2e, #0f0f0f 60%)",
        color: "#ffffff",
        minHeight: "100vh"
      }}
    >
      {/* NAVIGATION / HEADER BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          padding: "15px 25px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: "600", margin: 0 }}>
          📈 Pythia Analytics Dashboard
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#aaa", fontSize: "12px", textTransform: "uppercase" }}>Logged in as</div>
            <div style={{ color: "#00ff96", fontWeight: "600" }}>{user.name}</div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
          padding: "16px 20px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(8px)"
        }}
      >
        <label
          htmlFor="companySelect"
          style={{ fontWeight: "500", fontSize: "14px", color: "#aaa" }}
        >
          Select Company Stock
        </label>

        <select
          id="companySelect"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{
            padding: "10px 14px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            outline: "none"
          }}
        >
          <option value="AAPL">Apple</option>
          <option value="ORCL">Oracle</option>
          <option value="SAP">SAP</option>
        </select>
      </div>

      {/* CHARTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "25px"
        }}
      >
        <div style={cardStyle}>
          <StockChart company={selectedCompany} />
        </div>

        <div style={cardStyle}>
          <FinbertSentimentChart company={selectedCompany} />
        </div>

        <div style={cardStyle}>
          <GainLossChart company={selectedCompany} />
        </div>

        <div style={cardStyle}>
          <CommulativeChart company={selectedCompany} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;