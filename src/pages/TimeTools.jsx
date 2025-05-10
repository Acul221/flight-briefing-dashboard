import TimeBetweenDates from "@/components/TimeBetweenDates";
import BlockTimeCalculator from "@/components/BlockTimeCalculator";

export default function TimeTools() {
  return (
    <section className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Time Tools</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <TimeBetweenDates />
        <BlockTimeCalculator />
      </div>
    </section>
  );
}
