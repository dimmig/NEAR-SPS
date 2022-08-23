import React from "react";
import { Header } from "./Header";
import display from "../assets/images/display.png";
import { HowToUse } from "./HowToUse";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";
import "../assets/styles/Landing/landing.css";

export const Landing = () => {
  return (
    <div className="container">
      <Header />
      <div className="title">
        <div className="build">
          <h2>NEAR</h2>
          <h4>-built</h4>
        </div>
        <div className="sps">
          <h3 className="stone">Stone</h3>
          <h3 className="paper">Paper</h3>
          <h3 className="scissors">Scissors</h3>
        </div>
        <div className="sub-title">
          <p>Play,</p>
          <p>Earn,</p>
          <p>Enjoy</p>
        </div>
      </div>
      <div className="display-img">
        <img src={display} alt="display" />
      </div>
      <HowToUse />
      <HowItWorks />
      <Footer />
    </div>
  );
};
