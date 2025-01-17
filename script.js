function submitForm() {
    const formData = {
        productName: document.getElementById("productName").value,
        quantity: document.getElementById("quantity").value,
        date: document.getElementById("date").value,
    };

    fetch("http://localhost:3000/add-food", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Generate the barcode using JsBarcode
                JsBarcode("#barcode", data.batchNumber, {
                    format: "CODE128",
                    displayValue: true
                });
                alert("Data added successfully!");
            } else {
                alert("Error adding data");
            }
        })
        .catch(error => console.error("Error:", error));
}
