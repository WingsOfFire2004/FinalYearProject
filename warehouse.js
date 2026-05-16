// Replace with deployed contract address and ABI
const contractAddress = "0x2Bfe7d57189c0f916f7F6B6Ae2539D01FcFFAF43"; 
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_productName", "type": "string" },
            { "internalType": "uint256", "name": "_quantity", "type": "uint256" },
            { "internalType": "string", "name": "_date", "type": "string" }
        ],
        "name": "addFoodGrain",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "batchNumber", "type": "uint256" },
            { "internalType": "string", "name": "newStatus", "type": "string" }
        ],
        "name": "updateStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalFoodGrains",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

let web3;
let foodGrainContract;

// Initialize Web3 and Smart Contract
async function initializeWeb3() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" }); 
            web3 = new Web3(window.ethereum);
            foodGrainContract = new web3.eth.Contract(contractABI, contractAddress);
            console.log("✅ Web3 and Contract Initialized");
        } catch (error) {
            console.error("User denied MetaMask access:", error);
            alert("Please allow MetaMask access to use this feature.");
        }
    } else {
        alert("MetaMask is not installed. Please install MetaMask.");
    }
}

// Call this function on page load
initializeWeb3();

// Fetch and display warehouse items
function fetchWarehouseItems() {
    fetch("http://localhost:3000/warehouse-items")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayWarehouseItems(data.items);
            } else {
                alert("Error fetching warehouse items");
            }
        })
        .catch((error) => {
            console.error("Error fetching warehouse items:", error);
            alert("Error fetching warehouse items");
        });
}

// Display warehouse items in the table
function displayWarehouseItems(items) {
    const itemList = document.getElementById("itemList");
    itemList.innerHTML = ""; // Clear previous rows

    items.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>${item.batch_number}</td>
            <td>${item.status}</td>
            <td>
                <button ${item.status === "Packed for Dispatch" ? "disabled" : ""} onclick="packForDispatch('${item.batch_number}')">Pack for Dispatch</button>
            </td>
        `;
        itemList.appendChild(row);
    });
}

// Update status in blockchain and refresh UI
async function packForDispatch(batchNumber) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        // Use BigInt to handle long batch numbers without rounding errors
        const batchId = BigInt(batchNumber).toString(); 
        const statusText = "Packed for Dispatch";

        console.log(`Pushing to Blockchain: ID ${batchId}`);

        // Call the contract - ensure your ABI has TWO inputs for this function
        await foodGrainContract.methods.updateStatus(batchId, statusText)
            .send({ from: accounts[0] });

        // Now update your SQL Database so the UI refreshes
        const response = await fetch("http://localhost:3000/pack-dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchNumber: batchNumber })
        });

        const data = await response.json();
        if (data.success) {
            alert(`✅ Blockchain & Database Updated for Batch ${batchNumber}`);
            fetchWarehouseItems(); // Refresh the table
        }
    } catch (error) {
        console.error("Critical Revert:", error);
        alert("Transaction Failed. Make sure MetaMask is on the correct Ganache network.");
    }
}
// Handle barcode scanning
function scanItem() {
    const batchNumber = document.getElementById("scanInput").value.trim();

    if (!batchNumber) {
        alert("Please enter a batch number");
        return;
    }

    fetch(`http://localhost:3000/product-details/${batchNumber}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayScannedItem(data.product);
            } else {
                alert("Product not found");
            }
        })
        .catch((error) => {
            console.error("Error fetching product details:", error);
            alert("Error fetching product details");
        });
        document.getElementById("scanInput").value = "";
}

// Display scanned product details
function displayScannedItem(product) {
    const resultSection = document.getElementById("scanResultSection");
    const infoGrid = document.getElementById("productInfo");
    const downloadBtn = document.getElementById("downloadBarcodeBtn");

    // Make the hidden result area visible
    resultSection.style.display = "block";
    downloadBtn.style.display = "block";

    // Populate the info grid with a cleaner look
    infoGrid.innerHTML = `
        <div class="info-item"><span class="info-label">Product:</span> ${product.product_name}</div>
        <div class="info-item"><span class="info-label">Quantity:</span> ${product.quantity} KG</div>
        <div class="info-item"><span class="info-label">Batch:</span> ${product.batch_number}</div>
        <div class="info-item"><span class="info-label">Status:</span> ${product.status}</div>
        <div class="info-item" style="grid-column: span 2;"><span class="info-label">Arrival:</span> ${new Date(product.date).toLocaleString()}</div>
    `;

    // Generate the barcode
    generateBarcode(product.batch_number);
}

// Generate barcode for the batch number
function generateBarcode(batchNumber) {
    try {
        JsBarcode("#barcode", batchNumber, {
            format: "CODE128",
            displayValue: true
        });
    } catch (error) {
        console.error("Barcode rendering error:", error);
    }
}

function downloadBarcode() {
    const svg = document.getElementById("barcode");
    const canvas = document.createElement("canvas");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    // Create a Blob from the SVG data
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function() {
        // Set canvas size to match the barcode
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        // Fill background white (so it's printable)
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0);
        
        // Trigger download
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `Label_${document.getElementById("scanInput").value || 'barcode'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    img.src = url;
}

// Initialize warehouse items list on page load
fetchWarehouseItems();
