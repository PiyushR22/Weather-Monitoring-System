// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WeatherDashboard from "./components/WeatherDashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WeatherDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;