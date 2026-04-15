import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom"; // Don't forget this import!

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // Note: Ensure your server is running on this specific IP/Port
      const response = await fetch("http://46.101.3.179:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: form.name,
            username: form.username,
            email: form.email,
            password: form.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful!");
        setForm({ name: "", username: "", email: "", password: "", confirmPassword: "" });
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Username</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={{ ...fieldGroup, marginBottom: "25px" }}>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        
        {/* Fixed Footer Link */}
        <p style={footerStyle}>
          Already have an account?{" "}
          <Link to="/Login" style={linkStyle}>Login here</Link>
        </p>

      </div>
    </div>
  );
};

// --- STYLES ---
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

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  padding: "40px",
  borderRadius: "20px",
  background: "#161616",
  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  color: "#fff"
};

const titleStyle: React.CSSProperties = { textAlign: "center" as const, marginBottom: "30px" };
const fieldGroup: React.CSSProperties = { marginBottom: "15px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", color: "#888", marginBottom: "5px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px", color: "#fff", boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #00ff9f, #00c47a)", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#000" };
const footerStyle: React.CSSProperties = { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#888" };
const linkStyle: React.CSSProperties = { color: "#00ff9f", textDecoration: "none", fontWeight: "600" };

export default Register;