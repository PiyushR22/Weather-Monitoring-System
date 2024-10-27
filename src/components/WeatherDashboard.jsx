import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2"; // For data visualization
import "./weatherDashboard.css"; // Updated CSS styles

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the components you need
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const cities = [
  "Delhi",
  "Mumbai",
  "Chennai",
  "Bangalore",
  "Kolkata",
  "Hyderabad",
];

const WeatherDashboard = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const [dailySummaries, setDailySummaries] = useState({});
  const [alerts, setAlerts] = useState([]);
  const alertThreshold = 35; // Example threshold for alerts

  const fetchWeatherData = async () => {
    try {
      const responses = await Promise.all(
        cities.map((city) =>
          axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=e16f2ee96d4b80162cfcf29eefc61609`
          )
        )
      );

      const processedData = responses.map((response) => {
        const data = response.data;
        const tempC = data.main.temp - 273.15; // Convert Kelvin to Celsius
        const feelsLikeC = data.main.feels_like - 273.15; // Convert Kelvin to Celsius
        const mainCondition = data.weather[0].main;

        return {
          city: data.name,
          temp: tempC,
          feels_like: feelsLikeC,
          main: mainCondition,
          dt: new Date(data.dt * 1000),
        };
      });

      setWeatherData(processedData);
      updateDailySummaries(processedData); // Aggregate data
      checkForAlerts(processedData); // Check if alerts need to be triggered
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Aggregate daily weather data
  const updateDailySummaries = (data) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const todayData = data.reduce(
      (acc, curr) => {
        acc.tempSum += curr.temp;
        acc.maxTemp = Math.max(acc.maxTemp, curr.temp);
        acc.minTemp = Math.min(acc.minTemp, curr.temp);
        acc.conditions.push(curr.main);
        return acc;
      },
      { tempSum: 0, maxTemp: -Infinity, minTemp: Infinity, conditions: [] }
    );

    const avgTemp = todayData.tempSum / data.length;
    const dominantCondition = getDominantCondition(todayData.conditions);

    setDailySummaries((prev) => ({
      ...prev,
      [today]: {
        avgTemp,
        maxTemp: todayData.maxTemp,
        minTemp: todayData.minTemp,
        dominantCondition,
      },
    }));
  };

  // Determine dominant weather condition
  const getDominantCondition = (conditions) => {
    const conditionCounts = conditions.reduce((acc, condition) => {
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(conditionCounts).reduce((a, b) =>
      conditionCounts[a] > conditionCounts[b] ? a : b
    );
  };

  // Check for alert thresholds
  const checkForAlerts = (data) => {
    const alertsTriggered = data.filter((d) => d.temp > alertThreshold);
    if (alertsTriggered.length >= 2) {
      setAlerts((prev) => [
        ...prev,
        `Alert: Temperature exceeded ${alertThreshold}°C in two or more cities.`,
      ]);
    }
  };
  const getTemperatureEmoji = (temp) => {
    if (temp > 30) return "☀️"; // Hot
    if (temp > 20) return "🌤️"; // Warm
    return "❄️"; // Cold
  };

  // Function to get emoji based on feels like temperature
  const getFeelsLikeEmoji = (feelsLike) => {
    if (feelsLike > 30) return "☀️"; // Hot
    if (feelsLike > 20) return "🌤️"; // Warm
    return "❄️"; // Cold
  };

  // Function to get emoji based on time of day
  const getTimeEmoji = (date) => {
    const hour = date.getHours();
    return hour >= 6 && hour < 18 ? "☀️" : "🌙"; // Sun for daytime, moon for night
  };

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
    document.body.classList.toggle("dark-theme");
  };

  return (
    <div>
      <div>
        <button className="toggle-button" onClick={toggleTheme}>
          {isDarkTheme ? "🌙" : "☀️"}
        </button>
        <h1>Weather Monitoring System</h1>
        <div className="card-container">
          {weatherData?.map((data, index) => (
            <div className="weather-card" key={index}>
              <h2>
                {data.city} {getTimeEmoji(data.dt)} {/* Time-based emoji */}
              </h2>
              <p>
                {getTemperatureEmoji(data.temp)} Temperature:{" "}
                {data.temp.toFixed(2)} °C
              </p>
              <p>
                {getFeelsLikeEmoji(data.feels_like)} Feels Like:{" "}
                {data.feels_like.toFixed(2)} °C
              </p>
              <p>📅 Date & Time: {data.dt.toString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Display Alerts */}
      <div className="alerts">
        <h2>Alerts</h2>
        {alerts.map((alert, index) => (
          <p key={index}>{alert}</p>
        ))}
      </div>

      {/* Visualize Daily Summaries */}
      <div className="summary-chart">
        <h2>Daily Weather Summary</h2>
        <Line
          data={{
            labels: Object.keys(dailySummaries),
            datasets: [
              {
                label: "Avg Temperature (°C)",
                data: Object.values(dailySummaries).map(
                  (summary) => summary.avgTemp
                ),
                borderColor: "blue",
                fill: false,
              },
              {
                label: "Max Temperature (°C)",
                data: Object.values(dailySummaries).map(
                  (summary) => summary.maxTemp
                ),
                borderColor: "red",
                fill: false,
              },
              {
                label: "Min Temperature (°C)",
                data: Object.values(dailySummaries).map(
                  (summary) => summary.minTemp
                ),
                borderColor: "green",
                fill: false,
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default WeatherDashboard;