const contractAddress = "0x2Bfe7d57189c0f916f7F6B6Ae2539D01FcFFAF43"; // Replace with deployed contract address
const contractABI = [
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
        "inputs": [],
        "name": "getTotalFoodGrains",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

let web3;
let foodGrainContract;

async function connectMetamask() {
    if (typeof Web3 === "undefined") {
        alert("Web3 library not found. Please include Web3.js.");
        return;
    }

    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const accounts = await web3.eth.getAccounts();
            foodGrainContract = new web3.eth.Contract(contractABI, contractAddress);
            console.log("Connected to Metamask with account:", accounts[0]);
        } catch (error) {
            console.error("User denied account access:", error);
        }
    } else {
        alert("Please install MetaMask.");
    }
}

async function submitForm() {
    if (!foodGrainContract) {
        alert("Please connect to MetaMask first.");
        return;
    }

    const productName = document.getElementById("productName").value.trim();
    const quantity = document.getElementById("quantity").value.trim();
    const date = document.getElementById("date").value.trim();

    if (!productName || !quantity || !date) {
        alert("Please fill all fields.");
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        await foodGrainContract.methods.addFoodGrain(productName, quantity, date).send({ from: accounts[0] });

        alert("Data added successfully to blockchain!");

        // Only submit to backend after successful blockchain transaction
        handleSubmitForm(productName, quantity, date);
    } catch (error) {
        console.error("Transaction failed:", error);
        alert("Transaction failed. Check console for details.");
    }
}

function handleSubmitForm(productName, quantity, date) {
    const formData = { productName, quantity, date };

    fetch("http://localhost:3000/add-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Generate barcode using JsBarcode
                JsBarcode("#barcode", data.batchNumber, {
                    format: "CODE128",
                    displayValue: true
                });
                alert("Data added successfully!");
            } else {
                alert("Error adding data to backend.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to submit data to backend.");
        });
}

// Connect to Metamask on page load
window.onload = connectMetamask;
