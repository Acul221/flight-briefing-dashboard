// scripts/seed-sample.js
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const file = path.resolve(process.cwd(), "sample_data/canonical_sample.json");
const items = JSON.parse(fs.readFileSync(file, "utf8"));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  try {
    for (const q of items) {
      // adapt target table/columns as needed
      const { error } = await supabase.from("questions").insert({
        legacy_id: q.legacy_id,
        question: q.question,
        stem: q.stem,
        choices: q.choices,
        explanations: q.explanations,
        choice_images: q.choiceImages,
        question_image: q.questionImage,
        correct_index: q.correctIndex,
        category: q.category,
        subcategory: q.subcategory,
        level: q.level,
        difficulty: q.difficulty,
        status: q.status,
        requires_aircraft: q.requires_aircraft,
        aircraft: q.aircraft,
        access_tier: q.access_tier,
        tags: q.tags,
        source: q.source
      });
      if (error) console.error("Insert error for", q.id, error);
      else console.log("Inserted", q.id);
    }
    console.log("Seeding finished");
  } catch (e) {
    console.error(e);
  }
})();
