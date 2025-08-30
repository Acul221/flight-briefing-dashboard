import { useState } from "react";
import { Rnd } from "react-rnd";
import { useROIStore } from "../store/useROIStore";
import roiConfigDefault from "../config/roiConfig";

export default function RoiTester() {
  const [imgURL, setImgURL] = useState("");
  const [imgSize, setImgSize] = useState({ w: 800, h: 1000 });
  const { roiConfig, setROI, updateROI } = useROIStore();

  // kalau store kosong, load default
  if (!roiConfig.header) {
    setROI(roiConfigDefault);
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgURL(URL.createObjectURL(f));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold mb-3">ROI Tester (Sync with Store)</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-3 block w-full border p-2 rounded"
      />

      {imgURL && (
        <div className="relative inline-block">
          <img
            src={imgURL}
            alt="preview"
            className="max-w-full"
            onLoad={(e) =>
              setImgSize({
                w: e.target.naturalWidth,
                h: e.target.naturalHeight,
              })
            }
          />

          {Object.entries(roiConfig).map(([key, roi]) => (
            <Rnd
              key={key}
              size={{ width: roi.w * imgSize.w, height: roi.h * imgSize.h }}
              position={{ x: roi.x * imgSize.w, y: roi.y * imgSize.h }}
              bounds="parent"
              onDragStop={(e, d) => {
                updateROI(key, {
                  x: d.x / imgSize.w,
                  y: d.y / imgSize.h,
                });
              }}
              onResizeStop={(e, direction, ref, delta, pos) => {
                updateROI(key, {
                  x: pos.x / imgSize.w,
                  y: pos.y / imgSize.h,
                  w: ref.offsetWidth / imgSize.w,
                  h: ref.offsetHeight / imgSize.h,
                });
              }}
              style={{
                border: "2px solid red",
                background: "rgba(255,0,0,0.2)",
                transform: `rotate(${roi.angle || 0}deg)`,
                transformOrigin: "top left",
              }}
            >
              <span className="bg-black text-white text-xs px-1">
                {roi.label} ({roi.angle}° | pad {roi.pad ?? 0})
              </span>
            </Rnd>
          ))}
        </div>
      )}
    </div>
  );
}
