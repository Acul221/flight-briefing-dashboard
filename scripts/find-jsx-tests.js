// scripts/find-jsx-tests.js
import fs from "fs";
import path from "path";

const rootDir = path.resolve("src"); // scan mulai dari folder src

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".test.js")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("<")) {
        console.log("⚠️ File pakai JSX tapi masih .js →", fullPath);
      }
    }
  });
}

scanDir(rootDir);
