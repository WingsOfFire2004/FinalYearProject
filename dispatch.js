// Fetch all "Packed for Dispatch" batches
function fetchDispatchBatches() {
    fetch("http://localhost:3000/dispatch-items") // Modify endpoint if necessary
        .then((response) => response.json())
        .then((data) => {
            console.log("API Response:", data.items); // Log all fetched items
            if (data.success) {
                const filteredItems = data.items.filter(
                    (item) => item.status === "Packed for Dispatch" || item.status === "In Transit"
                );
                console.log("Filtered Items:", filteredItems); // Log filtered items
                displayDispatchBatches(filteredItems);
            } else {
                alert("Error fetching dispatch batches");
            }
        })
        .catch((error) => console.error("Error fetching dispatch batches:", error));
}

// Display batches in the Dispatch Page
function displayDispatchBatches(batches) {
    const batchList = document.getElementById("dispatchList");
    batchList.innerHTML = ""; // Clear existing rows

    batches.forEach((batch) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${batch.batch_number}</td>
            <td>${batch.product_name}</td>
            <td>${batch.quantity}</td>
            <td id="status-${batch.batch_number}">${batch.status}</td>
            <td id="vehicle-${batch.batch_number}">${batch.vehicle_number ? batch.vehicle_number : '-'}</td>
            <td id="driver-${batch.batch_number}">${batch.driver_name ? batch.driver_name : '-'}</td>
            <td>
                <button id="dispatch-btn-${batch.batch_number}" 
                onclick="dispatchBatch('${batch.batch_number}')"
                ${batch.status === "In Transit" ? "disabled" : ""}>Dispatch</button>
            </td>
        `;

        batchList.appendChild(row);
    });
}

// Simulate dispatch and handle delays
function dispatchBatch(batchNumber) {
    const vehicleNumber = `VEH${Math.floor(Math.random() * 9000) + 1000}`; // Random vehicle number
    const driverName = `Driver-${Math.floor(Math.random() * 100) + 1}`; // Random driver name
    const delay = Math.random() > 0.7; // 30% chance of delay

    console.log(`Dispatching batch ${batchNumber}...${vehicleNumber}...${driverName}`);
        if (delay) {
            console.log(`Batch ${batchNumber}: Delayed in Transit - Traffic Jam`);
            updateDispatchStatus(batchNumber, vehicleNumber, driverName, "In Transit (Delayed)");
        } else {
            console.log(`Batch ${batchNumber}: Dispatched successfully`);
            updateDispatchStatus(batchNumber, vehicleNumber, driverName, "In Transit");
        }
}

// Update batch status in the backend
function updateDispatchStatus(batchNumber, vehicleNumber, driverName, status) {
    console.log("Sending dispatch request for:", { batchNumber, vehicleNumber, driverName });
    
    fetch("http://localhost:3000/dispatch-batch", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchNumber, vehicleNumber, driverName}),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to dispatch batch: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                fetchDispatchBatches();
                alert(`Batch ${batchNumber} dispatched successfully!`);
            } else {
                alert(`Error dispatching batch ${batchNumber}: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error("Error updating dispatch status:", error);
            
            // Re-enable the dispatch button on error
            const dispatchButton = document.getElementById(`dispatch-btn-${batchNumber}`);
            dispatchButton.disabled = false;

            const statusCell = document.getElementById(`status-${batchNumber}`);
            statusCell.textContent = "Packed for Dispatch";
        });
}
