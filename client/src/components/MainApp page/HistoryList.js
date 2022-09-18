import React, { useContext } from "react";
import { ContextManager } from "../..";
import "../assets/styles/MainApp/historyList.css";

export const HistoryList = (props) => {
  const context = useContext(ContextManager);

  const historyList = props.history.map((it) => {
    return (
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
              <h4 className="win-color">+{it.assets} WUSN</h4>
            ) : (
              <h4 className="lose-color">-{it.assets} WUSN</h4>
            )}
          </div>
        )}
      </li>
    );
  });
  if (props.history.length > 2) {
    return <ul>{historyList}</ul>;
  }
  return <ul>{historyList}</ul>;
};
