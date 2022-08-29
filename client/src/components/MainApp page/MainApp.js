import React, { useContext, useState } from "react";
import { Footer } from "../Landing page/Footer";
import { Balance } from "./Balance";
import { Header } from "./Header";
import "../assets/styles/MainApp/app.css";
import { Bet } from "./Bet";
import { GameBoard } from "./GameBoard";
import { GameHistory } from "./GameHistory";
import { ContextManager } from "../../index";

export const MainApp = () => {
  return (
    <div className="container" id="container">
      <Header />
      <div className="balance-bet-row" id="balance-bet-row">
        <Balance />
        <Bet />
      </div>
      <GameBoard />

      <GameHistory />
      <Footer />
    </div>
  );
};
