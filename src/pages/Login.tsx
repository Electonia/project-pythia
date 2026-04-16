import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://46.101.3.179:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        //alert("Login Successful!");
        // Store token if using JWT, then redirect
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/Dashboard");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
        console.error("Login failed:", error);
        alert("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Welcome to Project Pythia</h2>
        <form onSubmit={handleSubmit}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ ...fieldGroup, marginBottom: "25px" }}>
            <label style={labelStyle}>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={footerStyle}>
          Don't have an account?{" "}
          <Link to="/Registration" style={linkStyle}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

// --- STYLES (Matching your Registration Theme) ---
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Inter', sans-serif",
  // Adding the Background Image with a dark overlay
  backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/bg-img.jpg')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed" // Keeps the background static while scrolling
};
const cardStyle: React.CSSProperties = { width: "100%", maxWidth: "380px", padding: "40px", borderRadius: "20px", background: "#161616", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", color: "#fff" };
const titleStyle: React.CSSProperties = { textAlign: "center" as const, marginBottom: "30px" };
const fieldGroup: React.CSSProperties = { marginBottom: "15px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", color: "#888", marginBottom: "5px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px", color: "#fff", boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #00ff9f, #00c47a)", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000" };
const footerStyle: React.CSSProperties = { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#888" };
const linkStyle: React.CSSProperties = { color: "#00ff9f", textDecoration: "none", fontWeight: "600" };

export default Login;