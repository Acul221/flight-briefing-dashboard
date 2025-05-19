import React, { useEffect, useState } from "react";

function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetch("/.netlify/functions/fetch-notion-questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const handleAnswer = (index) => {
    setSelected(index);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  if (!questions.length) return <div className="p-4">Loading questions...</div>;

  const q = questions[currentIndex];

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2">
        {currentIndex + 1}. {q.question}
      </h2>

      <div className="space-y-2">
        {q.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = choice.isCorrect;
          const borderColor =
            !showExplanation
              ? "border-gray-300"
              : isCorrect
              ? "border-green-500 bg-green-100"
              : isSelected
              ? "border-red-500 bg-red-100"
              : "border-gray-200";

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showExplanation}
              className={`w-full text-left p-3 border ${borderColor} rounded shadow-sm hover:shadow-md transition`}
            >
              <strong>{String.fromCharCode(65 + i)}.</strong> {choice.text}
              {showExplanation && isSelected && (
                <p className="mt-1 text-sm text-gray-600 italic">
                  {choice.explanation}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {showExplanation && currentIndex < questions.length - 1 && (
        <button
          onClick={handleNext}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Next Question
        </button>
      )}
    </div>
  );
}

export default QuizPage;
