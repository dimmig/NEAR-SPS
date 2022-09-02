import React, { useContext, useEffect, useState } from "react";
import { ContextManager } from "../..";
import { FT_TGAS } from "../constants/near-utils";
import "../assets/styles/MainApp/historyList.css";

export const HistoryList = (props) => {
  const context = useContext(ContextManager);

  const [rewards, setRewards] = useState(null);

  useEffect(() => {
    if (context.currentUser) {
      getUnRecievedRewards();
    }
  });

  const getUnRecievedRewards = async () => {
    const unRecievedRewards = await context.contract.get_finished_games({
      player_id: context.currentUser.accountId,
    });

    setRewards(unRecievedRewards);
  };

  const receiveAssets = async (id) => {
    const contract = context.contract;
    const finishedGames = await context.contract.get_finished_games({
      player_id: context.currentUser.accountId,
    });
    const gameStruct = finishedGames.filter((game) => game.id === id)[0];
    const args = {};

    args.player_id = context.currentUser.accountId;
    args.status = gameStruct.status;
    args.date = gameStruct.date;
    args.assets = gameStruct.assets;

    localStorage.setItem("shouldPlay", false);
    sessionStorage.removeItem("item-button");
    await contract.transfer_tokens_to_winner({
      callbackUrl: "https://dimmig.github.io/NEAR-SPS/#/app",
      args: { game: args },
      gas: FT_TGAS,
    });
  };

  const historyList = props.history.map((it) => {
    return (
      <div key={it.id}>
        <li className="list-row" key={it.id}>
          <div className="game-status">
            {it.status === "Win" ? (
              <h4 className="win-color">{it.status}</h4>
            ) : (
              <h4 className="lose-color">{it.status}</h4>
            )}
          </div>
          <div className="game-date">
            <h4>{it.date}</h4>
          </div>
          {typeof context.currentUser === "undefined" ||
          !context.currentUser.accountId ? (
            <div className="game-assets">
              {it.status === "Win" ? (
                <h4 className="win-color">
                  +{it.assets} {it.token}
                </h4>
              ) : (
                <h4 className="lose-color">
                  -{it.assets} {it.token}
                </h4>
              )}
            </div>
          ) : (
            <div className="game-assets">
              {it.status === "Win" ? (
                <>
                  <h4 className="win-color">+{it.assets} WUSN</h4>
                  {rewards !== null &&
                  rewards.filter((game) => game.id === it.id).length === 1 ? (
                    <div className="play-button">
                      <button onClick={() => receiveAssets(it.id)}>
                        Recieve
                      </button>
                    </div>
                  ) : (
                    <></>
                  )}
                </>
              ) : (
                <h4 className="lose-color">-{it.assets} WUSN</h4>
              )}
            </div>
          )}
        </li>
      </div>
    );
  });
  if (props.history.length > 2) {
    return <ul className="scrollable-ul">{historyList}</ul>;
  }
  return <ul>{historyList}</ul>;
};
