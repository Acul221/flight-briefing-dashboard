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
import FullscreenModal from "../components/ui/FullscreenModal";

function DashboardPage() {
  const [infoVisible, setInfoVisible] = useState(true);
  const [czibVisible, setCzibVisible] = useState(false);
  const [rampVisible, setRampVisible] = useState(false);
  const [mapsVisible, setMapsVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  const toggleAll = (visible) => {
    setInfoVisible(visible);
    setCzibVisible(visible);
    setRampVisible(visible);
    setSummaryVisible(visible);
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-slate-900">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
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

        {/* Weather Section */}
        <Section
          title="Weather Summary & Widgets"
          icon="🌦️"
          visible={summaryVisible}
          setVisible={setSummaryVisible}
        >
          <WeatherWidgetsCustomSection />
          <WeatherSummary />
        </Section>

        {/* Weather Maps */}
        <Section
        title="Weather Maps"
        icon="📡"
        visible={mapsVisible}
        setVisible={setMapsVisible}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div onClick={() => setFullscreenWidget("windy")} className="cursor-pointer">
            <WindyWidget />
          </div>
          <div onClick={() => setFullscreenWidget("inasiam")} className="cursor-pointer">
            <INASIAMWidget />
          </div>
        </div>

        {/* Fullscreen Modal */}
        <FullscreenModal isOpen={fullscreenWidget !== null} onClose={() => setFullscreenWidget(null)}>
          {fullscreenWidget === "windy" && <WindyWidget fullscreen />}
          {fullscreenWidget === "inasiam" && <INASIAMWidget fullscreen />}
        </FullscreenModal>
      </Section>


        {/* Info */}
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

        {/* Ramp */}
        <Section
          title="Ramp Snapshot"
          icon="🛫"
          visible={rampVisible}
          setVisible={setRampVisible}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <RACSnapshotWidget />
          </div>
        </Section>
      </div>
    </div>
  );
}

// Subcomponent: Section
const Section = ({ title, icon, visible, setVisible, children }) => (
  <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow p-4 space-y-4">
    <div className="flex items-center justify-between">
      <SectionTitle icon={icon} title={title} />
      <motion.button
        onClick={() => setVisible(!visible)}
        whileTap={{ scale: 0.95 }}
        className="text-gray-500 hover:text-emerald-600 dark:hover:text-yellow-300 transition text-xl"
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
      animate={{
        height: visible ? "auto" : 0,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.4 }}
      className={`overflow-hidden ${visible ? 'overflow-y-visible' : ''}`}
    >
      {children}
    </motion.div>
  </section>
);

export default DashboardPage;
