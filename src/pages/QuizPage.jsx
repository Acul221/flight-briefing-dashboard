import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function QuizPage() {
  const { aircraft, subject } = useParams();
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
    fetch("/.netlify/functions/fetch-notion-questions")
      .then((res) => res.json())
      .then((data) => {
        const relevant = data.filter(
          (q) =>
            q.tags.includes(aircraft.toUpperCase()) &&
            q.tags.some((t) => t.toLowerCase().includes(subject))
        );
        setQuestions(relevant);
        setFilteredQuestions(relevant);

        const tags = new Set();
        const sources = new Set();
        relevant.forEach(q => {
          q.tags.forEach(t => tags.add(t));
          if (q.source) sources.add(q.source);
        });
        setAllTags([...tags]);
        setAllSources(["All", ...sources]);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [aircraft, subject]);

  useEffect(() => {
    const filtered = questions.filter(q => {
      const matchLevel = levelFilter === "All" || q.level.toLowerCase() === levelFilter.toLowerCase();
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

  if (!filteredQuestions.length) return <div className="p-4">Loading questions...</div>;

  const LevelBadge = ({ level }) => {
    const color = level === "easy" ? "bg-green-500" : level === "medium" ? "bg-yellow-500" : "bg-red-500";
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded text-white ${color}`}>{level}</span>
    );
  };

  const q = filteredQuestions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {aircraft.toUpperCase()} / {subject.toUpperCase()} — Quiz
        </h2>
        <div className="flex items-center gap-2">
          <LevelBadge level={q.level.toLowerCase()} />
          {q.source && <span className="text-xs text-gray-500 italic">{q.source}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        >
          <option value="All">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        >
          {allSources.map((src) => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>

        <div className="flex gap-2 overflow-x-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                tagFilter === tag
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {currentIndex + 1}. {q.question}
      </h3>

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

      {showExplanation && (
        <button
          onClick={handleNext}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {currentIndex < filteredQuestions.length - 1 ? "Next Question" : "Finish & Review"}
        </button>
      )}
    </div>
  );
}

export default QuizPage;
