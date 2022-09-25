import React, { useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import usnIcon from "../assets/images/usn_image.png";
import {
  DEPOSIT,
  DEPOSIT_GAS,
  FT_TGAS,
  ONE_YOCTO,
} from "../constants/near-utils";
import "../assets/styles/MainApp/bet.css";
import { transactions } from "near-api-js";
import { actionsToTransaction } from "./transactions";

export const Bet = () => {
  const context = useContext(ContextManager);

  const [betAmount, setBetAmount] = useState(null);
  const [contractBalance, setContractBalance] = useState(null);
  const [errorText, setErrorText] = useState(null);

  const item = JSON.parse(sessionStorage.getItem("item-button"));

  useEffect(() => {
    getUsnContractBalance();
  });

  const signIn = () => {
    context.wallet.requestSignIn();
  };

  const getUsnContractBalance = async () => {
    const contract = context.usnContract.contract;
    const config = context.contractConfig;

    const balance = await contract.ft_balance_of({
      account_id: config.contractName,
    });

    setContractBalance((balance / 100000000 / 2).toFixed(2));
  };

  const isNeedToDeposit = async () => {
    const contract = context.contract;
    const currentUser = context.currentUser.accountId;

    const isRegistered = await contract.storage_balance_of({
      account_id: currentUser,
    });

    console.log(isRegistered);

    return !isRegistered;
  };

  const onClick = async () => {
    const usnBalance = parseFloat(
      JSON.parse(localStorage.getItem("usn-balance"))
    );
    const usnContract = context.usnContract.contract;
    const usnConfig = context.usnContract.config;

    const contract = context.contract;
    const contractConfig = context.contractConfig;

    const currentUser = context.currentUser.accountId;

    if (
      item === null ||
      document.getElementById("bet-input").classList.contains("disabled")
    ) {
      return setErrorText("Select your item!");
    }

    if (parseFloat(betAmount) > usnBalance) {
      return setErrorText("Not enough balance!");
    }

    if (isNaN(betAmount) || betAmount === null || betAmount === "") {
      return setErrorText("Write valid amount!");
    }

    if (
      contractBalance !== null &&
      parseInt(betAmount) > parseInt(contractBalance)
    ) {
      return setErrorText("Higher than max amount!");
    }

    const parsedBet = await context.toPrecision(
      usnConfig.contractName,
      betAmount
    );

    const args = {
      item_number: item,
      date: Date.now().toString(),
    };

    localStorage.setItem("shouldPlay", true);

    const isUserRegistered = await isNeedToDeposit();

    if (isUserRegistered) {
      try {
        const depositAmount = await contract.storage_balance_bounds();

        const depositAction = {
          args: { account_id: currentUser, registration_only: true },
          gas: DEPOSIT_GAS,
          methodName: "storage_deposit",
          deposit: depositAmount.min,
        };

        const depositTransaction = await actionsToTransaction(
          contractConfig.contractName,
          context.wallet,
          [depositAction]
        );

        const transferAction = {
          args: {
            receiver_id: context.contractConfig.contractName,
            amount: parsedBet,
            msg: JSON.stringify(args),
          },
          gas: FT_TGAS,
          deposit: ONE_YOCTO,
          methodName: "ft_transfer_call",
        };

        const transferTransaction = await actionsToTransaction(
          usnConfig.contractName,
          context.wallet,
          [transferAction]
        );

        return await context.wallet.requestSignTransactions([
          depositTransaction,
          transferTransaction,
        ]);
      } catch (e) {
        console.error(e);
      }
      return;
    }

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
    <div className="bet">
      <div className="bet-content" id="bet">
        <h4 className="bet-text">BET:</h4>
        <div className="input-col">
          <input
            className="bet-input"
            id="bet-input"
            placeholder={`max - ${contractBalance} USN`}
            onChange={(e) => {
              setBetAmount(e.target.value);
            }}
          />

          {!context.currentUser ? (
            <div className="play-button centered" id="button">
              <button onClick={signIn}>Play</button>
            </div>
          ) : (
            <div className="play-button centered" id="button">
              {(JSON.parse(localStorage.getItem("shouldPlay")) &&
                window.location.href.includes("transactionHashes")) ||
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
