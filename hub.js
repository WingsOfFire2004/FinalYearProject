// Connect to Blockchain
async function connectBlockchain() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
    } else {
        console.error("Ethereum provider not found. Install MetaMask!");
        return;
    }

    const contractAddress = "0x0D2a48aD6dF7565078B2611EFcb6B94311BDDde6";
    const abi = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {"internalType": "string", "name": "_productName", "type": "string"},
                {"internalType": "uint256", "name": "_quantity", "type": "uint256"},
                {"internalType": "string", "name": "_date", "type": "string"}
            ],
            "name": "addFoodGrain",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "batchNumber", "type": "uint256"},
                {"internalType": "string", "name": "newStatus", "type": "string"}
            ],
            "name": "updateStatus",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalFoodGrains",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    window.contract = new web3.eth.Contract(abi, contractAddress);
}

// Function to update status on Blockchain
async function updateBlockchainStatus(batchNumber, status) {
    try {
        const accounts = await web3.eth.getAccounts();
        await window.contract.methods.updateStatus(batchNumber, status).send({ from: accounts[0] });
        console.log(`Blockchain updated: ${batchNumber} -> ${status}`);
    } catch (error) {
        console.error("Blockchain update error:", error);
    }
}

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
        .then(async (data) => {
            if (data.success) {
                await updateBlockchainStatus(batchNumber, "Arrived at Hub");
                alert(`Status updated in blockchain`);
                fetchInTransitBatches(); // Refresh the list
                alert(`Batch ${batchNumber} ${data.message}`);
                const updatedStatus = data.status || await getBatchStatus(batchNumber);
                updateStatus(batchNumber, updatedStatus);
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error("Error simulating arrival:", error);
            //Add code to enable the disabled button
        });
}

async function updateStatus(batchNumber, status) {
    try {
        const response = await fetch("http://localhost:3000/update-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ batchNumber, status }),
        });

        const data = await response.json();
        alert(data.message); // Show success message

        if (data.success) {
            location.reload(); // Refresh the page to update the status
        }
    } catch (error) {
        console.error("Error updating status:", error);
    }
}
// ✅ Function to fetch the latest status from the server
async function getBatchStatus(batchNumber) {
    try {
        const response = await fetch(`http://localhost:3000/batch-status/${batchNumber}`);
        const data = await response.json();
        return data.status;
    } catch (error) {
        console.error("Error fetching batch status:", error);
        return "Unknown"; // Default fallback
    }
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
        .then(async (data) => {
            if (data.success) {
                await updateBlockchainStatus(batchNumber, "Delivery Attempted");
                alert(`Status updated in blockchain`);
                fetchInTransitBatches(); // Refresh the list
                alert(`Batch ${batchNumber} ${data.message}`);
                const updatedStatus = data.status || await getBatchStatus(batchNumber);
                updateStatus(batchNumber, updatedStatus);
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
        .then(async (data) => {
            if (data.success) {
                await updateBlockchainStatus(batchNumber, "Delivered");
                alert(`Status updated in blockchain`);
                fetchInTransitBatches(); // Refresh the list
                alert(`Batch ${batchNumber} ${data.message}`);
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
window.addEventListener("load", connectBlockchain);
