import React from "react";
import telegramIcon from "../assets/icons/telegram-icon.svg";
import twitterIcon from "../assets/icons/twitter-icon.svg";
import githubIcon from "../assets/icons/github-icon.svg";
import "../assets/styles/footer.css";

export const Footer = () => {
  return (
    <div className="footer">
      <a href="/#/telegram">
        <img src={telegramIcon} alt="telegram-icon" />
      </a>
      <a href="/#/twitter">
        <img src={twitterIcon} alt="twitter-icon" />
      </a>
      <a href="/#/github">
        <img src={githubIcon} alt="github-icon" />
      </a>
    </div>
  );
};
