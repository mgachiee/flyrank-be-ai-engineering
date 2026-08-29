import * as cheerio from "cheerio";
import { z } from "zod";
import fs from "fs";

/**
 * CONFIGURATION
 * 
 * This section contains configuration constants for the web scraping script, 
 * including the base URL of the website to scrape, the starting URL for the catalogue pages, 
 * user agent string, timeout and delay settings, and directory paths for caching and output.
 */
const TEST_MODE = false; // Set to true to enable test mode, which appends a fake item for testing error handling
const url = "https://books.toscrape.com";
const fakeBookUrl = `${url}/catalogue/fake-book_123456789/index.html`;
const startUrl = `${url}/catalogue/page-1.html`;
const userAgent = "FlyRankInternship-A9/1.0+https://github.com/mgachiee/flyrank-be-ai-engineering/tree/main/week-5-assignment-5";
const timeout = 5000; // 5 seconds
const delay = 600; // > 500ms delay between network requests
const cacheDir = "cache";
const outputDir = "output";

/**
 * Data Structures
 * 
 * This section defines TypeScript interfaces for the data structures used in the web scraping script, 
 * including the structure of a scrape report and the structure of a book record. 
 * It also defines a Zod schema for validating book records.
 */
interface ScrapeReport {
    startTime: Date;
    duration: number;
    pagesFetched: number;
    cacheHits: number;
    validRecords: number;
    invalidRecords: number;
    failedPages: Record<string, string>; // URL -> Error message
};

// Define the Book structure
interface Book {
    title: string;
    productUrl: string;
    priceText: string;
    priceGbp?: number | null | undefined;
    availabilityText: string;
    ratingText: string;
    description?: string | null | undefined;
    sourcePage: string;
    fetchedAt: Date;
};

// Define a Zod schema for validating Book records
const bookSchema = z.object({
    title: z.string(),
    productUrl: z.url(),
    priceText: z.string(),
    priceGbp: z.number().nullable().optional(),
    availabilityText: z.string(),
    ratingText: z.string(),
    description: z.string().nullable().optional(),
    sourcePage: z.url(),
    fetchedAt: z.date(),
});

/**
 * Helper Functions
 * 
 * This section contains helper functions used in the web scraping script, including:
 * - sleep: A function to pause execution for a specified number of milliseconds.
 * - createCatalogueCacheKey: A function to create a valid cache key from a target URL.
 * - getHtmlPage: A function to fetch an HTML page from a URL, with caching and error handling.
 * - getNumericPrice: A function to extract a numeric price from a price string.
 * - getBookDetails: A function to extract book details from a product page.
 * - getUniqueUrlsFromPages: A function to crawl catalogue pages, extract unique product URLs, and gather book details.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createCatalogueCacheKey = (targetUrl: string): string => {
    /**
     * Replace all forward slashes and non-alphanumeric characters with underscores to create a valid cache key
     * and append ".html" to the end of the cache key.
     * This ensures that the cache key is a valid filename and avoids issues with special characters in URLs.
     */
    return targetUrl.replace(/https?:\/\//g, "").replace(/[^a-zA-Z0-9]/g, "_") + ".html";
};

