const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

const db = require("./server/config/db");
const route = require("./server/routes/route");

db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", route);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});