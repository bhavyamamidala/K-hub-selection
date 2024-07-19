import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./signup.css"; // Import your CSS file here

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/signup/", {
        username,
        password,
      });
      if (response && response.data) {
        alert(response.data.message);
        navigate("/");
      } else {
        alert("Unexpected response format.");
      }
    } catch (error) {
      // Log the error object to the console for debugging
      console.error("Error object:", error);
      
      if (error.response && error.response.data) {
        alert(error.response.data.detail);
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="signuppage">
    <div className="signup-container">
      <h2 className="signup-title">Signup</h2>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Signup</button>
      </form>
      <p>
        Already have an account? <Link to="/">Login here</Link>
      </p>
    </div>
    </div>
  );
}

export default Signup;
