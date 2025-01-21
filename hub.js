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
        if (batch.status === "In Transit" || batch.status ==="Arrived at Hub") {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${batch.batch_number}</td>
                <td>${batch.product_name}</td>
                <td>${batch.quantity}</td>
                <td>${batch.status}</td>
                <td>
                    <button onclick="simulateArrival('${batch.batch_number}')"
                    ${batch.status === "Arrived at Hub" ? "disabled" : ""}>Simulate Arrival</button>
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
        .catch((error) => console.error("Error simulating arrival:", error));
}



// Initialize the page
fetchInTransitBatches();
