const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function scrapeWebpage(url) {
  try {
    console.log(`Scraping ${url}...`);
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    console.log('\nParagraph texts:');
    $('p').each((index, element) => {
      console.log($(element).text());
    });

    console.log('\nLink URLs:');
    $('a').each((index, element) => {
      console.log($(element).attr('href'));
    });

  } catch (error) {
    console.error('Error scraping webpage:', error);
  }
}

function promptForUrl() {
  rl.question('Enter the URL to scrape (or type "exit" to quit): ', (url) => {
    if (url.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    scrapeWebpage(url).then(() => {
      promptForUrl();
    });
  });
}

console.log('Welcome to the interactive web scraper!');
promptForUrl();