import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`[PAGEERROR] ${err.message}`));

  console.log('Navigating to http://localhost:3000/products/original-trunk ...');
  await page.goto('http://localhost:3000/products/original-trunk');
  await page.waitForTimeout(1500);

  // 1. Check initial state
  const title = (await page.locator('h1').textContent())?.trim();
  const sizeText = (await page.locator('button[class*="sizeDropdownBtn"]').textContent())?.trim();
  const colorText = (await page.locator('p[class*="colorLabel"]').textContent())?.trim();
  const heroSrcInitial = await page.locator('img[class*="heroMainImg"]').getAttribute('src');

  console.log('--- Initial State ---');
  console.log({ title, sizeText, colorText, heroSrcInitial });

  // 2. Test Size Dropdown navigation
  console.log('\n--- Testing Size Dropdown Navigation ---');
  const sizeBtn = page.locator('button[class*="sizeDropdownBtn"]');
  await sizeBtn.click();
  await page.waitForTimeout(400);

  // Click on "Cabin 55 × 40 × 23 cm" option
  const cabinOpt = page.locator('div[class*="sizeDropdownMenu"] button').filter({ hasText: 'Cabin 55 × 40 × 23 cm' }).first();
  console.log('Clicking Cabin option in dropdown...');
  await cabinOpt.click();
  await page.waitForTimeout(1500);

  console.log('Current URL after clicking size:', page.url());
  const newTitle = (await page.locator('h1').textContent())?.trim();
  const newSize = (await page.locator('button[class*="sizeDropdownBtn"]').textContent())?.trim();
  console.log({ newTitle, newSize });

  // Navigate back to original-trunk
  await page.goto('http://localhost:3000/products/original-trunk');
  await page.waitForTimeout(1500);

  // 3. Test Color Swatches and photo change
  console.log('\n--- Testing Color Swatches ---');
  const swatches = page.locator('button[class*="swatchBtn"]');
  const swatchCount = await swatches.count();
  console.log('Swatches available:', swatchCount);

  if (swatchCount > 1) {
    console.log('Clicking Black swatch (index 1)...');
    await swatches.nth(1).click();
    await page.waitForTimeout(600);

    const newColorText = (await page.locator('p[class*="colorLabel"]').textContent())?.trim();
    const newHeroSrc = await page.locator('img[class*="heroMainImg"]').getAttribute('src');
    console.log({ newColorText, newHeroSrc, photoChanged: newHeroSrc !== heroSrcInitial });
  }

  // 4. Test Size Guide
  console.log('\n--- Testing Size Guide Modal ---');
  const sizeGuideLink = page.getByRole('button', { name: /Size guide/i });
  await sizeGuideLink.click();
  await page.waitForTimeout(400);

  const modal = page.locator('div[class*="modalBackdrop"]');
  console.log('Size guide modal visible:', await modal.isVisible());
  if (await modal.isVisible()) {
    const modalTitle = (await modal.locator('h3').textContent())?.trim();
    console.log('Modal title:', modalTitle);
    await modal.locator('button[class*="modalCloseBtn"]').click();
    await page.waitForTimeout(300);
    console.log('Modal closed:', !(await modal.isVisible()));
  }

  // 5. Test Wishlist Toggle
  console.log('\n--- Testing Wishlist Toggle ---');
  const wishlistBtn = page.locator('button[class*="wishlistBtn"]');
  console.log('Wishlist before:', (await wishlistBtn.textContent())?.trim());
  await wishlistBtn.click();
  await page.waitForTimeout(400);
  console.log('Wishlist after 1st click:', (await wishlistBtn.textContent())?.trim());
  await wishlistBtn.click();
  await page.waitForTimeout(400);
  console.log('Wishlist after 2nd click:', (await wishlistBtn.textContent())?.trim());

  // 6. Test Add To Cart
  console.log('\n--- Testing ADD TO CART Button ---');
  const addBtn = page.locator('button[class*="addToCartBtn"]');
  console.log('Add button text:', (await addBtn.textContent())?.trim());
  console.log('Add button disabled:', await addBtn.isDisabled());

  await addBtn.click();
  await page.waitForTimeout(1000);

  console.log('Add button text after click:', (await addBtn.textContent())?.trim());
  const drawer = page.getByRole('dialog', { name: 'Your Shopping bag' });
  console.log('Shopping bag drawer visible:', await drawer.isVisible());
  if (await drawer.isVisible()) {
    const drawerTitle = (await drawer.locator('h2').textContent())?.trim();
    const drawerItems = await drawer.locator('article[class*="itemCard"]').count();
    console.log({ drawerTitle, drawerItems });
  }

  // Capture screenshot of the verified action section
  const actionSection = page.locator('div[class*="rightColumn"]');
  await actionSection.screenshot({ path: 'C:/Users/Adarsh/.gemini/antigravity-ide/brain/321f60bd-54de-4c21-bef7-243cbf3a8bef/pdp_action_section_fixed.png' });
  console.log('Screenshot saved to pdp_action_section_fixed.png');

  console.log('\n--- Console Errors During Run ---');
  const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('PAGEERROR'));
  console.log(errors.length > 0 ? errors.join('\n') : '0 errors!');

  await browser.close();
}

main().catch(console.error);
