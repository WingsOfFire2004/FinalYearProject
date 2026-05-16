async function handleFetchBatch() {
    const batchInput = document.getElementById("batchInput");
    const batchNumber = batchInput.value.trim();

    if (!batchNumber) {
        alert("Please enter a valid batch number");
        return;
    }

    const batchDetails = document.getElementById("batchDetails");
    // Show a loading message
    batchDetails.innerHTML = `<p style="text-align:center; color:#004080; padding:20px;">🔍 Querying Ledger for Batch ${batchNumber}...</p>`;

    try {
        // API 1: Fetch Product Info (Name, Qty, Date) from /product-details/
        const productResponse = await fetch(`http://localhost:3000/product-details/${batchNumber}`);
        const productData = await productResponse.json();

        // API 2: Fetch History (Timeline) from /batch-history/
        const historyResponse = await fetch(`http://localhost:3000/batch-history/${batchNumber}`);
        const historyData = await historyResponse.json();

        if (productData.success && historyData.success) {
            renderDashboard(batchNumber, productData.product, historyData.history);
        } else {
            batchDetails.innerHTML = `<p style="text-align:center; color:red; padding:20px;">❌ Batch not found in records.</p>`;
        }
    } catch (error) {
        console.error("Error connecting to backend:", error);
        batchDetails.innerHTML = `<p style="text-align:center; color:red; padding:20px;">⚠️ Connection Refused. Ensure backend is running on port 3000.</p>`;
    }
}

function renderDashboard(batchNumber, product, history) {
    const container = document.getElementById("batchDetails");
    container.innerHTML = ""; // Clear loader

    // 1. Top Grain Information Card
    const card = document.createElement("div");
    card.className = "product-summary-card";
    card.innerHTML = `
        <div class="summary-header">
            <h3><i class="fas fa-seedling"></i> Grain Information</h3>
            <span class="batch-badge">ID: ${batchNumber}</span>
        </div>
        <div class="summary-grid">
            <div class="info-item"><strong>Product:</strong> ${product.product_name}</div>
            <div class="info-item"><strong>Quantity:</strong> ${product.quantity} KG</div>
            <div class="info-item"><strong>Arrival Date:</strong> ${new Date(product.date).toLocaleDateString()}</div>
            <div class="info-item"><strong>Current Status:</strong> <span class="status-text">${product.status}</span></div>
        </div>
    `;
    container.appendChild(card);

    // 2. Supply Chain Timeline
    const timeline = document.createElement("div");
    timeline.classList.add("timeline");

    history.forEach((log, index) => {
        const isLatest = index === history.length - 1;
        const item = document.createElement("div");
        item.classList.add("timeline-item");
        if (isLatest) item.classList.add("active");

        item.innerHTML = `
            <div class="timeline-icon">
                <i class="fas ${getIcon(log.stage)}"></i>
            </div>
            <div class="timeline-content">
                <h4>${log.stage}</h4>
                <p class="timestamp"><i class="far fa-clock"></i> ${new Date(log.timestamp).toLocaleString()}</p>
            </div>
        `;
        timeline.appendChild(item);
    });

    container.appendChild(timeline);
}

function getIcon(stage) {
    const s = stage.toLowerCase();
    if (s.includes("order")) return "fa-file-invoice";
    if (s.includes("pack")) return "fa-box";
    if (s.includes("transit") || s.includes("dispatch")) return "fa-truck";
    if (s.includes("hub")) return "fa-warehouse";
    if (s.includes("delivery")) return "fa-shipping-fast";
    if (s.includes("delivered")) return "fa-check-double";
    return "fa-map-marker-alt";
}