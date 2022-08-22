import React from "react";
import { Routes, Route } from "react-router-dom";
import { Landing } from "./Landing page/Landing";
import { MainApp } from "./MainApp";

export const Switcher = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<MainApp />} />
    </Routes>
  );
};
