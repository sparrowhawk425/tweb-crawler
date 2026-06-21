import { argv } from "node:process";
import { crawlSiteAsync } from "./crawl.js";
import { writeJSONReport } from "./report.js";

async function main() {
    // First two are node, script
    if (argv.length !== 5) {
        console.log("usage: expecting arguments: <baseURL> <maxConcurrency> <maxPages>");
        process.exit(1);
    }
    const baseUrl = argv[2];
    const concurrentConn = +argv[3];
    const maxPages = +argv[4];
    console.log(`Starting to crawl ${baseUrl}...`);
    const pages = await crawlSiteAsync(baseUrl, concurrentConn, maxPages);
    console.log("Finished crawling.");
    if (pages) {
        writeJSONReport(pages);
    }
    process.exit(0);
}

main();