import React, { useCallback, useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import usnIcon from "../assets/images/usn_image.png";
import "../assets/styles/MainApp/bet.css";
import { FT_TGAS, ONE_YOCTO } from "../constants/near-utils";

export const Bet = () => {
  const context = useContext(ContextManager);

  const [betAmount, setBetAmount] = useState(null);
  const [errorText, setErrorText] = useState(null);

  const item = JSON.parse(localStorage.getItem("item-button"));

  const signIn = () => {
    context.wallet.requestSignIn();
  };
  useEffect(() => {
    sessionStorage.removeItem("item-button");
  }, []);

  const onClick = async () => {
    localStorage.setItem("shouldPlay", true);
    const usnBalance = JSON.parse(localStorage.getItem("usn-balance"));
    const usnContract = context.usnContract.contract;
    const usnConfig = context.usnContract.config;

    if (betAmount > usnBalance) {
      return setErrorText("Not enough balance!");
    }

    if (isNaN(betAmount) || betAmount === null || betAmount === "") {
      return setErrorText("Write valid amount!");
    }

    if (item === null) {
      return setErrorText("Select your item!");
    }

    const parsedBet = await context.toPrecision(
      usnConfig.contractName,
      betAmount
    );

    const args = {
      player_id: context.currentUser.accountId,
      item_number: item,
      date: Date.now().toString(),
      assets: parsedBet,
    };

    await usnContract.ft_transfer_call(
      {
        receiver_id: context.contractConfig.contractName,
        amount: parsedBet,
        msg: JSON.stringify(args),
      },
      FT_TGAS,
      ONE_YOCTO
    );
  };

  return (
    <div className="bet" id="bet">
      <div className="bet-content">
        <h4 className="bet-text">BET:</h4>
        <div className="input-col">
          <input
            className="bet-input"
            onChange={(e) => setBetAmount(e.target.value)}
          />
          {!context.currentUser ? (
            <div className="play-button centered" id="button">
              <button onClick={signIn}>Play</button>
            </div>
          ) : (
            <div className="play-button centered" id="button">
              {JSON.parse(localStorage.getItem("shouldPlay")) ||
              JSON.parse(localStorage.getItem("isModalShown")) ? (
                <button disabled>Play</button>
              ) : (
                <button onClick={onClick}>Play</button>
              )}
            </div>
          )}
        </div>
        <div className="token">
          <img src={usnIcon} alt="usnIcon" />
          <h4 className="user-name-text token-text">USN</h4>
        </div>
      </div>
      <div className="error-text">
        <h4>{errorText}</h4>
      </div>
    </div>
  );
};
