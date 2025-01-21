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
    const logQuery = "INSERT INTO stage_logs (batch_number, stage) VALUES (?, ?)";
    const initialStatus = "Order Created";
    db.query(query, [productName, quantity, date, batchNumber, initialStatus], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send({ success: false, message: "Error storing data" });
        }

        // Log the initial stage in stage_logs
        db.query(logQuery, [batchNumber, initialStatus], (logErr) => {
            if (logErr) {
                console.error("Error logging stage:", logErr);
                return res.status(500).send({ success: false, message: "Error logging stage" });
            }
            console.log("Initial stage logged successfully in stage_logs.");
            res.json({ success: true, batchNumber });
        });
    });
});

// API to fetch all warehouse items
app.get("/warehouse-items", (req, res) => {
    const query = "SELECT * FROM food_grains WHERE status = 'Order Created' OR status = 'Packed for Dispatch'";
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

// API to update batch status to "Packed for Dispatch"

app.post("/pack-dispatch", (req, res) => {
    const { batchNumber } = req.body;

    if (!batchNumber) {
        return res.status(400).send({ success: false, message: "Batch number is required" });
    }
    console.log(`Received request to update batch ${batchNumber} status to "Packed for Dispatch"`);  // Log received batch number

    const query = "UPDATE food_grains SET status = ?, created_at = NOW() WHERE batch_number = ?";
    const logQuery = "INSERT INTO stage_logs (batch_number, stage) VALUES (?, ?)";
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
        // Log the status update in stage_logs table
        db.query(logQuery, [batchNumber, newStatus], (logErr) => {
            if (logErr) {
                console.error("Error logging stage:", logErr);
                return res.status(500).send({ success: false, message: "Error logging stage" });
            }
        res.send({ success: true, message: `Batch ${batchNumber} updated to "${newStatus}"` });
        });
    });
});


// Fetch the stage history for a specific batch
app.get("/batch-history/:batchNumber", (req, res) => {
    const { batchNumber } = req.params;
    const query = "SELECT stage, timestamp FROM stage_logs WHERE batch_number = ? ORDER BY timestamp";

    db.query(query, [batchNumber], (err, results) => {
        if (err) {
            console.error("Error fetching batch history:", err);
            return res.status(500).send({ success: false, message: "Error fetching batch history" });
        }

        if (results.length === 0) {
            return res.status(404).send({ success: false, message: "No history found for the batch" });
        }

        res.send({ success: true, history: results });
    });
});

// API to fetch all dispatched items
app.get("/dispatch-items", (req, res) => {
    const query = "SELECT * FROM food_grains WHERE status = 'Packed for Dispatch' OR status = 'In Transit'";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching warehouse items:", err);
            return res.status(500).send({ success: false, message: "Error fetching warehouse items" });
        }

        res.send({ success: true, items: results });
    });
});

// API to dispatch a batch
app.post("/dispatch-batch", (req, res) => {
    console.log("Dispatch API called with data:", req.body);
    const { batchNumber, vehicleNumber, driverName } = req.body;

    if (!batchNumber || !vehicleNumber || !driverName) {
        return res.status(400).send({ success: false, message: "Batch number, vehicle number, and driver name are required" });
    }

    const updateQuery = "UPDATE food_grains SET status = ?, driver_name = ?, vehicle_number = ?, created_at = NOW() WHERE batch_number = ?";
    const logQuery = "INSERT INTO stage_logs (batch_number, stage, timestamp) VALUES (?, ?, NOW())";
    const status = "In Transit";
    

    // Update food_grains table
    db.query(updateQuery, [status, driverName, vehicleNumber, batchNumber], (err, result) => {
        if (err) {
            console.error("Error updating batch status:", err);
            return res.status(500).send({ success: false, message: "Error dispatching batch" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).send({ success: false, message: "Batch not found" });
        }

        // Log the status change in stage_logs
        db.query(logQuery, [batchNumber, status], (logErr) => {
            if (logErr) {
                console.error("Error logging stage:", logErr);
                return res.status(500).send({ success: false, message: "Error logging stage" });
            }

            res.send({ success: true, message: "Batch dispatched successfully", batchNumber });
        });
    });
});

// API to fetch all in-transit items

app.get("/in-transit-items", (req, res) => {
    const query = "SELECT * FROM food_grains WHERE status = 'In Transit' OR status = 'Arrived at Hub'";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching warehouse items:", err);
            return res.status(500).send({ success: false, message: "Error fetching warehouse items" });
        }

        res.send({ success: true, items: results });
    });
});

// API to simulate batch arrival at regional hub
app.post("/arrive-at-hub", (req, res) => {
    const { batchNumber } = req.body;
    if (!batchNumber) {
        return res.status(400).send({ success: false, message: "Batch number is required" });
    }

    // Simulate a random delay (30% chance of delay)
    const delayChance = Math.random() < 0.3;
    const status = delayChance ? "Delayed at Hub" : "Arrived at Hub";

    const updateQuery = "UPDATE food_grains SET status = ?, created_at = NOW() WHERE batch_number = ?";
    const logQuery = "INSERT INTO stage_logs (batch_number, stage, timestamp) VALUES (?, ?, NOW())";

    // setTimeout(() => {
    //     // Update status in the food_grains table
        db.query(updateQuery, [status, batchNumber], (err, result) => {
            if (err) {
                console.error("Error updating batch status:", err);
                return res.status(500).send({ success: false, message: "Error updating batch status" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).send({ success: false, message: "Batch not found" });
            }

            // Log the event
            const logMessage = delayChance
                ? `${status} - Sorting Error`
                : status;

            db.query(logQuery, [batchNumber, logMessage], (logErr) => {
                if (logErr) {
                    console.error("Error logging stage:", logErr);
                    return res.status(500).send({ success: false, message: "Error logging stage" });
                }

                res.send({ success: true, message: `Batch ${batchNumber} ${status}`, batchNumber });
            });
        });
    //}, 10000); // 10 seconds delay
});


// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
