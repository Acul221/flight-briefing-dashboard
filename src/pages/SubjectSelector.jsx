import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const subjectByAircraft = {
  a320: [
    { name: "ATA21 - Air Conditioning", path: "ata21" },
    { name: "ATA22 - Auto Flight", path: "ata22" },
    { name: "ATA23 - Communications", path: "ata23" },
    { name: "ATA24 - Electrical", path: "ata24" },
    { name: "ATA25 - Equipment", path: "ata25" },
    { name: "ATA26 - Fire Protection", path: "ata26" },
    { name: "ATA27 - Flight Controls", path: "ata27" },
    { name: "ATA28 - Fuel", path: "ata28" },
    { name: "ATA29 - Hydraulics", path: "ata29" },
    { name: "ATA30 - Ice and Rain Protection", path: "ata30" },
    { name: "ATA31 - Indicating/Recording System", path: "ata31" },
    { name: "ATA32 - Landing Gear", path: "ata32" },
    { name: "ATA33 - Light", path: "ata33" },
    { name: "ATA34 - NAV-Navigation", path: "ata34" },
    { name: "ATA35 - Oxygen", path: "ata35" },
    { name: "ATA36 - Pneumatic", path: "ata36" },
    { name: "ATA38 - Water/Waste", path: "ata38" },
    { name: "ATA45 - Maintenance System", path: "ata45" },
    { name: "ATA46 - Information System", path: "ata46" },
    { name: "ATA49 - APU", path: "ata49" },
    { name: "ATA52 - Doors", path: "ata52" },
    { name: "ATA56 - Cockpit Windows", path: "ata56" },
    { name: "ATA70 - Engines", path: "ata70" }
  ],
  a330: [
    { name: "ATA21 - Air Conditioning", path: "ata21" },
    { name: "ATA22 - Auto Flight", path: "ata22" },
    { name: "ATA23 - Communications", path: "ata23" },
    { name: "ATA24 - Electrical", path: "ata24" },
    { name: "ATA25 - Equipment", path: "ata25" },
    { name: "ATA26 - Fire Protection", path: "ata26" },
    { name: "ATA27 - Flight Controls", path: "ata27" },
    { name: "ATA28 - Fuel", path: "ata28" },
    { name: "ATA29 - Hydraulics", path: "ata29" },
    { name: "ATA30 - Ice and Rain Protection", path: "ata30" },
    { name: "ATA31 - Indicating/Recording System", path: "ata31" },
    { name: "ATA32 - Landing Gear", path: "ata32" },
    { name: "ATA33 - Light", path: "ata33" },
    { name: "ATA34 - NAV-Navigation", path: "ata34" },
    { name: "ATA35 - Oxygen", path: "ata35" },
    { name: "ATA36 - Pneumatic", path: "ata36" },
    { name: "ATA38 - Water/Waste", path: "ata38" },
    { name: "ATA45 - Maintenance System", path: "ata45" },
    { name: "ATA46 - Information System", path: "ata46" },
    { name: "ATA49 - APU", path: "ata49" },
    { name: "ATA52 - Doors", path: "ata52" },
    { name: "ATA56 - Cockpit Windows", path: "ata56" },
    { name: "ATA70 - Engines", path: "ata70" }
  ],
  b737: [
    { name: "Coming Soon", path: "nil" }
  ]
};

function SubjectSelector() {
  const navigate = useNavigate();
  const { aircraft } = useParams();
  const subjects = subjectByAircraft[aircraft] || [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <h1 className="text-2xl font-bold mb-6 capitalize">{aircraft} Subjects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        {subjects.map((subj) => (
          <button
            key={subj.path}
            onClick={() => subj.path !== "nil" && navigate(`/quiz/${aircraft}/${subj.path}`)}
            disabled={subj.path === "nil"}
            className={`w-full py-4 px-6 rounded-xl shadow-md transition text-base font-semibold
              ${subj.path === "nil"
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"}`}
          >
            {subj.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubjectSelector;
