const FoodGrainStorage = artifacts.require("FoodGrainStorage");

module.exports = function (deployer) {
  deployer.deploy(FoodGrainStorage);
};
