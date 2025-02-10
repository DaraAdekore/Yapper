// screens/AuthScreen.tsx
import React from "react";
import { PulsatingLogo } from "../../Logo/PulsatingLogo";
import { BlipsAnimation } from "../../common/BlipsAnimation";
import AuthForm from "./AuthForm";
import "../../../styles/AuthScreen.css";

export const AuthScreen = () => {

  return (
    <div className="auth-screen">
      <BlipsAnimation />
      <PulsatingLogo />
      <AuthForm/>
    </div>
  );
};
