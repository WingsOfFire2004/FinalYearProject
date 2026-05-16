const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const { sendEmailNotification, sendSMSNotification } = require("./notification");
require("dotenv").config();

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// Allow CORS (for phone browser access)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // adjust to your IP if needed
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });


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

// POST endpoint to receive scanned data
app.post("/receive", (req, res) => {
    const { batch_number } = req.body;
    console.log("📦 Received batch number:", batch_number);
    res.json({ success: true, received: batch_number });
  });
  

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

// API to fetch all warehouse items
app.get("/dispatchview-items", (req, res) => {
    const query = "SELECT * FROM food_grains WHERE status = 'In Transit'";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching warehouse items:", err);
            return res.status(500).send({ success: false, message: "Error fetching warehouse items" });
        }

        res.send({ success: true, items: results });
    });
});




// GET batch details for a scanned batch number
app.get("/get-batch-details/:batchNumber", async (req, res) => {
    const batchNumber = req.params.batchNumber;
  
    try {
      const result = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM food_grains WHERE batch_number = ?",
          [batchNumber],
          (err, results) => {
            if (err) return reject(err);
            resolve(results);
          }
        );
      });
  
      if (result.length === 0) {
        return res.status(404).json({ error: "Batch not found" });
      }
  
      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  // POST dispatch info and update batch status
  app.post("/dispatch", async (req, res) => {
    const { batchNumber, driverName, vehicleNumber, status } = req.body;
  
    // Check if all fields are provided
    if (!batchNumber || !driverName || !vehicleNumber) {
      return res.status(400).json({ error: "Missing fields" });
    }
  
    try {
      // Update batch status to 'In Transit' and add driver details
      const updateQuery = `
        UPDATE food_grains
        SET status =  ?, driver_name = ?, vehicle_number = ?
        WHERE batch_number = ?
      `;
      console.log("Updating food_grains with batch number:", batchNumber);
      await db.query(updateQuery, [status, driverName, vehicleNumber, batchNumber]);
      console.log("Update successful");
      // Log the dispatch status change in the stage_logs table
      const logQuery = `
        INSERT INTO stage_logs (batch_number, stage)
        VALUES (?, ?)
      `;
      await db.query(logQuery, [batchNumber, status]);
  
      // Respond with success
      res.json({ message: "Dispatch recorded successfully" });
    } catch (error) {
      console.error("Error updating dispatch status:", error);
      res.status(500).json({ error: "Failed to dispatch" });
    }
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
    const query = "SELECT * FROM food_grains WHERE status = 'Packed for Dispatch'";
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
    const query = "SELECT * FROM food_grains WHERE status = 'In Transit' OR status = 'Arrived at Hub' OR status='Out for Delivery' OR status = 'Delayed at Hub' OR status = 'Delivery Attempted' OR status = 'Delivered'";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching warehouse items:", err);
            return res.status(500).send({ success: false, message: "Error fetching warehouse items" });
        }

        res.send({ success: true, items: results });
    });
});

app.get("/batch-status/:batchNumber", async (req, res) => {
    const { batchNumber } = req.params;

    // 🔹 SQL Query to Fetch Status for the Given Batch Number
    const sql = "SELECT status FROM food_grains WHERE batch_number = ?";

    db.query(sql, [batchNumber], (err, results) => {
        if (err) {
            console.error("Error fetching batch status:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Batch not found" });
        }

        // 🔹 Send the Status in Response
        res.json({ success: true, status: results[0].status });
    });
});

// API to simulate batch arrival at regional hub
app.post("/arrive-at-hub", (req, res) => {
    const { batchNumber } = req.body;
    if (!batchNumber) {
        return res.status(400).send({ success: false, message: "Batch number is required" });
    }

    // Simulate a random delay (30% chance of delay)
    const delayChance = Math.random() < 0.8;
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


// API to simulate out for delivery at regional hub
app.post("/out-for-delivery", (req, res) => {
    const { batchNumber, driverName,  phoneNumber} = req.body;

    if (!batchNumber || !driverName || !phoneNumber) {
        return res.status(400).send({ success: false, message: "Batch number, vehicle number, and driver name are required" });
    }


    // Simulate a random delay (30% chance of delay)
    const delayChance = Math.random() < 0.8;
    const status = delayChance ? "Delivery Attempted" : "Out for Delivery";

    const updateQuery = "UPDATE food_grains SET status = ?, delivery_driver_name = ?, delivery_phone_number = ?, created_at = NOW() WHERE batch_number = ?";
    const logQuery = "INSERT INTO stage_logs (batch_number, stage, timestamp) VALUES (?, ?, NOW())";

    // setTimeout(() => {
    //     // Update status in the food_grains table
        db.query(updateQuery, [status, driverName, phoneNumber, batchNumber], (err, result) => {
            if (err) {
                console.error("Error updating batch status:", err);
                return res.status(500).send({ success: false, message: "Error updating batch status" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).send({ success: false, message: "Batch not found" });
            }

            // Log the event
            const logMessage = delayChance
                ? `${status} - FPS closed`
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


// API to simulate Delivered
app.post("/delivered", (req, res) => {
    const { batchNumber} = req.body;

    if (!batchNumber) {
        return res.status(400).send({ success: false, message: "Batch number required" });
    }

    const status = "Delivered";
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

            db.query(logQuery, [batchNumber, status], (logErr) => {
                if (logErr) {
                    console.error("Error logging stage:", logErr);
                    return res.status(500).send({ success: false, message: "Error logging stage" });
                }

                res.send({ success: true, message: `Batch ${batchNumber} ${status}`, batchNumber });
            });
        });
    //}, 10000); // 10 seconds delay
});

app.post("/update-status", async (req, res) => {
    const { batchNumber, status } = req.body;

    // 🔹 Fetch email and phone number from the database (Replace with actual DB query)
    const batchDetails = await getBatchDetails(batchNumber);
    const email = batchDetails.email;
    const phoneNumber = batchDetails.phone;

    console.log(`Updating batch ${batchNumber} status to ${status}`);

    // Check for error statuses & send notifications
    if (status === "Delayed at Hub" || status === "Delivery Attempted") {
        const message = `⚠️ Alert: Your shipment ${batchNumber} encountered an issue: ${status}. Please check for updates.`;

        // Send Email Notification
        if (email) sendEmailNotification(email, "Supply Chain Alert", message);

        // Send SMS Notification
        if (phoneNumber) sendSMSNotification(phoneNumber, message);
    }

    res.json({ success: true, message: `Status updated to ${status}` });
});

// 🔹 Simulated Database Query (Replace with actual DB call)
async function getBatchDetails(batchNumber) {
    return {
        email: "keerthi03122004@gmail.com", // Fetch from database
        phone: "+918145386720", // Fetch from database
    };
}


// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
