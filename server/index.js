require('dotenv').config();
const express = require("express");
const path = require("path");
const pg = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: DATABASE_URL,
});

// Middleware to parse JSON bodies in requests
app.use(express.json());

// Serve static files (ensure the path is correct)
app.use(express.static(path.join(__dirname, '../client/dist')));

// GET all flavors
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors;`;
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (ex) {
    next(ex);
  }
});

// GET a single flavor by id
app.get('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id = $1;`;
    const result = await client.query(SQL, [req.params.id]);
    res.send(result.rows);
  } catch (ex) {
    next(ex);
  }
});

// POST a new flavor
app.post('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *;
    `;
    const result = await client.query(SQL, [req.body.name, req.body.is_favorite]);
    res.send(result.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

//DELETE a flavor
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
      const SQL = `
        DELETE from flavors
        WHERE id = $1
      `
      const response = await client.query(SQL, [req.params.id])
      res.sendStatus(204)
    } catch (ex) {
      next(ex)
    }
  })

  //UPDATE a flavor
  app.put('/api/flavors/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `
      const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id])
      res.send(response.rows[0])
    } catch (ex) {
      next(ex)
    }
  })
  

// Initialize the database and start the server
const init = async () => {
  try {
    await client.connect();
    const SQL = `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        is_favorite BOOLEAN DEFAULT false,
        create_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
      INSERT INTO flavors (name, is_favorite) 
      VALUES 
        ('vanilla', true), 
        ('chocolate', false), 
        ('strawberry', false), 
        ('peanut butter', false);
    `;
    await client.query(SQL);
    console.log('Data seeded');

    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

init();
