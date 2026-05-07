const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapePolandJobs() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://www.applitrack.com/mahoningesc/onlineapp/default.aspx?AppliTrackPostingSearch=location:%22Poland+Local+School+District+%22';

    try {
        console.log("Navigating to AppliTrack...");
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log("Waiting for job postings to load...");
        await page.waitForSelector('.postingsList', { timeout: 10000 });

        const jobs = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.postingsList');

            items.forEach(item => {
                // Verify this is a Poland listing
                if (item.textContent.includes("Poland Local School District")) {
                    
                    // Grab Title: finding the specific cell inside this posting
                    const titleElement = item.querySelector('td#wrapword');
                    const title = titleElement ? titleElement.textContent.trim() : "No Title Found";
                    
                    // Grab JobID: cleaning up the "JobID: " prefix
                    const jobIdRaw = item.querySelector('.title2')?.textContent?.trim() || "";
                    const jobId = jobIdRaw.replace(/JobID:\s*/i, '').trim();

                    results.push({ 
                        title: title, 
                        jobId: jobId 
                    });
                }
            });
            return results;
        });

        // --- Save to JSON File ---
        const outputFilename = 'poland_jobs.json';
        const jsonData = JSON.stringify(jobs, null, 4); // Indent with 4 spaces for readability

        fs.writeFileSync(outputFilename, jsonData);
        
        console.log(`\nSuccess! Found ${jobs.length} postings.`);
        console.log(`Data has been saved to: ${outputFilename}`);
        console.table(jobs);

    } catch (err) {
        console.error("Error: The script timed out or couldn't find the postings. This usually happens if the search returned no results.");
    } finally {
        await browser.close();
    }
}

scrapePolandJobs();