const express = require('express')
const app = express()
const route = require('./routes/femaRoutes')
const cors = require('cors')

app.use(express.json())
app.use(cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

app.use('/fema', route)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log('Server running at port ' + PORT))