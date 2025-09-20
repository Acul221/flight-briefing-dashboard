// src/pages/SubjectSelector.jsx
// Aliaskan SubjectSelector ke QuizSelector agar UI/UX & logika 1 sumber.
// Route /quiz/:aircraft tetap berfungsi karena QuizSelector membaca :aircraft.
export { default } from "./QuizSelector";
