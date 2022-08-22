import React from "react";
import logo from "../assets/images/sps_logo.png";
import "../assets/styles/header.css";

export const Header = () => {
  return (
    <div className="header">
      <img src={logo} alt="logo" className="logo" />
      <div className="play-button">
        <a href="/#/app">
          <button>Play</button>
        </a>
      </div>
    </div>
  );
};
