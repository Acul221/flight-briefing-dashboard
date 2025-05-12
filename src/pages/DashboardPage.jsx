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

function DashboardPage() {
  const [infoVisible, setInfoVisible] = useState(true);
  const [czibVisible, setCzibVisible] = useState(true);
  const [rampVisible, setRampVisible] = useState(true);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [widgetVisible, setWidgetVisible] = useState(true);

  return (
    <div className="px-4 md:px-6 py-6 space-y-10 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }]} />
      <Header />

      {/* Information & Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📰" title="Information & Alerts" />
          <motion.button
            onClick={() => setInfoVisible(!infoVisible)}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ rotate: infoVisible ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
            {infoVisible ? "Hide" : "Show"}
          </motion.button>
        </div>
        {infoVisible && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NewsWidget />
            <CompactWxAlert />
          </div>
        )}
      </section>

      {/* CZIB Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="⚠️" title="Conflict Zone Alerts" />
          <motion.button
            onClick={() => setCzibVisible(!czibVisible)}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ rotate: czibVisible ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
            {czibVisible ? "Hide" : "Show"}
          </motion.button>
        </div>
        {czibVisible && <CZIBWidget />}
      </section>

      {/* Ramp Snapshot */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="🛫" title="Ramp Snapshot" />
          <motion.button
            onClick={() => setRampVisible(!rampVisible)}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ rotate: rampVisible ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
            {rampVisible ? "Hide" : "Show"}
          </motion.button>
        </div>
        {rampVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RACSnapshotWidget />
          </div>
        )}
      </section>

      {/* Weather Summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="🌦️" title="Weather Summary & AI Briefing" />
          <motion.button
            onClick={() => setSummaryVisible(!summaryVisible)}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ rotate: summaryVisible ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
            {summaryVisible ? "Hide" : "Show"}
          </motion.button>
        </div>
        {summaryVisible && <WeatherSummary />}
      </section>

      {/* Weather Widgets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📡" title="Weather Widgets" />
          <motion.button
            onClick={() => setWidgetVisible(!widgetVisible)}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ rotate: widgetVisible ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
            {widgetVisible ? "Hide" : "Show"}
          </motion.button>
        </div>
        {widgetVisible && (
          <div className="space-y-6">
            <WindyWidget />
            <INASIAMWidget />
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
