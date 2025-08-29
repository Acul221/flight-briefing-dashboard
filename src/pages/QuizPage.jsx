import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function QuizPage() {
  const { aircraft, subject } = useParams();
  const decodedSubject = decodeURIComponent(subject);

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelFilter, setLevelFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState("All");
  const [allTags, setAllTags] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isReview, setIsReview] = useState(false);

  useEffect(() => {
    fetch(
      `/.netlify/functions/fetch-notion-questions?aircraft=${aircraft}&subject=${subject}`
    )
      .then((res) => res.json())
      .then((data) => {
        const shuffled =
          subject === "all" ? [...data].sort(() => Math.random() - 0.5) : data;

        setQuestions(shuffled);
        setFilteredQuestions(shuffled);

        const tags = new Set();
        const sources = new Set();
        shuffled.forEach((q) => {
          q.tags.forEach((t) => tags.add(t));
          if (q.source) sources.add(q.source);
        });
        setAllTags([...tags]);
        setAllSources(["All", ...sources]);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [aircraft, subject]);

  useEffect(() => {
    const filtered = questions.filter((q) => {
      const matchLevel =
        levelFilter === "All" ||
        q.level.toLowerCase() === levelFilter.toLowerCase();
      const matchTag = !tagFilter || q.tags.includes(tagFilter);
      const matchSource = sourceFilter === "All" || q.source === sourceFilter;
      return matchLevel && matchTag && matchSource;
    });
    setFilteredQuestions(filtered);
    setCurrentIndex(0);
    setSelected(null);
    setShowExplanation(false);
    setAnswers([]);
    setIsReview(false);
  }, [levelFilter, tagFilter, sourceFilter, questions]);

  const handleAnswer = (index) => {
    setSelected(index);
    setShowExplanation(true);
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = index;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setSelected(null);
      setShowExplanation(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsReview(true);
    }
  };

  if (!filteredQuestions.length)
    return <div className="p-4">Loading questions...</div>;

  const LevelBadge = ({ level }) => {
    const color =
      level === "easy"
        ? "bg-green-500"
        : level === "medium"
        ? "bg-yellow-500"
        : "bg-red-500";
    return (
      <span
        className={`inline-block px-2 py-1 text-xs rounded text-white ${color}`}
      >
        {level}
      </span>
    );
  };

  const q = filteredQuestions[currentIndex];
  const correctAnswers = filteredQuestions.filter((q, i) => {
    const selectedIndex = answers[i];
    return q.choices[selectedIndex]?.isCorrect;
  });
  const percentage = Math.round(
    (correctAnswers.length / filteredQuestions.length) * 100
  );
  const resultColor =
    percentage >= 80
      ? "text-green-600"
      : percentage >= 50
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-white">
      <button
        onClick={() => (window.location.href = `/quiz/${aircraft}`)}
        className="mb-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300"
      >
        ← Back to Subjects
      </button>

      {isReview ? (
        <>
          <div className="mb-8 border p-4 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-2">Grade Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {aircraft.toUpperCase()} - {decodedSubject.toUpperCase()} | Exam
              Summary
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Correct {correctAnswers.length} of {filteredQuestions.length}{" "}
              questions
            </p>
            <p className={`text-lg font-semibold ${resultColor}`}>
              {percentage}% {percentage >= 80 ? "Passed" : "Failed"}
            </p>
          </div>

          {filteredQuestions.map((question, idx) => {
            const selectedIdx = answers[idx];
            const nomor = `N°${String(idx + 1).padStart(3, "0")}`;
            return (
              <div
                key={idx}
                className="mb-6 border p-4 rounded-lg bg-white dark:bg-gray-800"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {nomor} — ID: {question.id}
                </p>
                <p className="font-semibold mb-2">
                  Question {idx + 1} of {filteredQuestions.length}:{" "}
                  {question.question}
                </p>

                {/* ✅ tampilkan gambar soal di review */}
                {question.questionImage && (
                  <img
                    src={question.questionImage}
                    alt="Question"
                    className="max-h-60 rounded mb-3 border"
                  />
                )}

                {question.choices.map((choice, i) => {
                  const isCorrect = choice.isCorrect;
                  const isSelected = selectedIdx === i;
                  const base = "px-3 py-2 rounded-md border mb-1";
                  const style = isCorrect
                    ? "border-green-500 bg-green-100 dark:bg-green-800"
                    : isSelected
                    ? "border-red-500 bg-red-100 dark:bg-red-800"
                    : "border-gray-300 dark:border-gray-700";

                  return (
                    <div key={i} className={`${base} ${style}`}>
                      <strong>{String.fromCharCode(65 + i)}.</strong>{" "}
                      {choice.text}

                      {/* ✅ tampilkan gambar pilihan di review */}
                      {choice.image && (
                        <img
                          src={choice.image}
                          alt={`Choice ${i}`}
                          className="max-h-32 rounded mt-2 border"
                        />
                      )}

                      <p className="text-xs italic mt-1 text-gray-600 dark:text-gray-300">
                        {choice.explanation}
                      </p>
                      {isSelected && (
                        <span className="ml-2 italic text-sm">(Your Answer)</span>
                      )}
                      {isCorrect && (
                        <span className="ml-2 italic text-sm">(Correct)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {aircraft.toUpperCase()} / {decodedSubject.toUpperCase()} — Quiz
            </h2>
            <div className="flex items-center gap-2">
              <LevelBadge level={q.level.toLowerCase()} />
              {q.source && (
                <span className="text-xs text-gray-500 italic">{q.source}</span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            N°{String(currentIndex + 1).padStart(3, "0")} — ID: {q.id}
          </p>
          <h3 className="text-lg font-semibold mb-2">
            Question {currentIndex + 1} of {filteredQuestions.length}:{" "}
            {q.question}
          </h3>

          {/* ✅ tampilkan gambar soal di quiz */}
          {q.questionImage && (
            <img
              src={q.questionImage}
              alt="Question"
              className="max-h-60 rounded mb-4 border"
            />
          )}

          <div className="space-y-2">
            {q.choices.map((choice, i) => {
              const isCorrect = choice.isCorrect;
              const isSelected = selected === i;
              const borderColor = !showExplanation
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

                  {/* ✅ tampilkan gambar pilihan di quiz */}
                  {choice.image && (
                    <div className="mt-2">
                      <img
                        src={choice.image}
                        alt={`Choice ${String.fromCharCode(65 + i)}`}
                        className="max-h-32 rounded border"
                      />
                    </div>
                  )}

                  {showExplanation && (
                    <p className="mt-1 text-sm text-gray-600 italic">
                      {choice.explanation}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <button
              onClick={handleNext}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {currentIndex < filteredQuestions.length - 1
                ? "Next Question"
                : "Finish & Review"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default QuizPage;
