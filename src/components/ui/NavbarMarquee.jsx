import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import greetings from "@/data/greetings";
import humor from "@/data/humor";
import tips from "@/data/tips";

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  let group = "morning";
  if (hour >= 12 && hour < 17) group = "afternoon";
  else if (hour >= 17 && hour < 21) group = "evening";
  else if (hour >= 21 || hour < 5) group = "night";
  const groupGreetings = greetings[group];
  return groupGreetings[Math.floor(Math.random() * groupGreetings.length)];
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function NavbarMarquee() {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [xDistance, setXDistance] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    let active = true;
    const newText = `${getTimeGreeting()} ${getRandom(humor)} ${getRandom(tips)}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active) setText(newText);
    return () => {
      active = false;
    };
  }, [index]);

  useEffect(() => {
    let active = true;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const textWidth = textRef.current?.scrollWidth || 0;
    const distance = containerWidth + textWidth;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active) setXDistance(distance);

    const timer = setTimeout(() => {
      if (active) setIndex((prev) => prev + 1);
    }, (distance / 50) * 1000 + 5000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <div ref={containerRef} className="overflow-hidden w-full max-w-md px-2">
      <motion.div
        ref={textRef}
        key={index}
        className="whitespace-nowrap font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300"
        initial={{ x: xDistance }}
        animate={{ x: -xDistance }}
        transition={{ duration: xDistance / 50, ease: "linear" }}
      >
        {text}
      </motion.div>
    </div>
  );
}
