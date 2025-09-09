// src/pages/QuizPage.jsx
import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import QuizHeader from "@/components/quiz/QuizHeader";
import QuestionCard from "@/components/quiz/QuestionCard";
import QuizFooterNav from "@/components/quiz/QuizFooterNav";
import SkeletonQuestion from "@/components/quiz/SkeletonQuestion";
import QuestionNavigator from "@/components/quiz/QuestionNavigator";
import QuizBanner from "@/components/quiz/QuizBanner";
import UpgradeLimitModal from "@/components/quiz/UpgradeLimitModal";

import useQuizSession from "@/hooks/useQuizSession";
import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { logEvent } from "@/lib/analytics";

// Map status subscription → 'guest' | 'inactive' | 'pro'
function resolveStatus(session, subscription) {
  if (!session) return "guest";
  // Sesuaikan dengan skema tabel subscriptions kamu
  if (
    subscription?.status === "active" ||
    subscription?.plan === "pro" ||
    subscription?.tier === "pro"
  ) {
    return "pro";
  }
  return "inactive";
}

function QuizPage() {
  const navigate = useNavigate();
  const { aircraft, subject } = useParams();
  const decodedSubject = decodeURIComponent(subject || "");

  // State quiz (persisted)
  const {
    loading,
    questions,
    currentIndex,
    answers,
    showExplanation,
    isReview,
    selected,
    answer,
    next,
    prev,
    jumpTo,
    setIsReview,        // paksa Review saat mentok limit
    setShowExplanation, // disediakan jika nanti dibutuhkan
  } = useQuizSession({ aircraft, subject });

  // Auth & role
  const { session, loading: sessionLoading } = useSession();
  const { subscription, loading: subLoading } = useSubscription();
  const { isAdmin, loading: profileLoading } = useProfile();

  const status = resolveStatus(session, subscription);
  const isGuest = status === "guest";
  const isPro = status === "pro";
  const isInactive = status === "inactive";
  const adminOverride = !!isAdmin;

  // Hindari flicker “10 soal” saat profile admin masih loading
  const blockUntilRoleKnown = !!session && profileLoading;

  // Gating total (guest/inactive = 10; admin/pro = full)
  const gatedTotal = adminOverride || isPro
    ? questions.length
    : Math.min(questions.length, 10);

  // Clamp index tampilan agar tidak melebihi batas gating
  const viewIndex = Math.min(currentIndex, Math.max(gatedTotal - 1, 0));
  const isLastByGate = viewIndex >= Math.max(gatedTotal - 1, 0);

  // ===== Analytics =====
  useEffect(() => {
    logEvent("quiz_view", { aircraft, subject: decodedSubject });
  }, [aircraft, decodedSubject]);

  useEffect(() => {
    const q = questions[viewIndex];
    if (q?.id) logEvent("question_view", { id: q.id, idx: viewIndex });
  }, [questions, viewIndex]);

  // Jika restore index melewati limit gating → auto Review (kecuali admin/pro)
  useEffect(() => {
    if (adminOverride || isPro) return;
    if (!loading && !isReview && gatedTotal > 0 && currentIndex >= gatedTotal) {
      setIsReview(true);
    }
  }, [adminOverride, isPro, loading, isReview, currentIndex, gatedTotal, setIsReview]);

  // ===== Slim Banner & Limit Modal =====
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

  // Slim banner hanya di awal (Q0–Q1), non-admin/pro, bukan review
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

  // Munculkan modal saat menyentuh soal terakhir trial & explanation terlihat
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

  // ===== Navigation handlers =====
  const handleNext = useCallback(() => {
    if (!(adminOverride || isPro) && isLastByGate) {
      setIsReview(true);
      logEvent("session_finish", { total: gatedTotal, mode: "learn" });
    } else {
      logEvent("nav_next", { idx: viewIndex });
      next();
    }
  }, [adminOverride, isPro, isLastByGate, gatedTotal, viewIndex, next, setIsReview]);

  const handlePrev = useCallback(() => {
    logEvent("nav_prev", { idx: viewIndex });
    prev();
  }, [viewIndex, prev]);

  // Keyboard N/P
  useEffect(() => {
    const onKey = (e) => {
      const inForm = e.target.closest?.("input,textarea,button,[role='dialog']");
      if (inForm) return;
      const k = e.key.toLowerCase();
      if (k === "n") handleNext();
      if (k === "p") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev]);

  const goBack = () => navigate(`/quiz/${aircraft}`);

  // ===== Loading / Empty =====
  if (loading || sessionLoading || subLoading || blockUntilRoleKnown) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <SkeletonQuestion />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button
          onClick={goBack}
          className="mb-4 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Subjects
        </button>
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
          Couldn’t load questions. Try again.
        </div>
      </div>
    );
  }

  const q = questions[viewIndex];

  // Skor untuk review (hanya sampai gatedTotal)
  const correctCount = questions.slice(0, gatedTotal).reduce((acc, qq, i) => {
    const pick = answers[i];
    return acc + (qq?.choices?.[pick]?.isCorrect ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-white">
      {/* Back */}
      <button
        onClick={goBack}
        className="mb-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to Subjects
      </button>

      {/* Slim Banner (awal saja, non-admin/pro) */}
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
          {/* REVIEW HEADER */}
          <div className="mb-4 border p-4 rounded-lg shadow bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-1">Grade Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {aircraft.toUpperCase()} - {decodedSubject.toUpperCase()} | Exam Summary
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Correct {correctCount} of {gatedTotal} questions
            </p>
          </div>

          {/* REVIEW LIST (dibatasi sampai gatedTotal) */}
          {questions.slice(0, gatedTotal).map((question, idx) => (
            <QuestionCard
              key={question.id ?? idx}
              question={question}
              index={idx}
              total={gatedTotal}
              selected={answers[idx]}
              showExplanation={true}
              isReview
            />
          ))}
        </>
      ) : (
        <>
          {/* Header */}
          <QuizHeader
            aircraft={aircraft}
            subject={decodedSubject}
            currentIndex={viewIndex}
            total={gatedTotal}
            level={q.level}
            source={q.source}
          />

          {/* Content */}
          <main role="main" className="pb-20">
            <QuestionCard
              question={q}
              index={viewIndex}
              total={gatedTotal}
              selected={selected}
              onSelect={(i) => answer(i)} // Learn mode → tampilkan explanation
              showExplanation={showExplanation}
            />

            {/* Navigator: total = gatedTotal */}
            <div className="mt-4">
              <QuestionNavigator
                total={gatedTotal}
                currentIndex={viewIndex}
                answers={answers}
                onJump={jumpTo}
              />
            </div>
          </main>

          {/* Footer Nav */}
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

      {/* Modal batas trial (guest/inactive) */}
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

export default QuizPage;