const getHtmlPage = async (targetUrl: string): Promise<{ html: string, method: "fetch" | "cache" }> => {
    try {
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const cacheKey = createCatalogueCacheKey(targetUrl);
        const cachePath = `${cacheDir}/${cacheKey}`;

        if (fs.existsSync(cachePath)) {
            const html = fs.readFileSync(cachePath, "utf-8");
            const fileSize = fs.statSync(cachePath).size;
            console.log(`CACHE: Loaded ${targetUrl} from cache (${fileSize} bytes)`);
            return { html, method: "cache" };
        }

        const maxRetries = 3;
        let lastResponse: Response | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            // Enforce rate limiting before making actual network request
            await sleep(delay);

            const response = await fetch(targetUrl, {
                headers: { "User-Agent": userAgent },
                signal: AbortSignal.timeout(timeout),
            });

            lastResponse = response;

            // Retry on 500 errors, as these indicate a server-side issue that may be temporary.
            if (response.status == 500) continue;
            
            // No need to retry on 404 or 403 errors, 
            // as these indicate that the resource is not available or access is forbidden.
            if ([404, 403].includes(response.status) || !response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for URL: ${targetUrl}`);
            }

            const html = await response.text();
            fs.writeFileSync(cachePath, html, "utf-8"); // Cache the fetched HTML to disk

            const htmlSize = Buffer.byteLength(html, "utf-8");
            console.log(`FETCH: Fetched ${targetUrl} (${htmlSize} bytes) -> cached.`);
            return { html, method: "fetch" };
        }

        throw new Error(`Failed to fetch ${targetUrl} after ${maxRetries} attempts. Last response status: ${lastResponse?.status}`);
    } catch (error) {
        console.error(`Error fetching page ${targetUrl}:`, error);
        throw error;
    }
};

const getNumericPrice = (priceText: string): number | null => {
    const match = priceText.match(/[\d,.]+/);

    if (match) {
        const numericString = match[0].replace(/,/g, ""); // Remove commas for thousands
        return parseFloat(numericString);
    }

    return null;
};

const getBookDetails = async (productUrl: string): Promise<Omit<Book, "sourcePage" & Partial<Pick<Book, "sourcePage">>>> => {
    try {
        const { html } = await getHtmlPage(productUrl);
        const $ = cheerio.load(html);

        const title = $(".product_main h1").text().trim();
        const priceText = $(".product_main .price_color").first().text().trim();
        const availability = $(".product_main .availability").first().text().trim();
        const rating = $(".product_main .star-rating").first().attr("class")?.replace("star-rating", "").trim() || "Not rated";
        const description = $("#product_description").next("p").text().trim() || null;
        const fetchedAt = new Date();

        return {
            title,
            productUrl,
            priceText,
            priceGbp: getNumericPrice(priceText),
            availabilityText: availability,
            ratingText: rating,
            description,
            fetchedAt,
        }
    } catch (error) {
        console.error(`Error fetching books from page ${productUrl}:`, error);
        throw error;
    }
};

const getUniqueUrlsFromPages = async (startUrl: string, maxPages: number = 3): Promise<Book[]> => {
    // Initialize counters and data structures
    let currentUrl: string | null = startUrl;
    let pagesCount = 0;
    let cacheHits = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let failedPages: Record<string, string> = {}; // To store pages that failed to fetch and their error messages
    const startTime = new Date();

    const discoveredUrls: string[] = [];
    const books: Book[] = [];
    const seenUrls = new Set<string>();
    const errorUrls: Record<string, string> = {}; // To store URLs that failed to fetch and their error messages

    while (currentUrl && pagesCount < maxPages) {
        try {
            const { html, method } = await getHtmlPage(currentUrl);
            const $ = cheerio.load(html);
            pagesCount++;
            if (method === "cache") cacheHits++;

            const elements = $(".product_pod h3 a").toArray();

            const productUrls = elements.map(el => {
                const relativeHref = $(el).attr("href");
                return relativeHref
                    ? new URL(relativeHref, currentUrl!).href
                    : null;
            }).filter((productUrl): productUrl is string => productUrl !== null); // Filter out null values

            // Append the fake book URL for testing error handling
            if (TEST_MODE && pagesCount === 1) productUrls.push(fakeBookUrl);

            await Promise.all(
                productUrls.map(async (absoluteUrl) => {
                    discoveredUrls.push(absoluteUrl);

                    try {
                        // Fetch book details
                        const bookDetails = await getBookDetails(absoluteUrl);
                        
                        // Only add the book if it hasn't been seen before
                        if (seenUrls.has(absoluteUrl)) return;
                        seenUrls.add(absoluteUrl);

                        const parsedBook = bookSchema.parse({
                            ...bookDetails,
                            sourcePage: currentUrl!,
                        });

                        validRecords++;
                        books.push(parsedBook);
                    } catch (error) {
                        invalidRecords++;
                        if (error instanceof z.ZodError) {
                            errorUrls[absoluteUrl] = error.issues
                                .map(issue => issue.message)
                                .join(", ");
                            failedPages[absoluteUrl] = errorUrls[absoluteUrl];
                        } else {
                            errorUrls[absoluteUrl] = (error as Error).message;
                            failedPages[absoluteUrl] = errorUrls[absoluteUrl];
                        }
                    }
                })
            );

            const nextHref = $("li.next a").attr("href");
            if (nextHref) currentUrl = new URL(nextHref, currentUrl).href;
            else currentUrl = null;
        } catch (error) {
            console.error(`Error fetching page ${currentUrl}:`, error);
            failedPages[currentUrl!] = (error as Error).message;
            continue; // Skip to the next iteration to attempt fetching the next page
        }
    }

    const uniqueUrls = Array.from(new Set(discoveredUrls));
    const report: ScrapeReport = {
        startTime,
        duration: (new Date().getTime() - startTime.getTime()) / 1000, // Duration in seconds
        pagesFetched: pagesCount,
        cacheHits,
        validRecords,
        invalidRecords,
        failedPages,
    };

    // Save books and error URLs to JSON files for further inspection
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(`${outputDir}/books.json`, JSON.stringify(books, null, 2), "utf-8");
    fs.writeFileSync(`${outputDir}/errors.json`, JSON.stringify(errorUrls, null, 2), "utf-8");
    fs.writeFileSync(`${outputDir}/run-report.json`, JSON.stringify(report, null, 2), "utf-8");

    console.log(`catalogue_pages=${pagesCount}, discovered=${discoveredUrls.length}, unique_urls=${uniqueUrls.length}`);

    return books;
};

/**
 * Main Function
 * 
 * This is the main function that orchestrates the web scraping process. It takes a starting URL and a maximum number of pages to scrape, 
 * calls the getUniqueUrlsFromPages function to gather book details, and logs a sample book and the total number of detail pages found.
 */
const main = async (startUrl: string, maxPages: number = 3) => {
    const books = await getUniqueUrlsFromPages(startUrl, maxPages);
    console.log("Sample book details:", books[0]);
    console.log(`detail_pages=${books.length}`);
};

// Execute the main function with error handling
(async () => {
    try {
        await main(startUrl, 3);
    } catch (error) {
        console.error("Crawl error:", error);
    }
})();