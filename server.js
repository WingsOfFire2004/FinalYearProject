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

    const query = "INSERT INTO food_grains (product_name, quantity, date, batch_number, status) VALUES (?, ?, ?, ?, ?)";
    const initialStatus = "Order Created";
    db.query(query, [productName, quantity, date, batchNumber, initialStatus], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send({ success: false, message: "Error storing data" });
        }

        res.json({ success: true, batchNumber });
    });
});

// API to fetch all warehouse items

app.get("/warehouse-items", (req, res) => {
    const query = "SELECT * FROM food_grains";
    db.query(query, ["Order Created"], (err, results) => {
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

// API to update batch status to "Packed for Dispatch"

app.post("/pack-dispatch", (req, res) => {
    const { batchNumber } = req.body;

    if (!batchNumber) {
        return res.status(400).send({ success: false, message: "Batch number is required" });
    }
    console.log(`Received request to update batch ${batchNumber} status to "Packed for Dispatch"`);  // Log received batch number

    const query = "UPDATE food_grains SET status = ?, created_at = NOW() WHERE batch_number = ?";
    const newStatus = "Packed for Dispatch";

    db.query(query, [newStatus, batchNumber], (err, result) => {
        if (err) {
            console.error("Error updating batch status:", err);
            return res.status(500).send({ success: false, message: "Error updating batch status" });
        }

        if (result.affectedRows === 0) {
            console.log(`No batch found with batch number ${batchNumber}`);  // Log no result scenario
            return res.status(404).send({ success: false, message: "Batch not found" });
        }
        console.log(`Batch ${batchNumber} status updated successfully to "Packed for Dispatch"`);
        res.send({ success: true, message: `Batch ${batchNumber} updated to "${newStatus}"` });
    });
});


// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
