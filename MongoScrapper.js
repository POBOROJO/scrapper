const axios = require("axios");
const cheerio = require("cheerio");
const readline = require("readline");
const { MongoClient } = require("mongodb");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const mongoUrl = "mongodb://localhost:27017/scrapper";
const dbName = "webScraperDB";
const collectionName = "scrapedData";

async function connectToMongoDB() {
  const client = new MongoClient(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
  });
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(dbName).collection(collectionName);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

async function scrapeWebpage(url, collection) {
  try {
    console.log(`Scraping ${url}...`);
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const scrapedData = {
      url: url,
      timestamp: new Date(),
      paragraphs: [],
      links: [],
    };

    $("p").each((index, element) => {
      scrapedData.paragraphs.push($(element).text());
    });

    $("a").each((index, element) => {
      scrapedData.links.push($(element).attr("href"));
    });

    await collection.insertOne(scrapedData);
    console.log("Data saved to MongoDB");

    console.log("\nScraped Data Summary:");
    console.log(`Paragraphs: ${scrapedData.paragraphs.length}`);
    console.log(`Links: ${scrapedData.links.length}`);
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          console.error("Error: Page not found (404)");
          break;
        case 403:
          console.error("Error: Access forbidden (403)");
          break;
        default:
          console.error(`Error: HTTP status ${error.response.status}`);
      }
    } else if (error.request) {
      console.error("Error: No response received from the server");
    } else {
      console.error("Error:", error.message);
    }
  }
}

async function main() {
  let mongoCollection;
  try {
    mongoCollection = await connectToMongoDB();
    console.log("Welcome to the MongoDB-integrated web scraper!");

    const promptForUrl = () => {
      rl.question(
        'Enter the URL to scrape (or type "exit" to quit): ',
        async (url) => {
          if (url.toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
          }

          await scrapeWebpage(url, mongoCollection);
          promptForUrl();
        }
      );
    };

    promptForUrl();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    rl.close();
    process.exit(1);
  }
}

main();
