import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setUser, setToken } from "../../../features/user/UserSlice"; // Assuming setToken manages the boolean
import "../../../styles/AuthForm.css";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);

  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();



  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setStatus("Logging in...");

    try {
      const result = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await result.json();
      localStorage.setItem('user', JSON.stringify(data));
      dispatch(setUser({ userId: data.id, username: data.username, email: data.email, latitude: data.latitude, longitude: data.longitude, token: true }))
      console.log(user)
      if (!data.latitude || !data.longitude) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const id = data.id;
            const response = await fetch(`${process.env.REACT_APP_API_URL}/location`, {
              method: 'POST',
              body: JSON.stringify({ latitude, longitude, id }),
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
            });
            if (!response.ok) {
              console.log(`Error updating location : ${response}`);
            } else {
              dispatch(setUser({ userId: data.id, username: data.username, email: data.email, latitude: data.latitude, longitude: data.longitude, token: true }))
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setError("Please enable location services to use this app.");
          }
        );
      } else {
        dispatch(setUser({ userId: data.id, username: data.username, email: data.email, latitude: data.latitude, longitude: data.longitude, token: true }))
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };


  const handleSignup = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setStatus("Creating account...");

    if (!username.trim()) {
      setError("Please enter your username");
      setIsLoading(false);
      return;
    }

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log("Location access granted");
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Please enable location services to use this app.");
        }
      );

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          username: username.trim(),
          latitude,
          longitude,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        dispatch(
          setUser({
            ...data,
            token: true,
          })
        );
        console.log("Registration successful");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form">
        {error && <p className="error-message">{error}</p>}
        {status && <p className="status-message">{status}</p>}
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
            name="email"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            name="password"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        {isRegistering && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              required
              disabled={isLoading}
            />
          </div>
        )}
        <div className="button-group">
          {!isRegistering ? (
            <>
              <button
                type="submit"
                className="auth-button"
                onClick={handleLogin}
                disabled={!email || !password || isLoading}
              >
                {isLoading ? "Processing..." : "Login"}
              </button>
              <button
                type="button"
                className="auth-button register-toggle"
                onClick={() => setIsRegistering(true)}
                disabled={isLoading}
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="auth-button signup-button"
                onClick={handleSignup}
                disabled={!email || !password || !username || isLoading}
              >
                {isLoading ? "Processing..." : "Complete Registration"}
              </button>
              <button
                type="button"
                className="auth-button back-button"
                onClick={() => setIsRegistering(false)}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
