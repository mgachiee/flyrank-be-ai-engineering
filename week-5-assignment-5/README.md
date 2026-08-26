# The Polite Scraper

A small, polite scraping pipeline: it downloads the first three catalogue pages of Books to Scrape, visits all
60 book pages, turns messy HTML into clean, checked JSON records, survives a broken page without crashing, and
ends every run with a short report of what happened.

## Target Classification

- **Target Site:** Books to Scrape (`https://books.toscrape.com`).
- **Reason:** It is an open educational sandbox explicitly created for practicing web scraping without violating commercial terms or terms of service.
- **Scope:** First 3 catalogue pages only (~60 books).
- **Robots.txt:** No robots file found (returns a 404 status).
- **Data Collected:** Book title, price, star rating, availability status, and product URL.
- **Appropriateness:** Scraping this small batch of public catalog data is appropriate because the site is hosted specifically for benign scraping practice, and a 3-page limit ensures neglible server load.

I will not reuse this code on another site without checking its rules and terms first.