import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const tips = [
  // Tambahkan tips kamu di sini
  "Fly the aircraft first. Then worry about the problem.",
  "Brief slow, fly fast. Think ahead of the aircraft.",
  "Every flight is training. Every delay is a lesson.",
  "The loss of 50% of thrust in a twin engine airplane results in a loss of 80% rate of climb.",
  "ILS Approach, To catch a localizer without a heading reference, turn toward the needle until it stops moving, then hold wings level.",
  "One dot on the localizer is approximately 300' at the outer marker, 100' at the middle marker. One dot on the glide, slope is approximately 50' at the outer marker, 8' at the middle marker,",
  "A 3° change in pitch will equal a 3° glide path at a given airspeed.",
  "One degree deviation of the ADF needle is equal to 100 feet per NM.",
  "OSUN; Overshoot South-Undershoot North,",
  "ANDS; Accelerate North Decelerate South, Anticipate North, Delay South",
  "Use latitude plus 1/2 bank angle to roll out on North/South heading, Ex. 25°N 30° bank, rollout 25 + 15 = 40° lead or la",
  "For reciprocal headings: add 2 subtract 2/eubtract 2 add 2. Example: 280° -2+2 = 050°, 160° +2-2 = Navigation alll",
  "One minute of latitude is equal to 1 NM. One minute of longitude is equal to 1 NM X Cosine of the latitude. Airspeeds",
  "At a given mach number a 1° C increase in temperature will result in a 1 knot TAS increase.",
  "At a given temperature a .01 increase in mach will result in a 6 knot increase in TAS",
  "Maximum range TAS will reduce 5% for each 10% reduction in aircraft gross weight",
  "Doubling the weight or G-Force doubles the angle of attack required for level flight, tripling the load triples the angle of attack, etc.",
  "The maximum angle of attack before stall s about",
  "10° to 25° of flaps add more lift than drag, 25° to 40° flaps add more drag than lift. Weight and Balance 1, Anairplane will be more stable and stall at a higher airspeed with a forward CG location,",
  "An airplane will be less stable and stall at a lower airspeed with an aft CG location, Flight Maneuvers",
  "Bank and Yank for Chandelles, Yank and Bank for azy 8's",
  "High performance incratt: The angle of bank should approximate. the number of 'degrees of jurn not to exceed 30° of bank.",
  "The radius of a standard rate turn in meters is equal to the TAS times 10.",
  "Use $ the bank angle for the lead rollout of a standard rate turn, Flight Maneuvers",
  "For altitude correction use 2 times the deviation in feet for the VSI rate back to altitude. (example: 100° deviation use 200 fpm to return) Meteorsleay 1, At -40°C is also -40° F",
  "To find the height of the cloud bases AGL in Celsius, divide the temperature/dew point spread by 2.5 (or multiply by 400).",
  "To find the height of the cloud bases AGL in Fahrenheit, divide the temperature/dew point spread by 4.5, 4, Increase maneuvering and approach speeds by 20% with ice present on wings,",
  "Mast structural icing occurs' between 0°C to - Thunderstorms",
  "Deviate 10 to 20 miles upwind around thunderstorms 'non anvil side)",
  "Flying over the top of a thunderstorm, allow at least 1,000' for each 10 knots of wind speed.",
  "A dew point of 10° C (or 53°F) indicates enough moisture present for the development of severe thunderstorms, possible tornadoes.",
  "If the OAT is cooling at a rate greater than 5.5 F per 1,000 feet, the air can be considered unstable.",
  "Hail may be found 10 miles or more from the rain underneath the anvil.",
  "Do not take off or land if you are within 15 miles of a steady state advancing thunderstorm and you do not know where the qust front,",
  "To minimize the possibility of lig strikes, avoid the freezing level by at least + 5° C, and stay out of clouds. Flight Plannin",
  "Jet Aircraft: Altitude for short trips use 10% the distance plus 5. Ex. 230NM use 23 + 5 = FL280",
  "Jet Aircraft: To accept higher FL needs 1% less 'than maximum continuous NI for cruise mach for each additional FL.",
  "The most efficient cruise altitude for single engine fixed pitch airplanes is around 7,5( Climb to this altitude for legs of 50 miles or more (eastbound). Visibility 1 The in-flight visibility in miles is equal to the number of thousands of feet AGL when the surface is just visible over the nose of the airplane. Landi LIF the runway is moving down in the windscreen you are to high, overshooting, if the runway is moving up in the windscreen' you are to low, undershooting, Night Flying",
  "'Use at least a 3° glide path on final approach and be wary of runway illusions.",
  "Remember \"Red, Right, Returning\" to determine if a plane is headed toward you or going away.",
  "Fly a normal traffic pattern, avoid straight-in 'approaches to airports with' dark surrounding 'areas, VOR/DME Navigation",
  "DME slant range error is minimized when you 'are one NM distance for each 1,000' above the station.",
  "To determine a lead radial when flying a DME arc, use your TAS divided by 2 times the NM radius of the arc.",
  "Tune 10, Turn 10 when flying around a DME are. Each time the CDI centers, select the next 10 bearing fo the station and make another 10° heading change. 4, To defermine the number of degrees per NM distance around a DME arc, divide the arc radius into 60. Example: 60/10(DME arc) = 6° pe NM. 5, Turn to intercept DME arc in NM = 1% of TAS, Example: 120 kts TAS, start the turn 1.2 NM from the arc.",
  "Flying © DME arc, if you are outside. the arc make 1a 20% heading correction, if you are inside the arc hold the present heading. Collision Avoidance",
  "If an aircraft appears stationary and is getting larger alter course. Altimetry,",
  "1° in 10 NM = 1,000\". Example: Altitude 10,000' AGL. Set Radar to contact ground at 20 NM. Tilt Radar up 5° (2,000' X 5) to set bottom of beam level with aircraft altitude. Quick Conversions",
  "To convert pounds of Jet A into liters divide the number of pounds required by 2 and add 10% Example: need 4000 Ib jet fuel, 2000 + 200 3 and add 3 = 1,500. EX, Ceil 1,500 + 150 = 1650. 4, To convert visibility in meters to statute miles, multiply the meters in thousands by 0.6, Example: Visibility 3,000 meters, 3 (thousand) X'.6 = 18",
  "The wind speed reported in meters per second will closely equal double that number in knots. Example: 5 mps * 10 knots (9.7 knots),",
  "To convert from minutes to tenth of hours divide by 60. Ex. 12 min/60 = 2 hours 'convert from tenths of hours to minutes multiply by 60. Ex. 0.5 X 60 = 30 minutes.",

];

export default function FlightTipSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="mt-4 max-w-xl mx-auto text-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/10 dark:border-gray-700 rounded-xl px-4 py-3 shadow-md text-sm text-gray-800 dark:text-gray-100 cursor-grab"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 TIP OF THE FLIGHT</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          className="italic"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.x < -50) {
              setIndex((prev) => (prev + 1) % tips.length);
            } else if (info.offset.x > 50) {
              setIndex((prev) => (prev - 1 + tips.length) % tips.length);
            }
          }}
        >
          {tips[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
