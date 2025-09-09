// src/pages/DashboardPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import Breadcrumb from "../components/ui/Breadcrumb";
import Header from "../components/ui/Header";
import WeatherSummary from "../components/ui/WeatherSummary";
import RACSnapshotWidget from "../components/ui/RACSnapshotWidget";
import NewsWidget from "../components/NewsWidget";
import CompactWxAlert from "../components/ui/CompactWxAlert";
import WindyWidget from "../components/ui/WindyWidget";
import INASIAMWidget from "../components/ui/INASIAMWidget";
import SectionTitle from "../components/ui/SectionTitle";
import CZIBWidget from "../components/ui/CZIBWidget";
import WeatherWidgetsCustomSection from "../components/ui/WeatherWidgetsCustomSection";
import FullscreenModal from "../components/ui/FullscreenModal";
import BillingStrip from "@/components/dashboard/BillingStrip";

import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";

function DashboardPage() {
  const [infoVisible, setInfoVisible] = useState(true);
  const [czibVisible, setCzibVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  const { session, loading: loadingSession } = useSession();
  const { profile, loading: loadingProfile, error: profileError } = useProfile();

  const isLoading = loadingSession || loadingProfile;
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email ?? null;

  const role = useMemo(
    () => profile?.role ?? (isLoggedIn ? "user" : null),
    [profile, isLoggedIn]
  );

  const toggleAll = (visible) => {
    setInfoVisible(visible);
    setCzibVisible(visible);
    setSummaryVisible(visible);
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-slate-900">
        <div className="px-4 md:px-6 py-10 max-w-7xl mx-auto space-y-4">
          <div className="animate-pulse h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="animate-pulse h-10 w-64 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-white/70 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-40 bg-white/70 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isGuest = !isLoggedIn;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-slate-900">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }]} />
        <Header subtitle={isLoggedIn ? `Welcome back, ${userEmail}` : "Guest Mode"} />

        {/* Error ringan dari useProfile (jika ada) */}
        {profileError && (
          <div className="p-3 border border-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-200">
            We couldn’t load your full profile. You’re viewing public widgets for now.
          </div>
        )}

        {/* 🔔 Guest Banner */}
        {isGuest && (
          <div className="p-4 border border-blue-300 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-sm shadow">
            <p className="font-semibold text-blue-800 dark:text-blue-200">You are in Guest Mode</p>
            <p className="text-blue-700 dark:text-blue-300">
              Sign in to sync preferences, save custom widgets, and unlock Pro features.
            </p>
            <div className="mt-3 flex gap-2">
              <Link to="/login" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                Login
              </Link>
              <Link
                to="/pricing"
                className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
              >
                See Pro Plans
              </Link>
            </div>
          </div>
        )}

        {/* Global Toggle */}
        <div className="sticky top-16 z-10 bg-gradient-to-r from-white/80 to-white/50 dark:from-slate-900/80 dark:to-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl shadow p-2 flex justify-end gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            Show All
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition"
          >
            Collapse All
          </button>
        </div>

        {/* 💳 Billing/Pricing strip (muncul otomatis saat logged-in) */}
        <BillingStrip />

        {/* Weather Summary & Tools */}
        <Section
          title="Weather Summary & Tools"
          icon="🌦️"
          visible={summaryVisible}
          setVisible={setSummaryVisible}
        >
          <WeatherWidgetsCustomSection />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <WindyWidget onFullscreen={() => setFullscreenWidget("windy")} />
            <INASIAMWidget onFullscreen={() => setFullscreenWidget("inasiam")} />
          </div>

          <RACSnapshotWidget />
          <WeatherSummary />

          <FullscreenModal isOpen={fullscreenWidget !== null} onClose={() => setFullscreenWidget(null)}>
            {fullscreenWidget === "windy" && <WindyWidget fullscreen key="windy-full" />}
            {fullscreenWidget === "inasiam" && <INASIAMWidget fullscreen key="inasiam-full" />}
          </FullscreenModal>
        </Section>

        {/* Information & Alerts */}
        <Section
          title="Information & Alerts"
          icon="📰"
          visible={infoVisible}
          setVisible={setInfoVisible}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NewsWidget />
            <CompactWxAlert />
          </div>
        </Section>

        {/* Conflict Zone */}
        <Section
          title="Conflict Zone Alerts"
          icon="⚠️"
          visible={czibVisible}
          setVisible={setCzibVisible}
        >
          <CZIBWidget />
        </Section>

        {/* Teaser Pro (opsional) */}
        {role !== "admin" && isGuest && (
          <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm">
            Looking for full question banks & adaptive review?{" "}
            <Link to="/pricing" className="text-blue-600 hover:underline">Go Pro</Link>.
          </div>
        )}
      </div>
    </div>
  );
}

// Generic collapsible section
const Section = ({ title, icon, visible, setVisible, children }) => (
  <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
    <div className="flex items-center justify-between">
      <SectionTitle icon={icon} title={title} />
      <motion.button
        onClick={() => setVisible(!visible)}
        whileTap={{ scale: 0.95 }}
        className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
        aria-label={visible ? "Collapse section" : "Expand section"}
      >
        <motion.span
          animate={{ rotate: visible ? 0 : -90 }}
          transition={{ duration: 0.25 }}
          className="inline-block"
        >
          ⮟
        </motion.span>
      </motion.button>
    </div>
    <motion.div
      initial={false}
      animate={{ height: visible ? "auto" : 0, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden ${visible ? "overflow-y-visible" : ""}`}
    >
      {children}
    </motion.div>
  </section>
);

export default DashboardPage;
