const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Keerthi@2004",
    database: "supply_chain"
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL database");
});

// Generate a unique 15-digit batch number
function generateBatchNumber() {
    return Math.floor(Math.random() * 1e15).toString().padStart(15, "0");
}

// API to handle form submission
app.post("/add-food", (req, res) => {
    const { productName, quantity, date } = req.body;
    const batchNumber = generateBatchNumber();

    const query = "INSERT INTO food_grains (product_name, quantity, date, batch_number) VALUES (?, ?, ?, ?)";
    db.query(query, [productName, quantity, date, batchNumber], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error storing data");
        }

        res.json({ success: true, batchNumber });
    });
});

// API to fetch all warehouse items

app.get("/warehouse-items", (req, res) => {
    const query = "SELECT * FROM food_grains";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching warehouse items:", err);
            return res.status(500).send({ success: false, message: "Error fetching warehouse items" });
        }

        res.send({ success: true, items: results });
    });
});


// API to fetch warehouse items by Batch number
app.get("/product-details/:batchNumber", (req, res) => {
    const { batchNumber } = req.params;
    const query = "SELECT * FROM food_grains WHERE batch_number = ?";
    db.query(query, [batchNumber], (err, results) => {
        if (err) {
            console.error("Error fetching product details:", err);
            return res.status(500).send({ success: false, message: "Error fetching data" });
        }

        if (results.length === 0) {
            return res.status(404).send({ success: false, message: "Product not found" });
        }

        res.send({ success: true, product: results[0] });
    });
});



// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
