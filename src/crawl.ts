import { JSDOM } from "jsdom";
import pLimit, { LimitFunction }  from "p-limit";

export function normalizeURL(urlStr: string): string {
    const url = new URL(urlStr);
    let path = url.pathname;
    if (path.slice(-1) === "/") {
        path = path.slice(0, -1);
    }
    return `${url.host}${path}`;
}

export function getHeadingFromHTML(html: string): string {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const h1 = doc.querySelector("h1") ?? doc.querySelector("h2");
        return (h1?.textContent ?? "").trim();
    } catch (err) {
        return "";
    }
}

export function getFirstParagraphFromHTML(html: string): string {
    try {
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const main = doc.querySelector("main");
        const p = main?.querySelector("p") ?? doc.querySelector("p");
        return (p?.textContent ?? "").trim();
    } catch (err) {
        return "";
    }
}

export function getURLsfromHTML(html: string, baseURL: string): string[] {
        const links: string[] = [];
    try {
        const dom = new JSDOM(html);
        const anchors = dom.window.document.querySelectorAll("a");
        anchors.forEach((a) => {
            const link = a.getAttribute("href");
            if (!link) {
                return;
            }
            try {
                const absoluteUrl = new URL(link, baseURL).toString();
                links.push(absoluteUrl);
            } catch(err) {
                console.error(`invalid href "${link}":`, err);
            }
        });
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }
    return links;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
    const links: string[] = [];
    try {
        const dom = new JSDOM(html);
        const imgs = dom.window.document.querySelectorAll("img");
        imgs.forEach((img) => {
            const link = img.getAttribute("src");
            if (!link) {
                return;
            }
            try {
                const absoluteUrl = new URL(link, baseURL).toString();
                links.push(absoluteUrl);
            } catch (err) {
                console.error(`invalid src "${link}":`, err);
            }
        });
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }
    return links;
}

export type ExtractPageData = {
    url: string;
    heading: string;
    firstParagraph: string;
    outgoingLinks: string[];
    imageURLs: string[];
}

export function extractPageData(html: string, pageURL: string): ExtractPageData {
    return {
        url: pageURL,
        heading: getHeadingFromHTML(html),
        firstParagraph: getFirstParagraphFromHTML(html),
        outgoingLinks: getURLsfromHTML(html, pageURL),
        imageURLs: getImagesFromHTML(html, pageURL)
    };
}

export class ConcurrentCrawler {
    baseURL: string;
    pages: Record<string, ExtractPageData>;
    limit: LimitFunction;
    maxPages: number;
    shouldStop: boolean;
    allTasks: Set<Promise<void>>;

    constructor(baseUrl: string, pages: Record<string, ExtractPageData>, limit: LimitFunction, maxPages: number) {
        this.baseURL = baseUrl;
        this.pages = pages;
        this.limit = limit;
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set();
    }

    private addPageVisit(normalizedURL: string): boolean {
        if (this.shouldStop) {
            return false;
        }
        if (Object.keys(this.pages).length == this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.");
            return false;
        }
        if (this.pages[normalizedURL]) {
            return false;
        }
        return true;
    }
    private async getHTML(url: string) {
        return await this.limit(async () => {
            try {
                const response = await fetch(url, {
                    headers: {
                        "User-Agent": "BootCrawler/1.0"
                    }
                });
                if (response.status >= 400) {
                    console.log(`Received error status ${response.status}`);
                    return;
                }
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("text/html")) {
                    console.log("Response does not contain HTML");
                    return;
                }
                const html = await response.text();
                return html;
            } catch (err) {
                console.error("error fetching HTML:", err);
            }
            return;
        });
    }

    private async crawlPage(currentURL: string = this.baseURL): Promise<void> {
        if (this.shouldStop) {
            return;
        }
        const baseUrlObj = new URL(this.baseURL);
        const currentUrlObj = new URL(currentURL);
        // Only want to crawl internal links
        if (currentUrlObj.hostname !== baseUrlObj.hostname) {
            return;
        }
        // Check if it's a unique page
        const normURL = normalizeURL(currentURL);
        if (this.addPageVisit(normURL)) {
            console.log(`Crawling ${currentURL}...`);
            let html: string | undefined = "";
            try {
                html = await this.getHTML(currentURL);
            } catch (err) {
                console.log(`${(err as Error).message}`);
                return;
            }
            if (html) {
                const data = extractPageData(html, currentURL);
                this.pages[normURL] = data;
                const urls = data.outgoingLinks;
                const crawlPromises = urls.map((url) => {
                    const task = this.crawlPage(url);
                    this.allTasks.add(task);
                    return task.finally(() => this.allTasks.delete(task));
                });
                await Promise.all(crawlPromises);
            }
        }
    }

    async crawl() {
        await this.crawlPage();
        return this.pages;
    }
}

export async function crawlSiteAsync(baseURL: string, maxConcurrency: number, maxPages: number) {
    const crawler = new ConcurrentCrawler(baseURL, {}, pLimit(maxConcurrency), maxPages);
    return await crawler.crawl();
}
