import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StockChart from "../components/StockChart";
import FinbertSentimentChart from "../components/FinbertChart";
import GainLossChart from "../components/GainLossChart";
import CommulativeChart from "../components/CommulativGainLoss";

interface StockItem {
  stock_name: string;
  stock_ticker: string;
}

interface SearchResult {
  name: string;
  ticker: string;
}

const getInitialUser = () => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getInitialUser());
  const [stocks, setStocks] = useState<StockItem[]>([]); 
  const [selectedCompany, setSelectedCompany] = useState(""); 
  const [loading, setLoading] = useState(true);

  // Search Modal States
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchStocks = async () => {
    try {
      const response = await fetch("http://46.101.3.179:5000/api/stock-list");
      const data = await response.json();
      setStocks(data);
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0].stock_ticker);
      }
    } catch (error) {
      console.error("Error fetching stock list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Search Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 0 && !selectedResult) {
        try {
          const res = await fetch(`http://46.101.3.179:5000/api/search-stocks?q=${searchTerm}`);
          const data = await res.json();
          setSearchResults(data);
        } catch (err) {
          console.error("Search fetch error:", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedResult]);

  const handleAddStock = async () => {
    if (!selectedResult) return;
    try {
      const response = await fetch("http://46.101.3.179:5000/api/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedResult.name, ticker: selectedResult.ticker }),
      });

      if (response.ok) {
        setShowModal(false);
        setSearchTerm("");
        setSelectedResult(null);
        await fetchStocks(); 
        setSelectedCompany(selectedResult.ticker);
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (err) {
      console.error("Add stock error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // YOUR ORIGINAL CARD STYLE
  const cardStyle = {
    background: "linear-gradient(145deg, #1e1e1e, #161616)",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.05)",
    color: "#eaeaea",
    transition: "all 0.3s ease"
  };

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
          onChange={(e) => {
            if (e.target.value === "ADD") setShowModal(true);
            else setSelectedCompany(e.target.value);
          }}
          disabled={loading}
          style={{
            padding: "10px 14px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            outline: "none"
          }}
        >
          {loading ? (
            <option>Loading stocks...</option>
          ) : (
            <>
              {stocks.map((stock) => (
                <option key={stock.stock_ticker} value={stock.stock_ticker}>
                  {stock.stock_name} ({stock.stock_ticker})
                </option>
              ))}
              <option value="ADD" style={{ color: "#00ff96", fontWeight: "bold" }}>
                + Add New Company Stock
              </option>
            </>
          )}
        </select>
      </div>

      {/* SEARCH MODAL */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0, color: "#00ff96" }}>Add Company Stock</h3>
            <input 
              style={modalInputStyle}
              placeholder="Type first letter (e.g. A)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedResult(null); }}
            />
            {searchResults.length > 0 && !selectedResult && (
              <div style={resultsContainerStyle}>
                {searchResults.map(res => (
                  <div key={res.ticker} style={resultItemStyle} onClick={() => { setSelectedResult(res); setSearchTerm(`${res.name} (${res.ticker})`); }}>
                    {res.name} (<strong>{res.ticker}</strong>)
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button disabled={!selectedResult} onClick={handleAddStock} style={saveBtnStyle}>Add</button>
              <button onClick={() => { setShowModal(false); setSearchTerm(""); }} style={cancelBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRID - ORIGINAL SINGLE COLUMN LAYOUT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "25px"
        }}
      >
        {selectedCompany ? (
          <>
            <div style={cardStyle}><StockChart company={selectedCompany} /></div>
            <div style={cardStyle}><FinbertSentimentChart company={selectedCompany} /></div>
            <div style={cardStyle}><GainLossChart company={selectedCompany} /></div>
            <div style={cardStyle}><CommulativeChart company={selectedCompany} /></div>
          </>
        ) : (
          !loading && <div style={{ textAlign: "center", color: "#666" }}>Please select a company to view analytics.</div>
        )}
      </div>
    </div>
  );
};

// Modal Styles (Kept Minimal to match your background)
const modalOverlayStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: "#161616", padding: "30px", borderRadius: "15px", width: "350px", border: "1px solid #333" };
const modalInputStyle: React.CSSProperties = { width: "100%", padding: "12px", background: "#000", border: "1px solid #444", color: "#fff", borderRadius: "8px", boxSizing: "border-box" };
const resultsContainerStyle: React.CSSProperties = { background: "#000", border: "1px solid #333", marginTop: "5px", borderRadius: "8px", maxHeight: "150px", overflowY: "auto" };
const resultItemStyle: React.CSSProperties = { padding: "10px", cursor: "pointer", borderBottom: "1px solid #222", fontSize: "14px" };
const saveBtnStyle: React.CSSProperties = { flex: 1, padding: "12px", background: "#00ff96", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000" };
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" };

export default Dashboard;