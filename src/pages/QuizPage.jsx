// src/pages/QuizPage.jsx
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import QuizHeader from "@/components/quiz/QuizHeader";
import QuestionCard from "@/components/quiz/QuestionCard";
import QuizFooterNav from "@/components/quiz/QuizFooterNav";
import SkeletonQuestion from "@/components/quiz/SkeletonQuestion";
import QuestionNavigator from "@/components/quiz/QuestionNavigator";
import QuizBanner from "@/components/quiz/QuizBanner";
import UpgradeLimitModal from "@/components/quiz/UpgradeLimitModal";

import { useQuizRuntime } from "@/hooks/useQuizRuntime";
import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { logEvent } from "@/lib/analytics";

function resolveStatus(session, subscription) {
  if (!session) return "guest";
  if (
    subscription?.status === "active" ||
    subscription?.plan === "pro" ||
    subscription?.tier === "pro"
  ) {
    return "pro";
  }
  return "inactive";
}
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function QuizPage() {
  const navigate = useNavigate();
  const { aircraft, subject } = useParams();
  const decodedSubject = decodeURIComponent(subject || "");
  const query = useQuery();

  // Difficulty dari URL
  const levelParam = query.get("level");
  const difficulty = levelParam
    ? levelParam.split(",").map((s) => s.trim().toLowerCase())
    : ["easy", "medium", "hard"];

  // Opsional: include subkategori via ?desc=1
  const includeDescendants = query.get("desc") === "1";

  // Fetch soal
  const { items: questions, loading, error } = useQuizRuntime({
    category_slug: decodedSubject,
    limit: 50,
    difficulty,
    include_descendants: includeDescendants,
  });

  // Auth & role
  const { session, loading: sessionLoading } = useSession();
  const { subscription, loading: subLoading } = useSubscription();
  const { isAdmin, loading: profileLoading } = useProfile();

  const status = resolveStatus(session, subscription);
  const isGuest = status === "guest";
  const isPro = status === "pro";
  const isInactive = status === "inactive";
  const adminOverride = !!isAdmin;
  const blockUntilRoleKnown = !!session && profileLoading;

  // Gating
  const gatedTotal = useMemo(
    () => (adminOverride || isPro ? questions.length : Math.min(questions.length, 10)),
    [adminOverride, isPro, questions.length]
  );

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isReview, setIsReview] = useState(false);

  // Reset saat subject/level/gating berganti (hindari index out-of-range)
  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setShowExplanation(false);
    setIsReview(false);
  }, [decodedSubject, aircraft, levelParam, includeDescendants]);

  const viewIndex = Math.min(currentIndex, Math.max(gatedTotal - 1, 0));
  const isLastByGate = viewIndex >= Math.max(gatedTotal - 1, 0);

  // Analytics
  useEffect(() => {
    logEvent("quiz_view", { aircraft, subject: decodedSubject, difficulty });
  }, [aircraft, decodedSubject, difficulty]);
  useEffect(() => {
    const q = questions[viewIndex];
    if (q?.id) logEvent("question_view", { id: q.id, idx: viewIndex });
  }, [questions, viewIndex]);

  // Auto review (non-pro)
  useEffect(() => {
    if (adminOverride || isPro) return;
    if (!loading && !isReview && gatedTotal > 0 && currentIndex >= gatedTotal) {
      setIsReview(true);
    }
  }, [adminOverride, isPro, loading, isReview, currentIndex, gatedTotal]);

  // Banner & modal
  const bannerKey = `trialBanner:dismiss:${aircraft}:${decodedSubject}`;
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  useEffect(() => {
    try { setBannerDismissed(localStorage.getItem(bannerKey) === "1"); } catch {}
  }, [bannerKey]);
  const dismissBanner = () => {
    try { localStorage.setItem(bannerKey, "1"); } catch {}
    setBannerDismissed(true);
    logEvent("trial_banner_dismiss", { aircraft, subject: decodedSubject });
  };
  const shouldShowSlimBanner =
    !adminOverride &&
    !isPro &&
    (isGuest || isInactive) &&
    !bannerDismissed &&
    !isReview &&
    viewIndex <= 1 &&
    gatedTotal > 0;

  useEffect(() => {
    if (shouldShowSlimBanner) {
      logEvent("trial_banner_impression", { aircraft, subject: decodedSubject });
    }
  }, [shouldShowSlimBanner, aircraft, decodedSubject]);
  useEffect(() => {
    if (!adminOverride && !isPro && (isGuest || isInactive) && isLastByGate && showExplanation) {
      setLimitModalOpen(true);
      logEvent("trial_limit_modal_impression", { aircraft, subject: decodedSubject });
    }
  }, [adminOverride, isPro, isGuest, isInactive, isLastByGate, showExplanation, aircraft, decodedSubject]);

  // CTA
  const handleLogin = () => {
    logEvent("cta_login_click", { aircraft, subject: decodedSubject });
    window.location.href = "/login";
  };
  const handleUpgrade = () => {
    logEvent("cta_upgrade_click", { aircraft, subject: decodedSubject });
    window.location.href = "/pricing";
  };

  // Navigation
  const handleNext = useCallback(() => {
    if (!(adminOverride || isPro) && isLastByGate) {
      setIsReview(true);
      logEvent("session_finish", { total: gatedTotal, mode: "learn" });
    } else {
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
      setShowExplanation(false);
    }
  }, [adminOverride, isPro, isLastByGate, gatedTotal, questions.length]);
  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);
  const goBack = () => navigate(`/quiz/${aircraft}`);

  // Loading / Error
  if (loading || sessionLoading || subLoading || blockUntilRoleKnown) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <SkeletonQuestion />
      </div>
    );
  }
  if (error) return <div className="p-6 text-red-600">Error: {String(error.message || error)}</div>;
  if (!questions.length) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button onClick={goBack} className="mb-4 text-sm text-blue-600 hover:underline">
          ← Back to Subjects
        </button>
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          No questions found.
        </div>
      </div>
    );
  }

  const q = questions[viewIndex];
  const selected = answers[viewIndex] ?? null;
  const correctCount = questions.slice(0, gatedTotal).reduce((acc, qq, i) => {
    const pick = answers[i];
    return acc + (qq?.correctIndex === pick ? 1 : 0);
  }, 0);

  // Difficulty Selector
  const changeDifficulty = (e) => {
    const val = e.target.value;
    const newParam = val === "all" ? "" : `?level=${val}${includeDescendants ? "&desc=1" : ""}`;
    navigate(`/quiz/${aircraft}/${subject}${newParam}`);
  };

  const progressPct = gatedTotal ? ((viewIndex + 1) / gatedTotal) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-white">
      {/* Back + Level */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={goBack}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Subjects
        </button>
        <div className="flex items-center gap-2">
          <select
            className="select select-sm select-bordered"
            value={levelParam || "all"}
            onChange={changeDifficulty}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Slim Banner */}
      {shouldShowSlimBanner && (
        <div className="mb-3">
          <QuizBanner
            variant={isGuest ? "guest" : "inactive"}
            onLogin={handleLogin}
            onUpgrade={handleUpgrade}
            size="slim"
            onDismiss={dismissBanner}
          />
        </div>
      )}

      {isReview && !(adminOverride || isPro) ? (
        <>
          {/* Grade Report */}
          <div className="mb-4 border p-4 rounded-lg shadow bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-1">Grade Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {aircraft.toUpperCase()} - {decodedSubject.toUpperCase()} | Exam Summary
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Correct {correctCount} of {gatedTotal} questions ({Math.round((correctCount / gatedTotal) * 100)}%)
            </p>
          </div>

          {questions.slice(0, gatedTotal).map((question, idx) => (
            <QuestionCard
              key={question.id ?? idx}
              question={question}
              index={idx}
              total={gatedTotal}
              selected={answers[idx]}
              showExplanation
              isReview
            />
          ))}
        </>
      ) : (
        <>
          <QuizHeader
            aircraft={aircraft}
            subject={decodedSubject}
            currentIndex={viewIndex}
            total={gatedTotal}
            level={q.level || q.difficulty}  // fallback aman
            source={q.source}
          />

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <main role="main" className="pb-20">
            <QuestionCard
              question={q}
              index={viewIndex}
              total={gatedTotal}
              selected={selected}
              onSelect={(i) => {
                setAnswers((prev) => ({ ...prev, [viewIndex]: i }));
                setShowExplanation(true);
              }}
              showExplanation={showExplanation}
            />

            <div className="mt-4">
              <QuestionNavigator
                total={gatedTotal}
                currentIndex={viewIndex}
                answers={answers}
                onJump={(i) => setCurrentIndex(i)}
              />
            </div>
          </main>

          <QuizFooterNav
            currentIndex={viewIndex}
            total={gatedTotal}
            showExplanation={showExplanation}
            onNext={handleNext}
            onPrev={handlePrev}
            disableNextUntilAnswered
            hasAnswered={selected !== null}
          />
        </>
      )}

      <UpgradeLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onLogin={handleLogin}
        onUpgrade={handleUpgrade}
        total={gatedTotal}
      />
    </div>
  );
}
