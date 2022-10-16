import React from "react";
import "../assets/styles/MainApp/alert.css";

export const AlertMessage = ({ variant, rewardAmount }) => {
  return (
    <>
      {variant === "Win" ? (
        <div className="alert win-alert-color">
          <h4 className="win-message-color">You've won {rewardAmount / 2} USN!</h4>
        </div>
      ) : (
        <div className="alert lose-alert-color ">
          <h4 className="lose-message-color">
            You've lost {rewardAmount} USN!
          </h4>
        </div>
      )}
    </>
  );
};
