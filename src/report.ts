import path from "node:path";
import fs from "node:fs";
import { ExtractPageData } from "./crawl.js";

export function writeJSONReport(pageData: Record<string, ExtractPageData>, filename = "report.json"): void {

    const sorted = Object.values(pageData).sort((a, b) => a.url.localeCompare(b.url));
    const data = JSON.stringify(sorted, null, 2);
    const filepath = path.resolve(process.cwd(), filename);
    fs.writeFileSync(filepath, data);
    console.log(`Report written to ${filepath}.`);
}