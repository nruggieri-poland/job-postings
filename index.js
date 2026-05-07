const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePolandJobs() {
    // Required flags for GitHub Actions/Ubuntu environments
    const browser = await puppeteer.launch({ 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    
    // Set User Agent to avoid being blocked as a bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    const url = 'https://www.applitrack.com/mahoningesc/onlineapp/default.aspx?AppliTrackPostingSearch=location:%22Poland+Local+School+District+%22';

    try {
        console.log("Navigating to AppliTrack...");
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Waiting for job postings...");
        await page.waitForSelector('.postingsList', { timeout: 15000 });

        const jobs = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.postingsList');

            items.forEach(item => {
                if (item.textContent.includes("Poland Local School District")) {
                    const titleElement = item.querySelector('td#wrapword');
                    const title = titleElement ? titleElement.textContent.trim() : "No Title Found";
                    
                    const jobIdRaw = item.querySelector('.title2')?.textContent?.trim() || "";
                    const jobId = jobIdRaw.replace(/JobID:\s*/i, '').trim();

                    results.push({ title, jobId });
                }
            });
            return results;
        });

        // Ensure dist directory exists
        const distPath = path.join(__dirname, 'dist');
        if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath);
        }

        const outputFilename = path.join(distPath, 'poland_jobs.json');
        fs.writeFileSync(outputFilename, JSON.stringify(jobs, null, 4));
        
        console.log(`Successfully saved ${jobs.length} jobs to ${outputFilename}`);

    } catch (err) {
        console.error("Scrape failed:", err.message);
        process.exit(1); // Exit with error for GitHub Actions to catch
    } finally {
        await browser.close();
    }
}

scrapePolandJobs();