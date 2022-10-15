import React, { useContext, useEffect, useState } from "react";
import { RulesModal } from "./RulesModal";
import infoIcon from "../assets/icons/info-icon.svg";
import twoFingersHand from "../assets/images/2_fingers_hand.png";
import noFingersHand from "../assets/images/no_fingers_hand.png";
import fiveFingersHand from "../assets/images/5_fingers_hand.png";
import redCrosss from "../assets/images/red_cross_img.png";
import { ContextManager } from "../..";
import { AlertMessage } from "./Alert";
import "../assets/styles/MainApp/gameBoard.css";

export const GameBoard = () => {
  const context = useContext(ContextManager);

  const [isShown, setIsShown] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameStruct, setGameStuct] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [assets, setAssets] = useState(null);
  const [button, setButton] = useState(null);
  const [isWinScreen] = useState(false);
  const [tryAgain, setTryAgain] = useState(false);

  const item = JSON.parse(sessionStorage.getItem("item-button"));

  useEffect(() => {
    if (button === null) {
      document.getElementById("bet-input").classList.add("disabled");
      document.getElementById("bet-input").setAttribute("disabled", "disabled");
    }
  }, [button]);

  const getCurrentGameInfo = async () => {
    const contract = context.contract;

    const games = await contract.get_games({
      player_id: context.currentUser.accountId,
      from_index: 0,
      limit: 1,
    });

    if (games !== null) {
      const currentGame = games[0];
      setGameStuct(currentGame);

      localStorage.setItem("currentGame", JSON.stringify(currentGame));
      localStorage.setItem("gameStatus", currentGame.status);

      setGameStatus(currentGame.status);
      setAssets(currentGame.assets / 100000000);
    }
  };

  useEffect(() => {
    if (JSON.parse(localStorage.getItem("shouldPlay"))) {
      getCurrentGameInfo();
    }

    if (JSON.parse(localStorage.getItem("shouldPlay")) && !tryAgain) {
      return setShouldPlay(true);
    }
    setShouldPlay(false);
  }, [shouldPlay, tryAgain, isWinScreen]);

  return (
    <div>
      {shouldPlay === null ? (
        <></>
      ) : (
        <>
          {!shouldPlay || typeof context.currentUser === "undefined" ? (
            <>
              <RulesModal isShown={isShown} id="modal" />
              <div className="game-board" id="game-board">
                <div className="game-board-card">
                  <div className="card-info">
                    <div className="rules-title">
                      <h4>Rules</h4>
                      <img
                        src={infoIcon}
                        alt="infoIcon"
                        onClick={() => {
                          setIsShown(true);
                          localStorage.setItem("isModalShown", true);

                          document
                            .getElementById("game-board")
                            .classList.add("blured-bg");

                          document
                            .getElementById("modal")
                            .classList.remove("not-visible");
                          document
                            .getElementById("modal")
                            .classList.add("rules-modal");
                        }}
                      />
                    </div>
                    {selected === null ? (
                      <h5>Select your item</h5>
                    ) : (
                      <h5>{selected}</h5>
                    )}
                  </div>

                  <div className="hands-row">
                    <button
                      onClick={() => {
                        sessionStorage.setItem("item-button", 1);
                        setSelected("You selected stone");
                        setButton(1);

                        document
                          .getElementById("bet-input")
                          .classList.remove("disabled");

                        document
                          .getElementById("bet-input")
                          .removeAttribute("disabled");

                        document
                          .getElementById("item-btn-1")
                          .classList.add("full-opacity");

                        document
                          .getElementById("item-btn-2")
                          .classList.remove("full-opacity");
                        document
                          .getElementById("item-btn-3")
                          .classList.remove("full-opacity");
                      }}
                    >
                      <img
                        src={noFingersHand}
                        alt="noFingersHand"
                        id="item-btn-1"
                        className="button-image"
                      />
                    </button>

                    <button
                      onClick={() => {
                        sessionStorage.setItem("item-button", 2);
                        setSelected("You selected scissors");
                        setButton(2);

                        document
                          .getElementById("bet-input")
                          .classList.remove("disabled");

                        document
                          .getElementById("bet-input")
                          .removeAttribute("disabled");

                        document
                          .getElementById("item-btn-2")
                          .classList.add("full-opacity");
                        document
                          .getElementById("item-btn-1")
                          .classList.remove("full-opacity");
                        document
                          .getElementById("item-btn-3")
                          .classList.remove("full-opacity");
                      }}
                    >
                      <img
                        src={twoFingersHand}
                        alt="twoFingersHand"
                        id="item-btn-2"
                        className="button-image"
                      />
                    </button>

                    <button
                      onClick={() => {
                        sessionStorage.setItem("item-button", 3);
                        setSelected("You selected paper");
                        setButton(3);

                        document
                          .getElementById("bet-input")
                          .classList.remove("disabled");

                        document
                          .getElementById("bet-input")
                          .removeAttribute("disabled");

                        document
                          .getElementById("item-btn-3")
                          .classList.add("full-opacity");
                        document
                          .getElementById("item-btn-2")
                          .classList.remove("full-opacity");
                        document
                          .getElementById("item-btn-1")
                          .classList.remove("full-opacity");
                      }}
                    >
                      <img
                        src={fiveFingersHand}
                        alt="fiveFingersHand"
                        id="item-btn-3"
                        className="button-image"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="game-board" id="game-board">
              <div className="game-board-card">
                <div className="card-info">
                  <>
                    {gameStatus === "Win" || isWinScreen ? (
                      <>
                        <div className="rules-title ">
                          <h4>You won!</h4>
                        </div>
                        <div className="user-item-text-row">
                          <h4 className="user-item-text">
                            {context.currentUser.accountId} item
                          </h4>
                          <h4 className="user-item-text">
                            {context.contractConfig.contractName} item
                          </h4>
                        </div>

                        {item === 1 ? (
                          <div className="hands-column ">
                            <div className="after-game-row ">
                              <img
                                src={twoFingersHand}
                                alt="twoFingersHand"
                                id="item-btn-2"
                                className="button-win-image"
                              />
                              <img
                                src={redCrosss}
                                alt="redCross"
                                className="red-cross"
                              />
                              <img
                                src={fiveFingersHand}
                                alt="fiveFingersHand"
                                id="item-btn-3"
                                className="button-win-image"
                              />
                            </div>
                          </div>
                        ) : (
                          <></>
                        )}

                        {item === 2 ? (
                          <div className="hands-column">
                            <div className="after-game-row">
                              <img
                                src={twoFingersHand}
                                alt="noFingersHand"
                                id="item-btn-2"
                                className="button-win-image"
                              />
                              <img
                                src={redCrosss}
                                alt="redCross"
                                className="red-cross"
                              />
                              <img
                                src={fiveFingersHand}
                                alt="twoFingersHand"
                                id="item-btn-3"
                                className="button-win-image"
                              />
                            </div>
                          </div>
                        ) : (
                          <></>
                        )}
                        {item === 3 ? (
                          <div className="hands-column">
                            <div className="after-game-row">
                              <img
                                src={twoFingersHand}
                                alt="fiveFingersHand"
                                id="item-btn-2"
                                className="button-win-image"
                              />
                              <img
                                src={redCrosss}
                                alt="redCross"
                                className="red-cross"
                              />
                              <img
                                src={fiveFingersHand}
                                alt="noFingersHand"
                                id="item-btn-3"
                                className="button-win-image"
                              />
                            </div>
                          </div>
                        ) : (
                          <></>
                        )}
                      </>
                    ) : (
                      <></>
                    )}

                    {gameStatus === "Lose" ? (
                      <div className="hands-column">
                        <div className="rules-title ">
                          <h4>You lose!</h4>
                        </div>
                        <div className="play-button">
                          <button
                            onClick={() => {
                              localStorage.removeItem("shouldPlay");
                              sessionStorage.removeItem("item-button");
                              setShouldPlay(false);
                              setTryAgain(true);
                              window.location.reload();
                            }}
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                  </>
                </div>
                {window.screen.width > 500 && gameStruct !== null ? (
                  <>
                    <AlertMessage variant={gameStatus} rewardAmount={assets} />
                  </>
                ) : (
                  <></>
                )}
                {gameStatus === "Win" ? (
                  <div className="play-button win-try-again-button">
                    <button
                      onClick={() => {
                        localStorage.removeItem("shouldPlay");
                        sessionStorage.removeItem("item-button");
                        setShouldPlay(false);
                        setTryAgain(true);
                        window.location.reload();
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
