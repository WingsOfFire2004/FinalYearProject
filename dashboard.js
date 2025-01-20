// Function to handle fetching batch history based on user input
function handleFetchBatch() {
    const batchInput = document.getElementById("batchInput").value.trim();

    if (!batchInput) {
        alert("Please enter a valid batch number");
        return;
    }

    // Clear previous results
    const batchDetails = document.getElementById("batchDetails");
    batchDetails.innerHTML = "";

    // Fetch and display batch history
    fetchBatchHistory(batchInput);
}

// Fetch batch history and display it
function fetchBatchHistory(batchNumber) {
    fetch(`http://localhost:3000/batch-history/${batchNumber}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                displayBatchHistory(batchNumber, data.history);
            } else {
                alert(`Error fetching history for batch ${batchNumber}`);
            }
        })
        .catch((error) => console.error("Error fetching batch history:", error));
}

// Display batch history
function displayBatchHistory(batchNumber, history) {
    const batchDetails = document.getElementById("batchDetails");
    const batchItem = document.createElement("div");
    batchItem.classList.add("batch-item");

    // Create the batch title
    const batchTitle = document.createElement("h3");
    batchTitle.textContent = `Batch Number: ${batchNumber}`;
    batchItem.appendChild(batchTitle);

    // Create the status timeline
    const statusTimeline = document.createElement("div");
    statusTimeline.classList.add("status");

    history.forEach((stage, index) => {
        const statusDiv = document.createElement("div");
        const stageText = document.createElement("p");
        stageText.textContent = stage.stage;

        const timestampText = document.createElement("p");
        timestampText.textContent = stage.timestamp;
        timestampText.classList.add("timestamp");

        // Highlight the current stage
        if (index === history.length - 1) {
            stageText.classList.add("current-stage");
        }

        statusDiv.appendChild(stageText);
        statusDiv.appendChild(timestampText);
        statusTimeline.appendChild(statusDiv);
    });

    batchItem.appendChild(statusTimeline);
    batchDetails.appendChild(batchItem);
}
