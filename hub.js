// Fetch and display all "In Transit" batches
function fetchInTransitBatches() {
    fetch("http://localhost:3000/in-transit-items") // Update API endpoint as needed
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayInTransitBatches(data.items);
            } else {
                alert("Error fetching in-transit batches");
            }
        })
        .catch((error) => console.error("Error fetching in-transit batches:", error));
}

// Display batches on the Hub Page
function displayInTransitBatches(items) {
    const batchList = document.getElementById("batchList");
    batchList.innerHTML = ""; // Clear existing content

    items.forEach((batch) => {
        if (batch.status === "In Transit" || batch.status ==="Arrived at Hub" || batch.status ==="Delayed at Hub" || batch.status ==="Out for Delivery" || batch.status ==="Delivery Attempted" || batch.status ==="Delivered") {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${batch.batch_number}</td>
                <td>${batch.product_name}</td>
                <td>${batch.quantity}</td>
                <td>${batch.status}</td>
                <td>
                    <button onclick="simulateArrival('${batch.batch_number}')"
                    ${batch.status === "Arrived at Hub" || batch.status === "Delayed at Hub" || batch.status === "Out for Delivery" || batch.status === "Delivery Attempted" || batch.status === "Delivered"? "disabled" : ""}>
                    Simulate Arrival
                    </button>
                </td>
                <td>
                    <button onclick="OutForDeliveryDetails('${batch.batch_number}')"
                    ${batch.status === "Out for Delivery"  || batch.status === "Delivery Attempted"  || batch.status === "In Transit" || batch.status === "Delivered"? "disabled" : ""}>
                    Out for Delivery
                    </button>
                </td>
                <td id="driver-${batch.batch_number}">${batch.delivery_driver_name ? batch.delivery_driver_name : '-'}</td>
                <td id="phone-${batch.batch_number}">${batch.delivery_phone_number ? batch.delivery_phone_number : '-'}</td>
                <td>
                    <button onclick="simulateDelivered('${batch.batch_number}')"
                    ${batch.status === "Delivered" || batch.status === "Arrived at Hub" || batch.status === "Delayed at Hub" || batch.status === "In Transit"? "disabled" : ""}>
                    Delivered
                    </button>
                </td>

            `;
            batchList.appendChild(row);
        }
    });
}

// Simulate arrival at the hub
function simulateArrival(batchNumber) {
    fetch("http://localhost:3000/arrive-at-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert(`Batch ${batchNumber} ${data.message}`);
                fetchInTransitBatches(); // Refresh the list
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error("Error simulating arrival:", error);
            //Add code to enable the disabled button
        });
}

// Simulate out for Delivery Details
function OutForDeliveryDetails(batchNumber) {
    const driverName = `Driver-${Math.floor(Math.random() * 100) + 1}`; // Random driver name
    const phoneNumber = `${["8", "7", "9"][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 1e9).toString().padStart(9, "0")}`;//Random Phone number
    simulateOutForDelivery(batchNumber, driverName, phoneNumber);
}

// Simulate out for delivery at the hub
function simulateOutForDelivery(batchNumber, driverName, phoneNumber) {
    fetch("http://localhost:3000/out-for-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber, driverName, phoneNumber }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert(`Batch ${batchNumber} ${data.message}`);
                fetchInTransitBatches(); // Refresh the list
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error("Error simulating arrival:", error);
            //Add code to enable the disabled button
        });
}



// Simulate delivered
function simulateDelivered(batchNumber) {
    fetch("http://localhost:3000/delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert(`Batch ${batchNumber} ${data.message}`);
                fetchInTransitBatches(); // Refresh the list
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error("Error simulating arrival:", error);
            //Add code to enable the disabled button
        });
}



// Initialize the page
fetchInTransitBatches();
