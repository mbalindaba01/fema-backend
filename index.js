const express = require('express')
const PgPromise = require("pg-promise")
require('dotenv').config();
const cors = require('cors')
const API = require('./routes/femaRoutes')

const app = express();
app.use(express.json())

app.options("*", cors());

app.use('/fema', route);

const config = {
	connectionString: 'postgresql://sanesh:sanesh123@localhost:5432/fema_app',
	max: 30
};

if(process.env.NODE_ENV == 'production'){
    config.ssl = {
		rejectUnauthorized : false
	}
    config.connectionString = process.env.DATABASE_URL
}
// app.use('/fema', route)

const pgp = PgPromise({});
const db = pgp(config);

API(app, db);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log('Server running at port ' + PORT))

module.exports = app;
=======
app.listen(PORT, () => console.log('Server running at port ' + PORT))
