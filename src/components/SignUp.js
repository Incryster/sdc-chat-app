import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { useNavigate, Link } from "react-router-dom";
import { setDoc, doc } from "firebase/firestore";
import "./SignUp.css";

export default function SignUp() {
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPW] = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    if (!username || !password || !confirmPassword) {
      return setError("All fields are required.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    // we still need to pass an email to Firebase; we’ll stub one
    const email = `${username}@chatapp.com`;

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // save display‑username in Firestore in lowercase
      await setDoc(doc(db, "users", user.uid), {
        username: username.toLowerCase(),  // Convert username to lowercase
        email: user.email,
        createdAt: new Date()
      });

      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <h1 className="signup-logo">TalkSpace</h1>
        <h2>Create an account</h2>
        <p className="signup-subtext">
          Already have an account?{" "}
          <Link to="/login" className="signup-link">Sign in</Link>
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            placeholder="your username"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPW(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Signing up…" : "Sign Up"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
