// src/components/ui/INASIAMWidget.jsx

function INASIAMWidget({ fullscreen = false }) {
  return (
    <section className={`${fullscreen ? "p-0 m-0" : "mt-8 max-w-6xl mx-auto px-4"}`}>
      {!fullscreen && (
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          INA-SIAM
        </h2>
      )}
      <div
        className={`rounded-xl overflow-hidden shadow-lg transition-all ${
          fullscreen ? "h-[90vh] touch-pan-y" : "hover:shadow-2xl transform hover:-translate-y-2"
        }`}
        style={{ pointerEvents: fullscreen ? "auto" : "initial" }}
      >
        <iframe
          className={`w-full ${fullscreen ? "h-full" : "h-[450px]"}`}
          style={{ touchAction: "pan-x pan-y" }}
          src="https://inasiam.bmkg.go.id/#4.17/-3.62/105.94"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          title="INA-SIAM Map"
        ></iframe>
      </div>
    </section>
  );
}

export default INASIAMWidget;
