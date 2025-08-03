import { useState } from "react";
import FullscreenModal from "./FullscreenModal"; // pastikan kamu sudah punya ini
import { Maximize2 } from "lucide-react";

export default function WindyWidget() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Live Windy Map
          </h2>
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-gray-500 hover:text-blue-500"
            title="Fullscreen"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Iframe */}
        <div className="aspect-video">
          <iframe
            className="w-full h-full"
            src="https://inasiam.bmkg.go.id/#4.17/-3.62/105.94"
            frameBorder="0"
            title="INA-SIAM"
            allowFullScreen
          />
        </div>
      </section>

      {/* Modal */}
      <FullscreenModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <iframe
          src="https://inasiam.bmkg.go.id/#4.17/-3.62/105.94"
          className="w-full h-full rounded-xl"
          frameBorder="0"
          title="INA-SIAM"
          allowFullScreen
        />
      </FullscreenModal>
    </>
  );
}
