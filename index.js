const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// var jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster12.gzqipta.mongodb.net/?retryWrites=true&w=majority&appName=Cluster12`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db('foodDB').collection('food')
    const menuCollection = client.db('menuDB').collection('menu')
    const cartCollection = client.db('cartDB').collection('carts')

    app.get('/food', async(req, res)=> {
      const result = await foodCollection.find().toArray()
      res.send(result)
    })

    app.get('/menu', async(req, res)=> {
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    app.post('/carts', async(req, res)=> {
      const addcart = req.body;
      const result = await cartCollection.insertOne(addcart)
      res.send(result)
    })

    app.get('/carts', async(req, res)=> {
      const result = await cartCollection.find().toArray()
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send(`boss is running`);
});

app.listen(port, (req, res) => {
  console.log(`boss is running on port: ${port}`);
});