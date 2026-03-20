import { useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      await API.post("/auth/signup", { name, email, password });
      alert("User created successfully. Please log in.");
      navigate("/");
    } catch (err) {
      console.error("Signup error", err);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      alert(`Signup failed${status ? ` (${status})` : ""}: ${message}`);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Sign Up</h2>

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          className="login-input"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="login-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleSignup}>
          Create account
        </button>

        <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}
