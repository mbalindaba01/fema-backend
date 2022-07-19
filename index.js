const express = require('express')
const app = express()
const route = require('./routes/femaRoutes')
const cors = require('cors')

app.use(express.json())
app.use(cors())
app.use('/fema', route)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log('Server running at port ' + PORT))