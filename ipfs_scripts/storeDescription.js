const { Web3Storage } = require("web3.storage");

function makeStorageClient(apiKey) {
  return new Web3Storage({ token: apiKey });
}

async function storeDescription(client, name, cost, description) {
  const contentObject = {
    name,
    cost,
    description
  };

  const content = new Blob([JSON.stringify(contentObject)], { type: "application/json" });
  const cid = await client.put([content]);

  return cid;
}

(async () => {
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDk1RGMxYTREZEY2NDkxOUIwMjljNDJEM2U4RUFBMTQ4Y0NmNzBEMkEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODI0NTQwNzkwMTAsIm5hbWUiOiJvcGVuR1AifQ.jrRwtKsHUhilTWYNuLBKe0SrSEFhbNyhBTLbpzmAuYc";
  const client = makeStorageClient(apiKey);

  const name = "Beverly Hills Mansion";
  const cost = 2000000;
  const description = "We will repaint the walls and adjust the flooring.";

  const cid = await storeDescription(client, name, cost, description);

  console.log(`Stored description with CID: ${cid}`);
})();
