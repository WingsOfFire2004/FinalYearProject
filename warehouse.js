
// Fetch and display all items in the warehouse
function fetchWarehouseItems() {
    fetch("http://localhost:3000/warehouse-items")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch warehouse items");
            }
            return response.json();
        })
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
    itemList.innerHTML = ""; // Clear existing rows

    items.forEach((item) => {
        console.log("Item batch number:", item.batch_number);
        const row = document.createElement("tr");

        // Display product details (without barcode)
        const productNameCell = document.createElement("td");
        productNameCell.textContent = item.product_name;

        const quantityCell = document.createElement("td");
        quantityCell.textContent = item.quantity;

        const batchNumberCell = document.createElement("td");
        batchNumberCell.textContent = item.batch_number;

        const statusCell = document.createElement("td");
        statusCell.textContent = item.status;
        
       // Create action button cell
       const actionButtonCell = document.createElement("td");
       const actionButton = document.createElement("button");
       actionButton.textContent = "Pack for Dispatch";

       // Add onclick handler for the button
       actionButton.onclick = () => packForDispatch(item.batch_number);

       // Append the button to the action cell
       actionButtonCell.appendChild(actionButton);

        // Append all cells to the row
        row.appendChild(productNameCell);
        row.appendChild(quantityCell);
        row.appendChild(batchNumberCell);
        row.appendChild(statusCell);
        row.appendChild(actionButtonCell);
        
        // Append the row to the table
        itemList.appendChild(row);
    });
}

// refresh the status of warehouse items table.
function packForDispatch(batchNumber) {
    console.log("Packing batch:", batchNumber);
    fetch("http://localhost:3000/pack-dispatch", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchNumber }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to update batch status");
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                alert(`Batch ${batchNumber} packed for dispatch successfully!`);
                fetchWarehouseItems(); // Refresh the warehouse items table
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            console.error("Error packing batch:", error);
            alert("Error packing batch");
        });
}





// Handle manual scanning and render barcode
function scanItem() {
    const batchNumber = document.getElementById("scanInput").value.trim();

    if (!batchNumber) {
        alert("Please enter a batch number");
        return;
    }

    // Fetch product details based on the scanned batch number
    fetch(`http://localhost:3000/product-details/${batchNumber}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Product not found");
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                // Display the scanned item details and generate the barcode
                displayScannedItem(data.product);
                
            } else {
                alert("Product not found");
            }
        })
        .catch((error) => {
            console.error("Error fetching product details:", error);
            alert("Error fetching product details");
        });
}

// Function to display the scanned product details
function displayScannedItem(product) {
    const productDetails = document.getElementById("scannedItemDetails");

    // Check if the element exists
    if (!productDetails) {
        console.error("scannedItemDetails element not found");
        return;
    }

    productDetails.innerHTML = `
        <p>Product Name: ${product.product_name}</p>
        <p>Quantity: ${product.quantity}</p>
        <p>Batch Number: ${product.batch_number}</p>
        <p>Date: ${product.date}</p>
        <h3><strong>Generated Barcode: </strong></h3>
    `;

    generateBarcode(product.batch_number); // Generate barcode here

}

// Function to generate and display barcode
function generateBarcode(batchNumber) {
        
    // Check if JsBarcode is properly applied to the SVG element
    try {
        JsBarcode("#barcode", batchNumber, {
            format: "CODE128",
            displayValue: true
        });

        
    const packButton = document.createElement("button");
    packButton.textContent = "Pack for Dispatch";
    
    // Add the onclick handler to call the packForDispatch function
    packButton.onclick = () => packForDispatch(batchNumber);
    
    const barcodeContainer = document.getElementById("barcodeContainer");
    // Append the button below the product details
    const breaking = document.createElement("br");
    barcodeContainer.appendChild(breaking);
    barcodeContainer.appendChild(packButton);

    } catch (error) {
        console.error("Barcode rendering error:", error);
    }

}


// Initialize the dashboard by fetching stored items
fetchWarehouseItems();
