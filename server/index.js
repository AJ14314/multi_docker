const keys = require('./keys');

// Express App setup
const express = require('express');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());
//alternate of cors
/**
 app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept,Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,DELETE,OPTIONS,PUT,HEAD"
    );
    next();
});
*/

// Postgres client setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    port: keys.pgPort,
    password: keys.pgPassword
});
pgClient.on('error', (err) => {
    console.log(`error while connecting to the postgres ${err}`);
});

pgClient.on('connect', (client) => {
    let query = `CREATE TABLE IF NOT EXISTS values (number INT)`;
    client.query(query).catch((err) => {
        console.log(`error while creating table ${err}`);
    })
});


// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
// this connection can only be used for publish/subcribe purpose only
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
    res.send('Hi Welcome to the Fibo calculator')
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');

    res.send(values.rows);
});

// Redis library don't have out of the box promise support
app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    //we are imposing the limit to the index so that worker won't overload
    if (parseInt(index) > 50) {
        return res.status(422).send('Index too high');
    }
    redisClient.hset('values', index, 'Nothing Yet!');

    redisPublisher.publish('insert', index);

    pgClient.query(`INSERT INTO VALUES(number) values($1)`, [index]);

    res.status(200).send({ working: true });
});

app.listen(5000, () => {
    console.log(`Backend listening...`);
});