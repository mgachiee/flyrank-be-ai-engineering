# The Polite Scraper

This project is a small TypeScript scraper for the educational [Books to Scrape](https://books.toscrape.com) catalogue. It fetches the first three catalogue pages, visits the books listed on those pages, validates the extracted records, caches downloaded HTML, and writes a report for every run.

## Target Classification

- **Target:** Books to Scrape, an educational sandbox intended for scraping practice.
- **Scope:** The first three catalogue pages, normally 60 books in total.
- **Data collected:** Title, product URL, price text, numeric GBP price, availability, star rating, description, source catalogue page, and fetch timestamp.
- **Why this target:** The site provides public catalogue data specifically for learning. This project does not require login access or collect personal information.
- **Limitation:** The scraper only follows the first three catalogue pages and is not a general-purpose crawler; the site structure and HTML selectors are specific to this target.

## Requirements

- Node.js 18 or newer, with built-in `fetch` support
- npm

## Install and Run

From this directory, install the dependencies and run the scraper:

```bash
npm install && npm run dev
```

The `dev` script runs `src/index.ts` through `tsx`. For a one-time run without the file watcher:

```bash
npx tsx src/index.ts
```

Set `TEST_MODE` to `false` in `src/index.ts` to disable the deliberate fake-book request. With test mode enabled, the fake URL is added once to the first catalogue page so the normal 60 valid records can be checked alongside one recorded failure.

## How It Works

1. Start at `catalogue/page-1.html` and follow the catalogue's `next` link for up to three pages.
2. Convert each relative book link into an absolute URL and remove duplicates with a `Set`.
3. Fetch each book page, extract its fields with Cheerio, and validate the record with Zod.
4. Skip a failed book URL while allowing the remaining books and catalogue pages to finish.
5. Cache successful HTML responses in `cache/` and write JSON results to `output/`.

Each catalogue page and each book page is handled independently. A failed book is recorded and skipped so it does not reject the whole batch. HTTP 404 and 403 responses are not retried because the requested resource is missing or access is forbidden. Server errors such as 500 are retried up to three times, with a 600 ms delay before each request. Requests also use a 5-second timeout and identify themselves with the project user-agent.

## Record Schema

Every accepted book record has this shape:

```json
{
	"title": "string",
	"productUrl": "https://books.toscrape.com/catalogue/...",
	"priceText": "string",
	"priceGbp": "number or null",
	"availabilityText": "string",
	"ratingText": "string",
	"description": "string or null",
	"sourcePage": "https://books.toscrape.com/catalogue/page-1.html",
	"fetchedAt": "ISO date string"
}
```

The runtime Zod schema requires string titles and text fields, valid URLs for `productUrl` and `sourcePage`, a numeric or nullable `priceGbp`, and a valid date for `fetchedAt`.

## Output

The scraper creates these files in `output/`:

- `books.json`: validated book records that were successfully fetched.
- `errors.json`: failed book URLs and their error messages.
- `run-report.json`: run metadata and counters, including `startTime`, `duration`, `pagesFetched`, `cacheHits`, `validRecords`, `invalidRecords`, and `failedPages`.

The `cache/` and `output/` directories are ignored by Git. A fresh clone therefore does not include hundreds of cached HTML files or generated output; run the command above to regenerate them locally.

## Sample Evidence

The following report was produced with test mode enabled before the fake URL was limited to the first catalogue page. It shows three catalogue pages fetched from cache, 60 valid books, and one deliberate failed book URL. The same URL was attempted once per catalogue page in that run, which explains `invalidRecords: 3`:

```json
{
	"startTime": "2026-08-29T12:26:59.708Z",
	"duration": 3.125,
	"pagesFetched": 3,
	"cacheHits": 3,
	"validRecords": 60,
	"invalidRecords": 3,
	"failedPages": {
		"https://books.toscrape.com/catalogue/fake-book_123456789/index.html": "HTTP error! status: 404 for URL: https://books.toscrape.com/catalogue/fake-book_123456789/index.html"
	}
}
```

`failedPages` contains one entry because it is keyed by URL, so repeated attempts overwrite the same property. The current code limits the fake URL to the first catalogue page with `pagesCount === 1`; after rerunning, the expected `invalidRecords` value is one while `validRecords` remains 60.

## Ethics and Limitations

Use an official API when one exists. Never bypass logins, paywalls, robots, rate limits, or access blocks, and collect only the fields needed for the task. This scraper is intentionally limited to a small public educational catalogue, uses a descriptive user-agent, delays requests, caches successful responses, and does not use a browser because the required data is already present in the HTML returned by the server; a browser would only add overhead.