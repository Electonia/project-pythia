import { useState } from "react";
import StockChart from "../components/StockChart";
import FinbertSentimentChart from "../components/FinbertChart";
import GainLossChart from "../components/GainLossChart";
import CommulativeChart from "../components/CommulativGainLoss";

const Dashboard = () => {
  const [selectedCompany, setSelectedCompany] = useState("AAPL");

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

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Inter, Arial, sans-serif",
        background:
          "radial-gradient(circle at top left, #1a1a2e, #0f0f0f 60%)",
        color: "#ffffff",
        minHeight: "100vh"
      }}
    >
      {/* HEADER */}
      <h1
        style={{
          marginBottom: "30px",
          fontSize: "28px",
          fontWeight: "600",
          letterSpacing: "0.5px"
        }}
      >
        <center>📈 Pythia Analytics Dashboard</center>
      </h1>

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
          style={{
            fontWeight: "500",
            fontSize: "14px",
            color: "#aaa"
          }}
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
            outline: "none",
            boxShadow: "0 0 10px rgba(0,255,150,0.1)"
          }}
        >
          <option value="AAPL">Apple</option>
          <option value="ORCL">Oracle</option>
          <option value="SAP">SAP</option>
        </select>
      </div>

      {/* GRID */}
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