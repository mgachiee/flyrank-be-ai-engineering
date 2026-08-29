import * as cheerio from "cheerio";
import fs from "fs";

const url = "https://books.toscrape.com";
const startUrl = `${url}/catalogue/page-1.html`;
const userAgent = "FlyRankInternship-A9/1.0+https://github.com/mgachiee/flyrank-be-ai-engineering/tree/main/week-5-assignment-5";
const timeout = 5000; // 5 seconds
const delay = 600; // > 500ms delay between network requests
const cacheDir = "cache";

// Define the Book structure
interface Book {
    title: string;
    productUrl: string;
    priceText: string;
    availabilityText: string;
    ratingText: string;
    description?: string | null;
    sourcePage: string;
    fetchedAt: Date;
};

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

const getBookDetails = async (productUrl: string): Promise<Omit<Book, "sourcePage" & Partial<Pick<Book, "sourcePage">>>> => {
    try {
        const html = await getHtmlPage(productUrl);
        const $ = cheerio.load(html);

        const title = $(".product_main h1").text().trim();
        const price = $(".product_main .price_color").first().text().trim();
        const availability = $(".product_main .availability").first().text().trim();
        const rating = $(".product_main .star-rating").first().attr("class")?.replace("star-rating", "").trim() || "Not rated";
        const description = $("#product_description").next("p").text().trim() || null;
        const fetchedAt = new Date();

        return {
            title,
            productUrl,
            priceText: price,
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
    let currentUrl: string | null = startUrl;
    let pagesCount = 0;
    const discoveredUrls: string[] = [];
    const books: Book[] = [];

    while (currentUrl && pagesCount < maxPages) {
        try {
            const html = await getHtmlPage(currentUrl);
            const $ = cheerio.load(html);
            pagesCount++;

            const elements = $(".product_pod h3 a").toArray();

            await Promise.all(
                elements.map(async (el) => {
                    const relativeHref = $(el).attr("href");
                    if (relativeHref) {
                        const absoluteUrl = new URL(relativeHref, currentUrl!).href;
                        discoveredUrls.push(absoluteUrl);

                        // Fetch book details
                        const bookDetails = await getBookDetails(absoluteUrl);
                        books.push({
                            ...bookDetails,
                            sourcePage: currentUrl!,
                        });
                    }
                })
            );

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

    return books;
};

const main = async (startUrl: string, maxPages: number = 3) => {
    const books = await getUniqueUrlsFromPages(startUrl, maxPages);
    console.log("Sample book details:", books[0]);
    console.log(`detail_pages=${books.length}`);
};

(async () => {
    try {
        await main(startUrl, 3);
    } catch (error) {
        console.error("Crawl error:", error);
    }
})();