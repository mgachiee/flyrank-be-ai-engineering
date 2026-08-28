import fs from "fs";

const url = "https://books.toscrape.com";

// First three catalogue URLs to scrape
const catalogueUrl = [
    "/catalogue/category/books/travel_2/index.html",
    "/catalogue/category/books/mystery_3/index.html",
    "/catalogue/category/books/historical-fiction_4/index.html"
];
const userAgent = "FlyRankInternship-A9/1.0+https://github.com/mgachiee/flyrank-be-ai-engineering/tree/main/week-5-assignment-5";
const timeout = 5000; // 5 seconds

const createCatalogueCacheKey = (catalogueUrl: string): string => {
    // Replace all forward slashes with underscores to create a valid cache key
    return `${catalogueUrl.replace(/\//g, "_")}`;
};

const scrapeBooksFromCatalogue = async (catalogueUrl: string) => {
    try {
        await fetch(`${url}${catalogueUrl}`,
            {
                headers: {
                    "User-Agent": userAgent
                },
                signal: AbortSignal.timeout(timeout)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Save the raw HTML to a cache file for future use
                const cacheKey = createCatalogueCacheKey(catalogueUrl);
                const cachePath = `cache/${cacheKey}`;
                if (!fs.existsSync("cache")) fs.mkdirSync("cache"); // Ensure the cache directory exists
                fs.writeFileSync(`${cachePath}`, html, "utf-8");

                const htmlSize = Buffer.byteLength(html, "utf-8");
                console.log(`FETCH: Fetched catalogue page for ${catalogueUrl}. Size: ${htmlSize} bytes. Saved to cache.`);
            });
    } catch (error) {
        console.error("Error scraping books from catalogue:", error);
        return undefined;
    }
};

const main = async (catalogueUrl: string) => {
    try {
        if (!fs.existsSync("cache")) fs.mkdirSync("cache");

        // Check if the cache file exists (.html file)
        const cacheKey = createCatalogueCacheKey(catalogueUrl);
        const cachePath = `cache/${cacheKey}`;

        // Check if the cache file exists, return if it does
        if (fs.existsSync(cachePath)) {
            const fileSize = fs.statSync(cachePath).size;
            console.log(`CACHE HIT: Cache file for ${catalogueUrl} exists. Size: ${fileSize} bytes.`);
            return;
        }

        // Fetch the catalogue page and scrape the books
        await scrapeBooksFromCatalogue(catalogueUrl);
    } catch (error) {
        console.error("Error scraping books:", error);
    }
};

(async () => {
    // Test one of the catalogue URLs
    const testCatalogueUrl = catalogueUrl[0] as string;
    await main(testCatalogueUrl);
})();