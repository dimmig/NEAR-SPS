import React, { useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import Big from "big.js";
import "../assets/styles/MainApp/gameHistory.css";
import { HiSTORY } from "../constants/hardcodedData";
import { HistoryList } from "./HistoryList";

export const GameHistory = () => {
  const context = useContext(ContextManager);
  const [history, setHistory] = useState([]);
  const [isNeedToMakeQuery, setIsNeedToMakeQuery] = useState(true);
  const [element, setElement] = useState(null);

  const signIn = () => {
    context.wallet.requestSignIn();
  };

  useEffect(() => {
    if (
      typeof context.currentUser !== "undefined" &&
      context.currentUser.accountId
    ) {
      getHistory();
    }
  }, []);

  const storeGames = async (games) => {
    const decimals = await context.usnContract.contract.ft_metadata();

    games.forEach((it) => {
      it.date = new Date(parseInt(it.date)).toString().split("G")[0];
      it.status === "Win"
        ? (it.assets = Big(it.assets)
            .div(Big(10).pow(decimals.decimals))
            .round(6)
            .div(2)
            .toFixed(2)) // decimals and half
        : (it.assets = Big(it.assets)
            .div(Big(10).pow(decimals.decimals))
            .round(6)
            .toFixed(2));
    });

    if (history.length !== 0 && typeof history !== "undefined") {
      games.map((game) => history.push(game));
      return setElement(<HistoryList history={history} />);
    }
    localStorage.setItem("gamesLen", history.length);
    setHistory(games);
  };

  const getHistory = async () => {
    const contract = context.contract;

    const historyList = await contract.get_games({
      player_id: context.currentUser.accountId,
      from_index: history.length === 0 ? history.length : history.length + 1,
      limit: 5,
    });

    if (historyList !== null) {
      if (historyList.length < 5) {
        setIsNeedToMakeQuery(false);
      }
      storeGames(historyList);
    }
  };

  return (
    <div className="game-history" id="game-history">
      {!context.currentUser ? (
        <>
          <div className="play-button history-wallet-button" id="button">
            <button onClick={signIn}>Connect wallet</button>
          </div>
          <div className="blured-bg">
            <div className="game-history-card">
              <div className="history-wrapper">
                <div className="history-title">
                  <h4>Game History</h4>
                </div>
              </div>
              <HistoryList history={HiSTORY} />
            </div>
          </div>
        </>
      ) : (
        <>
          {history !== null && history.length !== 0 ? (
            <div className="game-history-card">
              <div className="history-wrapper">
                <div className="history-title">
                  <h4>Game History</h4>
                </div>
              </div>
              <div
                className="scrollable-ul"
                onScroll={async (e) => {
                  const bottom =
                    e.target.scrollHeight - e.target.scrollTop ===
                    e.target.clientHeight;

                  if (bottom && isNeedToMakeQuery) {
                    getHistory();
                  }
                }}
              >
                {element === null && history !== null ? (
                  <HistoryList history={history} />
                ) : (
                  element
                )}
              </div>
            </div>
          ) : (
            <div className="game-history-card">
              <div className="history-wrapper no-border">
                <div className="history-title">
                  <h4>No games here yet...</h4>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
