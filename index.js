const puppeteer = require('puppeteer');

async function scrapePolandJobs() {
    // 1. Launch a browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // The URL with the search parameter
    const url = 'https://www.applitrack.com/mahoningesc/onlineapp/default.aspx?AppliTrackPostingSearch=location:%22Poland+Local+School+District+%22';

    try {
        console.log("Navigating to AppliTrack...");
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 2. Wait for the postings to actually load into the DOM
        // We wait for the specific class you identified
        await page.waitForSelector('.postingsList', { timeout: 10000 });

        // 3. Extract the data from the browser context
        const jobs = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.postingsList');

            items.forEach(item => {
                // Double check it's a Poland listing (AppliTrack search can be fuzzy)
                if (item.textContent.includes("Poland Local School District")) {
                    
                    // Get the Title from the <td> with id wrapword
                    const title = item.querySelector('#wrapword')?.textContent?.trim() || "No Title";
                    
                    // Get JobID from the span
                    const jobIdRaw = item.querySelector('.title2')?.textContent?.trim() || "";
                    const jobId = jobIdRaw.replace('JobID:', '').trim();

                    // Get Position Type
                    // It's usually the first 'normal' class span after the 'Position Type:' label
                    const type = item.querySelector('.normal')?.textContent?.trim() || "N/A";

                    results.push({ title, jobId, type });
                }
            });
            return results;
        });

        console.log(`Success! Found ${jobs.length} postings:`);
        console.table(jobs);

    } catch (err) {
        console.error("Error or Timeout: No postings found. The page might be empty or taking too long.");
    } finally {
        await browser.close();
    }
}

scrapePolandJobs();