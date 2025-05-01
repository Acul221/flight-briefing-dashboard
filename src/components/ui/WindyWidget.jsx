// src/components/ui/WindyWidget.jsx

function WindyWidget() {
    return (
      <section className="mt-8 max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          Live Windy Map
        </h2>
        <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
          <iframe
            className="w-full h-[450px]"
            src="https://embed.windy.com/embed2.html"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    );
  }
  
  export default WindyWidget;
  