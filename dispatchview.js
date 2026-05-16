// Fetch and display warehouse items
function fetchWarehouseItems() {
    fetch("http://localhost:3000/dispatchview-items")
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
            <td>${item.driver_name}</td>
            <td>${item.vehicle_number}</td>
        `;
        itemList.appendChild(row);
    });
}

fetchWarehouseItems();