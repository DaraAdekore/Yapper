import React from "react";
import "../../styles/PulsatingLogo-small-white.css";

export const PulsatingLogoSmallWhite = () => {
  return <div className="pulsating-logo-small-white" onClick={() => window.location.reload()}>Yapper</div>;
};
