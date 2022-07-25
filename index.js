const cors = require("cors");
const express = require("express");
const app = express();
const route = require("./routes/femaRoutes");
require("dotenv").config();
app.use(cors());
app.use(express.json());

app.use("/fema", route);

const config = {
	connectionString: "postgresql://sanesh:sanesh123@localhost:5432/fema_app",
	max: 30,
};

if (process.env.NODE_ENV == "production") {
	config.ssl = {
		rejectUnauthorized: false,
	};
	config.connectionString = process.env.DATABASE_URL;
}
app.use("/fema", route);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server running at port " + PORT));
