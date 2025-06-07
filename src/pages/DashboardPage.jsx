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
  const [infoVisible, setInfoVisible] = useState(false);
  const [czibVisible, setCzibVisible] = useState(false);
  const [rampVisible, setRampVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(true); // default visible
  const [widgetVisible, setWidgetVisible] = useState(false);

  const toggleAll = (visible) => {
    setInfoVisible(visible);
    setCzibVisible(visible);
    setRampVisible(visible);
    setSummaryVisible(visible);
    setWidgetVisible(visible);
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-10 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }]} />
      <Header />

      {/* Global Toggle Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => toggleAll(true)}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Show All
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="px-3 py-1 text-xs bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Collapse All
        </button>
      </div>

      {/* Weather Widgets */}
      <section className="space-y-4">
        <WeatherWidgetsCustomSection />
      </section>

      {/* Weather Maps */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📡" title="Weather Maps" />
          <motion.button
            onClick={() => setWidgetVisible(!widgetVisible)}
            whileTap={{ scale: 0.95 }}
            title={widgetVisible ? "Hide section" : "Show section"}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: widgetVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{ height: widgetVisible ? "auto" : 0, opacity: widgetVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="space-y-6">
            <WindyWidget />
            <INASIAMWidget />
          </div>
        </motion.div>
      </section>

      {/* Information & Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="📰" title="Information & Alerts" />
          <motion.button
            onClick={() => setInfoVisible(!infoVisible)}
            whileTap={{ scale: 0.95 }}
            title={infoVisible ? "Hide section" : "Show section"}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-yellow-300 transition text-xl"
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
          animate={{ height: infoVisible ? "auto" : 0, opacity: infoVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NewsWidget />
            <CompactWxAlert />
          </div>
        </motion.div>
      </section>

      {/* CZIB Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="⚠️" title="Conflict Zone Alerts" />
          <motion.button
            onClick={() => setCzibVisible(!czibVisible)}
            whileTap={{ scale: 0.95 }}
            title={czibVisible ? "Hide section" : "Show section"}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-yellow-300 transition text-xl"
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
          animate={{ height: czibVisible ? "auto" : 0, opacity: czibVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <CZIBWidget />
        </motion.div>
      </section>

      {/* Ramp Snapshot */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="🛫" title="Ramp Snapshot" />
          <motion.button
            onClick={() => setRampVisible(!rampVisible)}
            whileTap={{ scale: 0.95 }}
            title={rampVisible ? "Hide section" : "Show section"}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-yellow-300 transition text-xl"
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
          animate={{ height: rampVisible ? "auto" : 0, opacity: rampVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <RACSnapshotWidget />
          </div>
        </motion.div>
      </section>

      {/* Weather Summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon="🌦️" title="Weather Summary & AI Briefing" />
          <motion.button
            onClick={() => setSummaryVisible(!summaryVisible)}
            whileTap={{ scale: 0.95 }}
            title={summaryVisible ? "Hide section" : "Show section"}
            className="text-gray-500 hover:text-blue-600 dark:hover:text-yellow-300 transition text-xl"
          >
            <motion.span
              animate={{ rotate: summaryVisible ? 0 : -90 }}
              transition={{ duration: 0.25 }}
              className="inline-block"
            >
              ⮟
            </motion.span>
          </motion.button>
        </div>
        <motion.div
          initial={false}
          animate={{ height: summaryVisible ? "auto" : 0, opacity: summaryVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <WeatherSummary />
        </motion.div>
      </section>
    </div>
  );
}

export default DashboardPage;
