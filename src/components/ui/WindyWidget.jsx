function WindyWidget({ fullscreen = false }) {
  return (
    <section className={`${fullscreen ? "p-0 m-0" : "mt-8 max-w-6xl mx-auto px-4"}`}>
      {!fullscreen && (
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          Live Windy Map
        </h2>
      )}
      <div
        className={`rounded-xl overflow-hidden shadow-lg transition-all ${
          fullscreen ? "touch-pan-y" : "hover:shadow-2xl transform hover:-translate-y-2"
        }`}
        style={{
          height: fullscreen ? "calc(100dvh - 32px)" : undefined,
          pointerEvents: fullscreen ? "auto" : "initial"
        }}
      >
        <iframe
          className="w-full h-full"
          style={{ touchAction: "pan-x pan-y" }}
          src="https://embed.windy.com/embed2.html"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          title="Windy Map"
        ></iframe>
      </div>
    </section>
  );
}

export default WindyWidget;
