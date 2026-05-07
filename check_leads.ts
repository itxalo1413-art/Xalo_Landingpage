import { MongoClient } from 'mongodb';

async function checkLeads() {
  const uri = "mongodb+srv://itxalo1413:itxalo1413@cluster0.npn6bch.mongodb.net/testLandingPage?appName=Cluster0v";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('testLandingPage');
    const count = await db.collection('leads').countDocuments();
    console.log(`Total leads: ${count}`);
    const leads = await db.collection('leads').find({}).limit(5).toArray();
    console.log('Sample leads:', leads.map(l => l.email));
  } finally {
    await client.close();
  }
}

checkLeads();
