import * as cheerio from "cheerio";
import fs from "fs";

const url = "https://books.toscrape.com";
const startUrl = `${url}/catalogue/page-1.html`;
const userAgent = "FlyRankInternship-A9/1.0+https://github.com/mgachiee/flyrank-be-ai-engineering/tree/main/week-5-assignment-5";
const timeout = 5000; // 5 seconds
const delay = 600; // > 500ms delay between network requests
const cacheDir = "cache";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createCatalogueCacheKey = (targetUrl: string): string => {
    /**
     * Replace all forward slashes and non-alphanumeric characters with underscores to create a valid cache key
     * and append ".html" to the end of the cache key.
     * This ensures that the cache key is a valid filename and avoids issues with special characters in URLs.
     */
    return targetUrl.replace(/https?:\/\//g, "").replace(/[^a-zA-Z0-9]/g, "_") + ".html";
};

const getHtmlPage = async (targetUrl: string): Promise<string> => {
    try {
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const cacheKey = createCatalogueCacheKey(targetUrl);
        const cachePath = `${cacheDir}/${cacheKey}`;

        if (fs.existsSync(cachePath)) {
            const html = fs.readFileSync(cachePath, "utf-8");
            const fileSize = fs.statSync(cachePath).size;
            console.log(`CACHE: Loaded ${targetUrl} from cache (${fileSize} bytes)`);
            return html;
        }

        // Enforce rate limiting before making actual network request
        await sleep(delay);

        const response = await fetch(targetUrl, {
            headers: { "User-Agent": userAgent },
            signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        fs.writeFileSync(cachePath, html, "utf-8"); // Cache the fetched HTML to disk

        const htmlSize = Buffer.byteLength(html, "utf-8");
        console.log(`FETCH: Fetched ${targetUrl} (${htmlSize} bytes) -> cached.`);
        return html;
    } catch (error) {
        console.error(`Error fetching page ${targetUrl}:`, error);
        throw error;
    }
};

const main = async (startUrl: string, maxPages: number = 3) => {
    let currentUrl: string | null = startUrl;
    let pagesCount = 0;
    const discoveredUrls: string[] = [];

    while (currentUrl && pagesCount < maxPages) {
        try {
            const html = await getHtmlPage(currentUrl);
            const $ = cheerio.load(html);
            pagesCount++;

            // Extract book links on the current page
            $(".product_pod h3 a").each((_i, el) => {
                const relativeHref = $(el).attr("href");
                if (relativeHref) {
                    const absoluteUrl = new URL(relativeHref, currentUrl!).href;
                    discoveredUrls.push(absoluteUrl);
                }
            });

            const nextHref = $("li.next a").attr("href");
            if (nextHref) {
                currentUrl = new URL(nextHref, currentUrl).href;
            } else {
                currentUrl = null;
            }
        } catch (error) {
            console.error(`Error fetching page ${currentUrl}:`, error);
            break; // Exit the loop on error
        }
    }

    const uniqueUrls = Array.from(new Set(discoveredUrls));
    console.log(`catalogue_pages=${pagesCount}, discovered=${discoveredUrls.length}, unique_urls=${uniqueUrls.length}`);
};

(async () => {
    try {
        await main(startUrl, 3);
    } catch (error) {
        console.error("Crawl error:", error);
    }
})();