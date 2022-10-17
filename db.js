const { MongoClient } = require('mongodb');

// Connection URL
const url = process.env.MONGO_URL;
console.log(url);
const client = new MongoClient(url);

// Database Name
const dbName = 'lame';

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('rounds');

  // the following code examples can be pasted here...

  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());