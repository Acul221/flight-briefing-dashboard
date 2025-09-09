import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import QuizHeader from "@/components/quiz/QuizHeader";
import QuestionCard from "@/components/quiz/QuestionCard";
import QuizFooterNav from "@/components/quiz/QuizFooterNav";
import SkeletonQuestion from "@/components/quiz/SkeletonQuestion";
import QuestionNavigator from "@/components/quiz/QuestionNavigator";
import UpgradeLimitModal from "@/components/quiz/UpgradeLimitModal";

import ExamModeBar from "./ExamModeBar";
import ExamTimeUpModal from "./ExamTimeUpModal";

import useQuizSession from "@/hooks/useQuizSession";
import useExamTimer from "@/hooks/useExamTimer";
import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { logEvent } from "@/lib/analytics";

function resolveStatus(session, subscription) {
  if (!session) return "guest";
  // adapt to your table fields
  if (subscription?.status === "active" || subscription?.plan === "pro" || subscription?.tier === "pro") {
    return "pro";
  }
  return "inactive";
}

export default function ExamPage() {
  const navigate = useNavigate();
  const { aircraft, subject } = useParams();
  const decodedSubject = decodeURIComponent(subject || "");

  // quiz state
  const {
    loading,
    questions,
    currentIndex,
    answers,
    isReview,
    selected,
    answer,
    next,
    setIsReview,
    setShowExplanation,
  } = useQuizSession({ aircraft, subject });

  // auth
  const { session, loading: sessionLoading } = useSession();
  const { subscription, loading: subLoading } = useSubscription();
  const { isAdmin, loading: profileLoading } = useProfile();

  const status = resolveStatus(session, subscription);
  const canExam = isAdmin || status === "pro"; // exam khusus pro/admin
  const loadingAll = loading || sessionLoading || subLoading || profileLoading;

  // full set; exam tidak pakai gating 10
  const total = questions.length;
  const viewIndex = Math.min(currentIndex, Math.max(total - 1, 0));

  // timer
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const {
    running: examRunning,
    duration: examDuration,
    timeLeft,
    start: startExam,
    stop: stopExam,
    reset: resetExam,
    setDuration: setExamDuration,
  } = useExamTimer({
    aircraft,
    subject,
    onExpire: () => {
      setIsReview(true);
      setTimeUpOpen(true);
      logEvent("exam_timeout", { aircraft, subject: decodedSubject });
    },
  });
  const examMode = examRunning;

  // analytics
  useEffect(() => { logEvent("exam_view", { aircraft, subject: decodedSubject }); }, [aircraft, decodedSubject]);
  useEffect(() => {
    const q = questions[viewIndex];
    if (q?.id) logEvent("question_view", { id: q.id, idx: viewIndex, mode: "exam" });
  }, [questions, viewIndex]);

  // CTA
  const toLogin = () => (window.location.href = "/login");
  const toPricing = () => (window.location.href = "/pricing");

  const goBack = () => navigate(`/quiz/${aircraft}`);

  // start/submit
  const startExamNow = (dur) => {
    resetExam();
    setShowExplanation(false); // hide explanation in exam
    startExam(dur);
    logEvent("exam_start", { duration: dur, aircraft, subject: decodedSubject });
  };
  const submitExamNow = () => {
    stopExam();
    setIsReview(true);
    logEvent("exam_submit", { aircraft, subject: decodedSubject });
  };

  // select handler: lock-on-select (tidak bisa ganti)
  const onSelectChoice = (i) => {
    if (!examMode) return;                // hanya boleh menjawab saat exam berjalan
    if (answers?.[viewIndex] != null) return; // sudah pilih → terkunci
    answer(i, { silent: true });          // tanpa explanation/confetti
  };

  // next: linear; user boleh next kapan pun, tapi biasanya habis jawab
  const handleNext = useCallback(() => {
    logEvent("nav_next", { idx: viewIndex, mode: "exam" });
    next();
  }, [viewIndex, next]);

  if (loadingAll) {
    return <div className="max-w-3xl mx-auto p-4"><SkeletonQuestion /></div>;
  }

  // gate: pro/admin only
  if (!canExam) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={goBack} className="mb-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Subjects
        </button>
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-5">
          <h2 className="text-xl font-bold mb-1">Exam requires Pro</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Please {status === "guest" ? "create an account or login" : "upgrade your plan"} to access full Exam Mode with timer and scoring.
          </p>
          <div className="flex gap-2">
            {status === "guest" ? (
              <>
                <button onClick={toLogin} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Login</button>
                <button onClick={toPricing} className="px-3 py-2 rounded border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20">See Plans</button>
              </>
            ) : (
              <button onClick={toPricing} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Upgrade to Pro</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button onClick={goBack} className="mb-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to Subjects</button>
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">Couldn’t load questions. Try again.</div>
      </div>
    );
  }

  const q = questions[viewIndex];

  // score untuk review (full, karena exam = full set)
  const correctCount = questions.reduce((acc, qq, i) => acc + (qq?.choices?.[answers[i]]?.isCorrect ? 1 : 0), 0);

  return (
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-white">
      <button onClick={goBack} className="mb-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">← Back to Subjects</button>

      {/* Header */}
      <QuizHeader
        aircraft={aircraft}
        subject={decodedSubject}
        currentIndex={viewIndex}
        total={total}
        level={q.level}
        source={q.source}
      />

      {/* Exam control bar */}
      <ExamModeBar
        running={examMode}
        timeLeft={timeLeft}
        duration={examDuration}
        onChangeDuration={setExamDuration}
        onStart={startExamNow}
        onSubmitNow={submitExamNow}
      />

      {isReview ? (
        <>
          <div className="mb-4 border p-4 rounded-lg shadow bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-1">Grade Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {aircraft.toUpperCase()} - {decodedSubject.toUpperCase()} | Exam Summary
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Correct {correctCount} of {total} questions
            </p>
          </div>
          {questions.map((question, idx) => (
            <QuestionCard
              key={question.id ?? idx}
              question={question}
              index={idx}
              total={total}
              selected={answers[idx]}
              showExplanation={true}  // tampil di review
              isReview
            />
          ))}
        </>
      ) : (
        <>
          <main role="main" className="pb-20">
            <QuestionCard
              question={q}
              index={viewIndex}
              total={total}
              selected={selected}
              onSelect={onSelectChoice}
              showExplanation={false}  // disembunyikan selama exam
            />

            {/* Navigator: nonaktifkan jump saat exam berjalan */}
            <div className="mt-4">
              <QuestionNavigator
                total={total}
                currentIndex={viewIndex}
                answers={answers}
                onJump={examMode ? undefined : (i) => logEvent("nav_jump", { idx: i, mode: "exam" })}
              />
            </div>
          </main>

          <QuizFooterNav
            currentIndex={viewIndex}
            total={total}
            showExplanation={true}     // footer butuh enable Next tanpa explanation
            onNext={handleNext}
            onPrev={() => {}}
            disableNextUntilAnswered
            hasAnswered={answers?.[viewIndex] != null}
            disablePrev={true}         // linear navigation
          />
        </>
      )}

      {/* Modal waktu habis */}
      <ExamTimeUpModal open={timeUpOpen} onClose={() => setTimeUpOpen(false)} />
    </div>
  );
}
