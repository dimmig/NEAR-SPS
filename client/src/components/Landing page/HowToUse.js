import React from "react";
import wallet from "../assets/images/wallet.png";
import nearIcon from "../assets/images/near_icon.png";
import arrow from "../assets/images/right_direct_arrow.png";
import balanceScreenshot from "../assets/images/balance_screenshot.png";
import betScreenShot from "../assets/images/bet_screenshot.png";
import "../assets/styles/Landing/howToUse.css";

export const HowToUse = () => {
  return (
    <div className="how-use">
      <h2>How to use</h2>

      <div className="card-row">
        <div className="card">
          <h3>1</h3>
          <div className="card-data">
            <img src={wallet} alt="wallet" />
            <img src={arrow} alt="arrow" />
            <img src={nearIcon} alt="near-icon" />
          </div>
          <div className="card-description">
            <h4>Connect</h4>
            <h4 className="blue-text">NEAR</h4>
            <h4>wallet</h4>
          </div>
        </div>
        <div className="card">
          <h3>2</h3>
          <div className="balance-screenshot">
            <img src={balanceScreenshot} alt="balance screenshot" />
          </div>
          <div className="card-description">
            <h4>Check your balance</h4>
          </div>
        </div>
        <div className="card">
          <h3>3</h3>
          <div className="bet-screenshot">
            <img src={betScreenShot} alt="betScreenshot" />
          </div>
          <div className="card-description">
            <h4>Start play and earn!</h4>
          </div>
        </div>
      </div>
    </div>
  );
};
