import React from "react";
import cancelImage from "../assets/icons/cancel-icon.svg";
import twoFingersHand from "../assets/images/2_fingers_hand_modal.png";
import noFingersHand from "../assets/images/no_fingers_hand_modal.png";
import fiveFingersHand from "../assets/images/5_fingers_hand_modal.png";
import "../assets/styles/MainApp/rulesModal.css";

export const RulesModal = (props) => {
  if (props.isShown === true) {
    return (
      <div className="rules-modal" id="modal">
        <div className="cancel-icon-block">
          <img
            src={cancelImage}
            alt="cancelIcon"
            onClick={() => {
              sessionStorage.setItem("isShown", false);
              localStorage.setItem("isModalShown", false);
              document.getElementById("modal").classList.remove("rules-modal");
              document.getElementById("modal").classList.add("not-visible");
              document
                .getElementById("game-board")
                .classList.remove("blured-bg");
            }}
            className="cancel-icon"
          />
        </div>
        <div className="modal">
          <h4>Item 1</h4>
          <h4 className="plus-sign">+</h4>
          <h4>Item 2</h4>
          <h4 className="eaqual-sign">=</h4>
          <h4>Winner</h4>
        </div>
        <div className="modal-column">
          <div className="modal">
            <img src={twoFingersHand} alt="twoFingersHand" />
            <h4>+</h4>
            <img src={noFingersHand} alt="noFingersHand" />
            <h4>=</h4>
            <img src={noFingersHand} alt="noFingersHand" />
          </div>

          <div className="modal">
            <img src={twoFingersHand} alt="twoFingersHand" />
            <h4>+</h4>
            <img src={fiveFingersHand} alt="fiveFingersHand" />
            <h4>=</h4>
            <img src={twoFingersHand} alt="twoFingersHand" />
          </div>

          <div className="modal">
            <img src={noFingersHand} alt="noFingersHand" />
            <h4>+</h4>
            <img src={fiveFingersHand} alt="fiveFingersHand" />
            <h4>=</h4>
            <img src={fiveFingersHand} alt="fiveFingersHand" />
          </div>
        </div>
      </div>
    );
  }
};
