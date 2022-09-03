import React, { useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import "../assets/styles/MainApp/gameHistory.css";
import { HiSTORY } from "../constants/hardcodedData";
import { HistoryList } from "./HistoryList";

export const GameHistory = () => {
  const context = useContext(ContextManager);
  const [history, setHistory] = useState(null);

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

  const getHistory = async () => {
    const contract = context.contract;

    const historyList = await contract.get_games({
      player_id: context.currentUser.accountId,
    });
    let finishedGames = await context.contract.get_finished_games({
      player_id: context.currentUser.accountId,
    });

    if (historyList !== null) {
      historyList.sort((a, b) => b.date - a.date);

      for (let i = 0; i < historyList.length; i++) {
        if (finishedGames !== null) {
          for (let k = 0; k < finishedGames.length; k++) {
            if (finishedGames[k].id === historyList[i].id) {
              finishedGames[k].assets /= 100000000;
              finishedGames[k].date = new Date(parseInt(finishedGames[k].date))
                .toString()
                .split("G")[0];
              historyList.splice(i, 1);
            }
          }
        }
      }
      if (finishedGames === null) {
        finishedGames = [];
      }
      historyList.forEach(async (it) => {
        it.assets /= 100000000;
        it.date = new Date(parseInt(it.date)).toString().split("G")[0];
        finishedGames.push(it);
      });
    }
    setHistory(finishedGames);
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
          {history !== null ? (
            <div className="game-history-card">
              <div className="history-wrapper">
                <div className="history-title">
                  <h4>Game History</h4>
                </div>
              </div>
              <HistoryList history={history} />
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
