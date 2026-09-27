const { chromium } = require('playwright');
const fs = require('fs');

async function scrapeALUCanvas() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to ALU Canvas...');
  await page.goto('https://alueducation.instructure.com/courses/3130/pages/week-4-session-2-slide-oop-in-javascript?module_item_id=153553');

  console.log('Please log in manually. Complete 2FA on your phone if asked.');
  await page.waitForURL('**/courses**', { timeout: 0 });
  console.log('Login verified! Going to the course...');

console.log('\nNow click into your course, then click "Assignments" in the left sidebar.');
console.log('Waiting until the Assignments page loads...\n');

await page.waitForURL('**/assignments**', { timeout: 0 });
await page.waitForSelector('.assignment-list', { timeout: 15000 });

  const assignmentRows = await page.locator('.assignment-list .ig-row').all();
  const scrapedAssignments = [];

  console.log(`Found ${assignmentRows.length} assignments. Extracting data...`);

  for (const row of assignmentRows) {
    try {
      // Title
      const title = await row.locator('.ig-title').innerText();

      // Due date (some assignments might not have one)
      const dueDateEl = row.locator('.assignment-date-due');
      const dueDate = (await dueDateEl.count()) > 0
        ? await dueDateEl.innerText()
        : 'No due date';

      // Status
      const statusEl = row.locator('.submission-status-container');
      const status = (await statusEl.count()) > 0
        ? await statusEl.innerText()
        : 'Not Submitted / Available';

      // Points possible (clean it up so it's just a number)
      const pointsEl = row.locator('.js-score, .points_possible');
      let points = (await pointsEl.count()) > 0 ? await pointsEl.innerText() : '';
      points = points.replace(/[^\d.]/g, '');
      if (points === '' || isNaN(points)) {
        points = 'N/A';
      }

      // Short description
      const descEl = row.locator('.ig-details, .description');
      const description = (await descEl.count()) > 0
        ? await descEl.innerText()
        : 'No description';

      // Figure out if it's active or past by comparing the due date to today
      let timeline = 'unknown';
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        timeline = parsedDate >= new Date() ? 'active' : 'past';
      }

      scrapedAssignments.push({
        title: title.trim().replace(/\n/g, ' '),
        dueDate: dueDate.trim().replace(/\n/g, ' '),
        status: status.trim().replace(/\n/g, ' '),
        points: points,
        description: description.trim().replace(/\n/g, ' '),
        timeline: timeline
      });

    } catch (error) {
      // If one row breaks, just skip it and keep going
      console.log('Skipped one row because of an error:', error.message);
      continue;
    }
  }

  console.log('\n--- SCRAPED ASSIGNMENT DATA ---');
  console.table(scrapedAssignments);

  fs.writeFileSync('canvas_assignments.json', JSON.stringify(scrapedAssignments, null, 2), 'utf-8');
  console.log('Saved to canvas_assignments.json');

  await page.waitForTimeout(5000);
  await browser.close();
}

scrapeALUCanvas();