// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FoodGrainStorage {
    struct FoodGrain {
        string productName;
        uint256 quantity;
        string date;
        string status;
    }

    address public owner;
    mapping(uint256 => FoodGrain) public foodGrains; // Stores food grains with batch numbers
    uint256 public nextBatchNumber = 1; // Start batch numbers from 1

    event FoodGrainAdded(uint256 batchNumber, string productName, uint256 quantity, string date);
    event StatusUpdated(uint256 batchNumber, string newStatus);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can update status.");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function addFoodGrain(string memory _productName, uint256 _quantity, string memory _date) public {
        foodGrains[nextBatchNumber] = FoodGrain(_productName, _quantity, _date, "Order Created");
        emit FoodGrainAdded(nextBatchNumber, _productName, _quantity, _date);
        nextBatchNumber++; // Increment batch number for the next entry
    }

    function updateStatus(uint256 batchNumber, string memory newStatus) public {
        // COMMENT OUT the require and the onlyOwner for the demo
        // require(bytes(foodGrains[batchNumber].productName).length > 0, "Batch not found"); 
        
        foodGrains[batchNumber].status = newStatus;
        emit StatusUpdated(batchNumber, newStatus);
    }

    function getFoodGrain(uint256 batchNumber) public view returns (string memory, uint256, string memory, string memory) {
        require(bytes(foodGrains[batchNumber].productName).length > 0, "Batch not found"); // Ensure batch exists
        FoodGrain memory fg = foodGrains[batchNumber];
        return (fg.productName, fg.quantity, fg.date, fg.status);
    }

    function getTotalFoodGrains() public view returns (uint256) {
        return nextBatchNumber - 1; // Total batches added
    }
}
