const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
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

    const foodCollection = client.db("foodDB").collection("food");
    const menuCollection = client.db("menuDB").collection("menus");
    const cartCollection = client.db("cartDB").collection("carts");
    const userCollection = client.db("userDB").collection("users");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query); // we are finding the email from database to check is it admin or just a user by this role
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email, req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get("/food", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    app.post("/menus", verifyToken, verifyAdmin, async (req, res) => {
      const additem = req.body;
      const result = await menuCollection.insertOne(additem);
      res.send(result);
    });

    app.get("/menus", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get('/menus/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await menuCollection.findOne(query)
      res.send(result)
    })

    app.patch('/menus/:id', async(req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateddoc = {
        $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          image: item.image
        }
      }
      const result = await menuCollection.updateOne(filter, updateddoc)
      res.send(result)
    })

    app.delete("/menus/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const addcart = req.body;
      const result = await cartCollection.insertOne(addcart);
      res.send(result);
    });

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isexistemail = await userCollection.findOne(query);
      if (isexistemail) {
        return res.send({
          message: "email is already exist",
          insertedId: null,
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers)
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedAdmin = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updatedAdmin);
        res.send(result);
      }
    );

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
