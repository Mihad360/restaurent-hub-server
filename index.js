const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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
    const menuCollection = client.db('menuDB').collection('menus')
    const cartCollection = client.db('cartDB').collection('carts')
    const userCollection = client.db('userDB').collection('users')

    app.get('/food', async(req, res)=> {
      const result = await foodCollection.find().toArray()
      res.send(result)
    })

    app.get('/menus', async(req, res)=> {
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    app.post('/carts', async(req, res)=> {
      const addcart = req.body;
      const result = await cartCollection.insertOne(addcart)
      res.send(result)
    })

    app.get('/carts', async(req, res)=> {
      const email = req.query.email;
      const query = {email: email}
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res)=> {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    app.post('/users', async(req, res) => {
      const user = req.body;
      const query = {email: user.email}
      const isexistemail = await userCollection.findOne(query)
      if(isexistemail){
        return res.send({message: "email is already exist", insertedId: null})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users', async(req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.delete('/users/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedAdmin = {
          $set: {
            role: "admin"
          }
      }
      const result = await userCollection.updateOne(filter, updatedAdmin)
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