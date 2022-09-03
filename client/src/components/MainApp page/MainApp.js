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
        {window.screen.width <= 500 ? <GameBoard /> : <></>}
        <Bet />
      </div>
      {window.screen.width > 500 ? <GameBoard /> : <></>}
      <GameHistory />

      <Footer />
    </div>
  );
};
