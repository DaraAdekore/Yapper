import React from "react";
import "../../styles/PulsatingLogo.css";

export const PulsatingLogo = () => {
  return <div className="pulsating-logo" onClick={() => window.location.reload()}>Yapper</div>;
};
