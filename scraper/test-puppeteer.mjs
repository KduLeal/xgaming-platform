import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navegando para ML...');
  const response = await page.goto('https://lista.mercadolivre.com.br/rtx-4090', { waitUntil: 'domcontentloaded' });
  console.log('Status:', response.status());
  
  if (response.status() === 200) {
    const title = await page.title();
    console.log('Title:', title);
    const firstPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.andes-money-amount__fraction');
      return priceElement ? priceElement.innerText : 'Não encontrado';
    });
    console.log('First price found:', firstPrice);
  } else {
    console.log('Blocked!');
  }
  
  await browser.close();
})();
