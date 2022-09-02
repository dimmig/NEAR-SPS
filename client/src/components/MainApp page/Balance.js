import React, { useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import userIcon from "../assets/icons/user-icon.svg";
import usnIcon from "../assets/images/usn_image.png";
import ContentLoader from "react-content-loader";
import "../assets/styles/MainApp/balance.css";

export const Balance = () => {
  const context = useContext(ContextManager);

  const [usnBalance, setUsnBalance] = useState(null);

  useEffect(() => {
    if (context.currentUser) {
      getUsnBalance();
    }
  });

  const signIn = () => {
    context.wallet.requestSignIn();
  };

  const getUsnBalance = async () => {
    const usnContract = context.usnContract.contract;

    const balance = await usnContract.ft_balance_of({
      account_id: context.currentUser.accountId,
    });
    const parsedBalance = await context.fromPrecision("wusn.testnet", balance);
    localStorage.setItem("usn-balance", parsedBalance);
    setUsnBalance(parsedBalance);
  };

  return (
    <div className="balance" id="balance">
      {!context.currentUser ? (
        <>
          <div className="play-button balance-wallet-button" id="button">
            <button onClick={signIn}>Connect wallet</button>
          </div>
          <div className="blured-bg">
            <div className="user-name">
              <img src={userIcon} alt="userIcon" className="user-icon" />
              <h4 className="user-name-text bold">username.near</h4>
              <h4 className="user-name-text">balances</h4>
            </div>
            <div className="token-balance">
              <div className="icon-amount">
                <img src={usnIcon} alt="usnIcon" />
                <h4 className="user-name-text">USN</h4>
              </div>
              <h4 className="user-name-text bold">100.00</h4>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="user-name">
            <img src={userIcon} alt="userIcon" className="user-icon" />
            <h4 className="user-name-text bold">
              {context.currentUser.accountId}
            </h4>
            <h4 className="user-name-text">balances</h4>
          </div>

          <div className="token-balance">
            {usnBalance === null ? (
              <ContentLoader
                className="loader"
                backgroundColor={"#eee"}
                foregroundColor={"#ebebeb"}
              >
                <rect x="0" y="0" rx="5" ry="5" width="400" height="70" />
              </ContentLoader>
            ) : (
              <>
                {usnBalance !== 0 ? (
                  <>
                    <div className="icon-amount">
                      <img src={usnIcon} alt="usnIcon" />
                      <h4 className="user-name-text">USN</h4>
                    </div>

                    <h4 className="user-name-text bold">{usnBalance}</h4>
                  </>
                ) : (
                  <h4 className="user-name-text">You don't have USN token</h4>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
