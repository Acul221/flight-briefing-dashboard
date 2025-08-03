import React from "react";
import { useNavigate } from "react-router-dom";

const quizTopics = [
  { name: "A320", path: "/quiz/a320" },
  { name: "A330", path: "/quiz/a330" },
  { name: "B737", path: "/quiz/b737" },
  { name: "Weather", path: "/quiz/weather" },
  { name: "ICAO", path: "/quiz/icao" },
  { name: "CRM", path: "/quiz/crm" },
  { name: "Airlaw", path: "/quiz/airlaw" },
  { name: "Human Performance", path: "/quiz/human%20performance" },
];

function QuizSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Select Quiz Topic</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        {quizTopics.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className="w-full py-4 px-6 rounded-xl shadow-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-lg font-semibold"
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuizSelector;
