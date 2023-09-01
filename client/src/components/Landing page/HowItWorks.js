import React from "react";
import betScreenShotWithToken from "../assets/images/bet_screenshot_with_token.png";
import spsContractScreenShot from "../assets/images/sps_contract_screen.png";
import winScreenShot from "../assets/images/win_screenshot.png";
import loseScreenShot from "../assets/images/lose_screenshot.png";
import algorithmIcon from "../assets/icons/algorithm-icon.svg";
import teamIcon from "../assets/icons/team-icon.svg";
import rightArrow from "../assets/icons/arrow-right-icon.svg";
import leftArrow from "../assets/icons/arrow-left-icon.svg";
import downArrow from "../assets/icons/arrow-down-icon.svg";
import "../assets/styles/Landing/howItWorks.css";

export const HowItWorks = () => {
  return (
    <div className="how-it-works">
      <h2>How it works</h2>
      <div className="card-column">
        <div className="work-card-row">
          <div className="work-card">
            <div className="work-card-screenshot ">
              <img src={betScreenShotWithToken} alt="betScreenshot" />
            </div>
            <div className="work-card-description">
              <h4>Enter your bet that you are ready to spend</h4>
            </div>
          </div>
          <div className="arrow">
            <img src={rightArrow} alt="arrow" />
          </div>
          <div className="mobile-down-arrow">
            <img src={downArrow} alt="arrow" />
          </div>
          <div className="work-card">
            <div className="work-card-screenshot ">
              <img
                src={spsContractScreenShot}
                alt="betScreenshot"
                className="darken"
              />
            </div>
            <div className="work-card-description">
              <h4>Your tokens come to sps-fi contract</h4>
            </div>
          </div>
          <div className="arrow">
            <img src={rightArrow} alt="arrow" />
          </div>
          <div className="mobile-down-arrow">
            <img src={downArrow} alt="arrow" />
          </div>
          <div className="work-card">
            <div className="work-card-screenshot ">
              <img src={algorithmIcon} alt="algorithIcon" />
            </div>
            <div className="work-card-description">
              <h4>You play with program that randomly choose item</h4>
            </div>
          </div>
        </div>
        <div className="arrow-down-icon">
          <div className="fixed-arrow" />
          <img src={downArrow} alt="arrowDown" />
        </div>

        <div className="mobile-down-arrow">
          <img src={downArrow} alt="arrow" />
        </div>
        <div className="work-card-row">
          <div className="work-card-mobile-v">
            <div className="work-card-screenshot ">
              <img src={winScreenShot} alt="winScreenShot" className="darken" />
            </div>
            <div className="work-card-description">
              <h4>If you win, you will immidiately recieve 2x of your bet</h4>
            </div>
          </div>

          <div className="mobile-down-arrow">
            <img src={downArrow} alt="arrow" />
          </div>
          <div className="work-card-mobile-v">
            <div className="work-card-screenshot ">
              <img
                src={loseScreenShot}
                alt="loseScreenShot"
                className="darken"
              />
            </div>
            <div className="work-card-description">
              <h4>If you lose, you will not recieve anything</h4>
            </div>
          </div>

          <div className="mobile-down-arrow">
            <img src={downArrow} alt="arrow" />
          </div>
          <div className="work-card-mobile-v">
            <div className="work-card-screenshot ">
              <img src={teamIcon} alt="teamIcon" />
            </div>

            <div className="work-card-description">
              <div className="column-grouped-h4">
                <h4>Questions left?</h4>
                <div className="row-grouped-h4">
                  <h4> Ask it to our</h4>
                  <a href="/#/team">
                    <h4 className="semi-bold">team</h4>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="work-card row-2">
            <div className="work-card-screenshot ">
              <img src={teamIcon} alt="teamIcon" />
            </div>

            <div className="work-card-description">
              <div className="column-grouped-h4">
                <h4>Questions left?</h4>
                <div className="row-grouped-h4">
                  <h4> Ask it to our</h4>
                  <a href="/#/team">
                    <h4 className="semi-bold">team</h4>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="arrow">
            <img src={leftArrow} alt="arrow" />
          </div>

          <div className="work-card row-2">
            <div className="work-card-screenshot ">
              <img
                src={loseScreenShot}
                alt="loseScreenShot"
                className="darken"
              />
            </div>
            <div className="work-card-description">
              <h4>If you lose, you will not recieve anything</h4>
            </div>
          </div>
          <div className="arrow">
            <img src={leftArrow} alt="arrow" />
          </div>

          <div className="work-card row-2">
            <div className="work-card-screenshot ">
              <img src={winScreenShot} alt="winScreenShot" className="darken" />
            </div>
            <div className="work-card-description">
              <h4>If you win, you will immidiately recieve 2x of your bet</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
