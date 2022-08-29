import React, { useContext } from "react";
import { ContextManager } from "../..";
import logo from "../assets/images/sps_logo.png";
import "../assets/styles/Landing/header.css";

export const Header = () => {
  const context = useContext(ContextManager);

  const signIn = () => {
    context.wallet.requestSignIn();
  };

  const signOut = () => {
    context.wallet.signOut();
    localStorage.setItem("shouldPlay", false);
    window.location.reload();
  };

  return (
    <div className="header">
      <a href="http://localhost:3000/NEAR-SPS/#">
        <img src={logo} alt="logo" className="logo" />
      </a>
      {!context.currentUser ? (
        <div className="play-button" id="button">
          <button onClick={signIn}>Connect wallet</button>
        </div>
      ) : (
        <div className="logout-button">
          <button onClick={signOut}>Logout</button>
        </div>
      )}
    </div>
  );
};
