import { useState } from "react";
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
import WeatherWidgetsCustomSection from "../components/ui/WeatherWidgetsCustomSection.jsx";

function DashboardPage() {
  const [infoVisible, setInfoVisible] = useState(true);
  const [czibVisible, setCzibVisible] = useState(false);
  const [rampVisible, setRampVisible] = useState(false);
  const [mapsVisible, setMapsVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(true);

  const toggleAll = (visible) => {
    setInfoVisible(visible);
    setCzibVisible(visible);
    setRampVisible(visible);
    setMapsVisible(visible);
    setSummaryVisible(visible);
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }]} />
      <Header />

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

      {/* Weather Summary & Widgets */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
        <SectionTitle icon="🌦️" title="Weather Summary & Widgets" />
        <WeatherWidgetsCustomSection />
        <motion.div
          initial={false}
          animate={{
            height: summaryVisible ? "auto" : 0,
            opacity: summaryVisible ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <WeatherSummary />
        </motion.div>
      </section>

      {/* Weather Maps */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📡" title="Weather Maps" />
          <motion.button
            onClick={() => setMapsVisible(!mapsVisible)}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: mapsVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: mapsVisible ? "auto" : 0,
            opacity: mapsVisible ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden space-y-4"
        >
          <WindyWidget />
          <INASIAMWidget />
        </motion.div>
      </section>

      {/* Information & Alerts */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📰" title="Information & Alerts" />
          <motion.button
            onClick={() => setInfoVisible(!infoVisible)}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: infoVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: infoVisible ? "auto" : 0,
            opacity: infoVisible ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NewsWidget />
            <CompactWxAlert />
          </div>
        </motion.div>
      </section>

      {/* Conflict Zone Alerts */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="⚠️" title="Conflict Zone Alerts" />
          <motion.button
            onClick={() => setCzibVisible(!czibVisible)}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: czibVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: czibVisible ? "auto" : 0,
            opacity: czibVisible ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <CZIBWidget />
        </motion.div>
      </section>

      {/* Ramp Snapshot */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="🛫" title="Ramp Snapshot" />
          <motion.button
            onClick={() => setRampVisible(!rampVisible)}
            whileTap={{ scale: 0.95 }}
            className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: rampVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{
            height: rampVisible ? "auto" : 0,
            opacity: rampVisible ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <RACSnapshotWidget />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default DashboardPage;
