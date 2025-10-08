import React from "react";

export default function QuestionPreview({ question }) {
  if (!question) return null;

  const {
    question: qText,
    question_text, // fallback
    question_image_url,
    choices,
    choice_images,
    explanations,
    answer_key,
    correctIndex,
    difficulty,
    source,
    category,
    subcategory,
    tags,
  } = question;

  const letters = ["A", "B", "C", "D"];
  const resolvedAnswer =
    answer_key || letters[(typeof correctIndex === "number" ? correctIndex : 0)];

  const getChoiceText = (i) => {
    if (Array.isArray(choices)) return choices[i]?.text || "";
    return choices?.[letters[i]] || "";
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Preview Question</h3>

      <div>
        <p className="font-medium">{qText || question_text}</p>
        {question_image_url && (
          <img
            src={question_image_url}
            alt="Question"
            className="mt-2 max-h-48 rounded border object-contain"
          />
        )}
      </div>

      <div className="space-y-2">
        {letters.map((L, i) => (
          <div
            key={L}
            className={`p-2 border rounded ${
              resolvedAnswer === L ? "bg-green-50 border-green-400" : "bg-gray-50"
            }`}
          >
            <p className="font-medium">
              {L}. {getChoiceText(i)}
            </p>
            {choice_images?.[i] && (
              <img
                src={choice_images[i]}
                alt={`Choice ${L}`}
                className="mt-1 max-h-32 rounded border object-contain"
              />
            )}
            {explanations?.[i] && (
              <p className="text-xs text-gray-600 mt-1">💡 {explanations[i]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {difficulty && <p>Level: {difficulty}</p>}
        {source && <p>Source: {source}</p>}
        {category && <p>Category: {category}</p>}
        {subcategory && <p>SubCategory: {subcategory}</p>}
        {Array.isArray(tags) && tags.length > 0 && <p>Tags: {tags.join(", ")}</p>}
      </div>
    </div>
  );
}
