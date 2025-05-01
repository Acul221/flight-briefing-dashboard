// src/components/ui/INASIAMWidget.jsx

function INASIAMWidget() {
    return (
      <section className="mt-8 max-w-6xl mx-auto px-4">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          INA-SIAM
        </h2>
        <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
          <iframe
            className="w-full h-[450px]"
            src="https://inasiam.bmkg.go.id/#4.17/-3.62/105.94"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    );
  }
  
  export default INASIAMWidget;
  