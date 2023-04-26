// const IPFS = require("ipfs-http-client");

const ipfs = require("ipfs-http-client")({
    host: "ipfs.infura.io",
    port: "5001",
    protocol: "https",
  });

async function getDescription(cid) {
  const stream = ipfs.cat(cid);
  let description = "";

  for await (const chunk of stream) {
    description += chunk.toString();
  }

  return description;
}

(async () => {
  const cid = "bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354";
  const description = await getDescription(cid);
  console.log(`Description: ${description}`);
})();
