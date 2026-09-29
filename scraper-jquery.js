const { chromium } = require('playwright');
const { JSDOM } = require('jsdom');

async function scrapeALUCanvas() {
  
    
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to ALU Canvas...');
  await page.goto('https://alueducation.instructure.com/courses/3130/pages/week-5-session-1-slide-jquery?module_item_id=153566'); 
  console.log('Please log in manually. Complete 2FA on your phone if asked.');
  await page.waitForURL('**/courses**', { timeout: 0 });
  console.log('Login verified!');

  console.log('\nNow click into your course, then click "Assignments" in the left sidebar.');
  console.log('Waiting until the Assignments page loads...\n');
  await page.waitForURL('**/assignments**', { timeout: 0 });
  await page.waitForSelector('.assignment-list', { timeout: 15000 });

  
  const html = await page.content();
  await browser.close();

  
  const dom = new JSDOM(html);
  const { window } = dom;
  const $ = require('jquery')(window);

  const rows = $('.assignment-list .ig-row');
  console.log(`Found ${rows.length} assignments.\n`);

  rows.each(function (index, element) {
    const row = $(element);

    const titleEl = row.find('.ig-title');
    const title = titleEl.text().trim() || 'Untitled assignment';

    const dueDateEl = row.find('.assignment-date-due');
    const dueDate = dueDateEl.length > 0 ? dueDateEl.text().trim() : 'No due date';

    const statusEl = row.find('.submission-status-container');
    const status = statusEl.length > 0 ? statusEl.text().trim() : 'Not Submitted / Available';

    const link = titleEl.attr('href') || 'No link available';

    console.log('--------------------------------------------------');
    console.log('Title:    ' + title);
    console.log('Status:   ' + status);
    console.log('Due Date: ' + dueDate);
    console.log('Link:     ' + link);
  });

  console.log('--------------------------------------------------');
}

scrapeALUCanvas();