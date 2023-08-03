const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.parseEther("1");
          beforeEach(async function () {
              //deploy our fundMe contract
              //using Hardhat-deploy
              // const accounts = await ethers.getSigner();
              // const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, await mockV3Aggregator.getAddress());
              });
          });

          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });
              it("Update the amount funded date structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunders(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });

              it("Allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );

                  // Make sure the funders are rest properly
                  await expect(fundMe.getFunders(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              await accounts[i].getAddress()
                          ),
                          0
                      );
                  }
              });
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });

              it("Cheaper Withdraw Allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      );
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );

                  // Make sure the funders are rest properly
                  await expect(fundMe.getFunders(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              await accounts[i].getAddress()
                          ),
                          0
                      );
                  }
              });
          });
      });
