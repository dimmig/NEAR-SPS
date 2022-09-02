import React from "react";
import { Footer } from "../Landing page/Footer";
import { Balance } from "./Balance";
import { Header } from "./Header";
import { Bet } from "./Bet";
import { GameBoard } from "./GameBoard";
import { GameHistory } from "./GameHistory";
import "../assets/styles/MainApp/app.css";

export const MainApp = () => {
  return (
    <div className="container" id="container">
      <Header />

      <div className="balance-bet-row" id="balance-bet-row">
        <Balance />
        <div className="mobile">
          <GameBoard />
        </div>
        <Bet />
      </div>
      <div className="desktop">
        <GameBoard />
      </div>

      <GameHistory />

      <Footer />
    </div>
  );
};
