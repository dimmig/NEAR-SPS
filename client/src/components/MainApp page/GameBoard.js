import React, { useContext, useEffect, useState } from "react";
import { RulesModal } from "./RulesModal";
import infoIcon from "../assets/icons/info-icon.svg";
import twoFingersHand from "../assets/images/2-fingers-hand.png";
import noFingersHand from "../assets/images/no-fingers-hand.png";
import fiveFingersHand from "../assets/images/5-fingers-hand.png";
import redCrosss from "../assets/images/red_cross_img.png";
import "../assets/styles/MainApp/gameBoard.css";
import { ContextManager } from "../..";
import { FT_TGAS } from "../constants/near-utils";

export const GameBoard = () => {
  const context = useContext(ContextManager);

  const [isShown, setIsShown] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameStruct, setGameStuct] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [tryAgain, setTryAgain] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  let [timer, setTimer] = useState(3);

  const item = JSON.parse(localStorage.getItem("item-button"));

  const getCurrentGameInfo = async () => {
    const contract = context.contract;

    const games = await contract.get_games({
      player_id: context.currentUser.accountId,
    });
    games.sort((a, b) => b.date - a.date);
    const currentGame = games[0];
    setGameStuct(currentGame);
    localStorage.setItem("gameStatus", currentGame.status);

    setGameStatus(currentGame.status);
  };

  useEffect(() => {
    if (JSON.parse(localStorage.getItem("shouldPlay"))) {
      getCurrentGameInfo();
    }
  });

  useEffect(() => {
    if (JSON.parse(localStorage.getItem("shouldPlay")) && !tryAgain) {
      return setShouldPlay(true);
    }
    setShouldPlay(false);
  }, [shouldPlay]);

  useEffect(() => {
    setTimeout(() => {
      if (timer > 0) {
        setTimer(timer - 1);
      }
    }, 1000);
  }, [timer]);

  useEffect(() => {
    if (JSON.parse(localStorage.getItem("shouldPlay"))) {
      window.addEventListener("unload", (e) => {
        if (shouldPlay && localStorage.getItem("gameStatus") === "Win") {
          e.preventDefault();
          setShouldPlay(false);
        }
      });
    }
  });

  const receiveAssets = async () => {
    const contract = context.contract;
    const args = {};

    args.player_id = context.currentUser.accountId;
    args.status = gameStruct.status;
    args.date = gameStruct.date;
    args.assets = gameStruct.assets;

    localStorage.setItem("shouldPlay", false);
    localStorage.removeItem("item-button");
    await contract.transfer_tokens_to_winner({
      callbackUrl: "http://localhost:3000/NEAR-SPS/#/app", //"https://dimmig.github.io/NEAR-SPS/#/app",
      args: { game: args },
      gas: FT_TGAS,
    });
  };

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
                            .getElementById("balance-bet-row")
                            .classList.add("blured-bg");

                          document
                            .getElementById("game-history")
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
                        localStorage.setItem("item-button", 1);
                        setSelected("You selected stone");
                        document
                          .getElementById("item-btn-1")
                          .classList.add(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-2")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-3")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
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
                        localStorage.setItem("item-button", 2);
                        setSelected("You selected scissors");
                        document
                          .getElementById("item-btn-2")
                          .classList.add(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-1")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-3")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
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
                        localStorage.setItem("item-button", 3);
                        setSelected("You selected paper");
                        document
                          .getElementById("item-btn-3")
                          .classList.add(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-2")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
                        document
                          .getElementById("item-btn-1")
                          .classList.remove(
                            "full-opacity",
                            "button-image-without-opacity"
                          );
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
                  {timer !== 0 ? (
                    <div className="rules-title">
                      <h4>{timer}</h4>
                    </div>
                  ) : (
                    <>
                      {gameStatus === "Win" ? (
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
                              <div className="play-button">
                                <button onClick={receiveAssets}>
                                  Receive assets
                                </button>
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
                              <div className="play-button">
                                <button onClick={receiveAssets}>
                                  Receive assets
                                </button>
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
                              <div className="play-button">
                                <button onClick={receiveAssets}>
                                  Receive assets
                                </button>
                              </div>
                            </div>
                          ) : (
                            <></>
                          )}
                        </>
                      ) : (
                        <div className="hands-column">
                          <div className="rules-title ">
                            <h4>You lose!</h4>
                          </div>
                          <div className="play-button">
                            <button
                              onClick={() => {
                                localStorage.removeItem("shouldPlay");
                                localStorage.removeItem("item-button");
                                setShouldPlay(false);
                                setTryAgain(true);
                                window.location.reload();
                              }}
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
