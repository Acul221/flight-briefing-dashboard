import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { mapDescriptionToAnimation } from "../../utils/mapDescriptionToAnimation";

export default function WeatherWidgetCustom({ city }) {
  const [weather, setWeather] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      let data = null;
      try {
        const apiKey = "dc6ac8a994b2ed7125bd15ade1e7b29f";
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        if (!response.ok) throw new Error("Failed to fetch weather data");
        data = await response.json();
        setWeather(data);

        const description = data.weather[0].description;
        const mappedIcon = mapDescriptionToAnimation(description);
        console.log("Mapped icon:", mappedIcon);
        console.log("Description:", description);
        
        try {
          const animation = await import(
            `../../assets/animations/weather/${mappedIcon}.json`
          );
          setAnimationData(animation.default);
        } catch (animationErr) {
          console.error("Failed to load animation JSON:", animationErr);
          const fallbackAnimation = await import(
            `../../assets/animations/weather/sunny.json`
          );
          setAnimationData(fallbackAnimation.default);
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        if (data) {
          console.log("Weather description:", data.weather[0].description);
        }
      }
    };

    fetchWeather();
  }, [city]);

  return (
    <motion.div
      className="w-64 p-4 rounded-xl backdrop-blur-md bg-white/30 dark:bg-gray-800/40 border border-white/20 dark:border-gray-600 shadow-lg hover:shadow-xl transition duration-300"
      whileHover={{ scale: 1.05 }}
    >
      {animationData && (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="w-24 mx-auto mb-2"
        />
      )}
      {weather && (
        <>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {weather.name}
          </h3>
          <p className="capitalize mb-1 text-gray-700 dark:text-gray-300">
            {weather.weather[0].description}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(weather.main.temp)}°C
          </p>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>💧 {weather.main.humidity}%</span>
            <span>🌬️ {weather.wind.speed} m/s</span>
          </div>
        </>
      )}
      {!weather && <p>Loading...</p>}
    </motion.div>
  );
}
