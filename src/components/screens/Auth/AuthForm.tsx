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
        // First get location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error),
                { 
                    maximumAge: 0,
                    enableHighAccuracy: true,
                    timeout: 5000
                }
            );
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Then proceed with login
        const result = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const data = await result.json();
        
        // Update location immediately after successful login
        const locationResponse = await fetch(`${process.env.REACT_APP_API_URL}/location`, {
            method: 'POST',
            body: JSON.stringify({ 
                latitude, 
                longitude, 
                id: data.id 
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!locationResponse.ok) {
            throw new Error('Failed to update location');
        }

        // Store user data with the new location
        const userData = {
            ...data,
            latitude,
            longitude
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        dispatch(setUser({ 
            userId: data.id, 
            username: data.username, 
            email: data.email, 
            latitude, 
            longitude, 
            token: true 
        }));

    } catch (err) {
        if (err instanceof GeolocationPositionError) {
            setError("Location access is required. Please enable location services and try again.");
        } else {
            console.error('Login error:', err);
            setError('Login failed. Please try again.');
        }
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
        // Get location first
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error),
                { 
                    maximumAge: 0,  // Force fresh location
                    enableHighAccuracy: true,
                    timeout: 5000
                }
            );
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log({
            email,
            password,
            username: username.trim(),
            latitude,
            longitude,
        });

        const response = await fetch(`${process.env.REACT_APP_API_URL}/register`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                username: username.trim(),
                latitude,
                longitude,
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("user", JSON.stringify(data));
            dispatch(setUser({
                ...data,
                token: true,
            }));
            console.log("Registration successful");
        } else {
            setError(data.error || "Registration failed. Please try again.");
        }
    } catch (err) {
        if (err instanceof GeolocationPositionError) {
            setError("Location access is required. Please enable location services and try again.");
        } else {
            console.error("Error during registration:", err);
            setError("Registration failed. Please try again.");
        }
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
