let foodGrainContract;
let currentScannedBatch = null;

window.addEventListener("DOMContentLoaded", async () => {
    await initializeWeb3();
    
    // Always load table data
    loadAllBatchData();

    // FIXED: Only attempt fetch if batch actually exists in storage
    const batch = localStorage.getItem("scannedBatch");
    
    if (batch && batch.trim() !== "" && batch !== "null") {
        console.log("Found scanned batch in storage:", batch);
        document.getElementById("dispatchForm").style.display = "block";
        currentScannedBatch = batch;
        fetchBatchDetails(batch);
    } else {
        // No alert, just keep the form hidden until a scan occurs
        document.getElementById("dispatchForm").style.display = "none";
    }
});

async function initializeWeb3() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const web3 = new Web3(window.ethereum);
            const contractAddress = "0x2Bfe7d57189c0f916f7F6B6Ae2539D01FcFFAF43"; 
            const contractABI = [
                { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
                {
                    "inputs": [
                        {"internalType": "uint256", "name": "batchNumber", "type": "uint256"},
                        {"internalType": "string", "name": "newStatus", "type": "string"}
                    ],
                    "name": "updateStatus", "outputs": [], "stateMutability": "nonpayable", "type": "function"
                }
            ];

            foodGrainContract = new web3.eth.Contract(contractABI, contractAddress);
            console.log("Web3 initialized successfully.");
        } catch (error) {
            console.error("MetaMask access denied:", error);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

function loadAllBatchData() {
    fetch("http://localhost:3000/dispatch-items")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const itemList = document.getElementById("itemList");
                itemList.innerHTML = "";
                data.items.forEach(item => {
                    const row = `<tr><td>${item.batch_number}</td><td>${item.product_name}</td><td>${item.quantity}</td></tr>`;
                    itemList.innerHTML += row;
                });
            }
        }).catch(err => console.error("Data fetch error:", err));
}

function fetchBatchDetails(batchNumber) {
    // We only call this when we are sure batchNumber is valid
    fetch(`http://localhost:3000/get-batch-details/${batchNumber}`)
        .then(res => {
            if (!res.ok) throw new Error("Not found");
            return res.json();
        })
        .then(data => {
            document.getElementById("scannedBatch").textContent = batchNumber;
            document.getElementById("scannedProduct").textContent = data.product_name;
            document.getElementById("scannedQuantity").textContent = data.quantity + " Kg";
        })
        .catch(err => {
            console.error("Batch fetch error:", err);
            // If fetching failed (e.g. manually entered wrong ID in storage), then alert
            alert("Error: Scanned batch not found in database.");
            document.getElementById("dispatchForm").style.display = "none";
        });
}

async function confirmDispatch() {
    const vehicle = document.getElementById("vehicleInput").value.trim();
    const driver = document.getElementById("driverInput").value.trim();

    if (!vehicle || !driver) {
        alert("Please enter driver name and vehicle number.");
        return;
    }

    try {
        console.log("Starting dispatch for batch:", currentScannedBatch);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const status = "In Transit";
        
        // 1. Blockchain Update
        // Use .send().on('receipt') to ensure we wait for the actual confirmation
        console.log("Awaiting MetaMask confirmation...");
        const receipt = await foodGrainContract.methods
            .updateStatus(Number(currentScannedBatch), status)
            .send({ from: accounts[0] });

        console.log("Blockchain transaction successful:", receipt.transactionHash);

        // 2. Database Update
        console.log("Updating local database...");
        const response = await fetch("http://localhost:3000/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                batchNumber: currentScannedBatch,
                driverName: driver,
                vehicleNumber: vehicle,
                status: status
            })
        });

        const result = await response.json();
        
        // 3. Success Feedback
        if (result.success) {
            console.log("Database updated. Showing success alert.");
            alert(`✅ Batch #${currentScannedBatch} dispatched successfully!\nTransaction Hash: ${receipt.transactionHash}`);
            
            localStorage.removeItem("scannedBatch"); 
            resetDispatchForm();
            loadAllBatchData();
        } else {
            alert("dispatched successfully " + result.message);
        }

    } catch (err) {
        console.error("Dispatch failure detail:", err);
        // Specifically check if the user rejected the transaction
        if (err.code === 4001) {
            alert("Transaction rejected by user in MetaMask.");
        } else {
            alert("Transaction failed. Please check the console for details.");
        }
    }
}

function redirectToScanner() { window.location.href = "scan.html"; }

function resetDispatchForm() {
    document.getElementById("dispatchForm").style.display = "none";
    document.getElementById("vehicleInput").value = "";
    document.getElementById("driverInput").value = "";
    currentScannedBatch = null;
}