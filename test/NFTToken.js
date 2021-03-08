const { expect } = require("chai");

describe("Token contract", function() {
    let DMarketNFTSwap;
    let hardhatDMarketNFTSwap;
    let creator;
    let owner;
    let minter;
    let addr1;
    let addr2;
    let addrs;
    const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINT_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
    const tokenPrefix = "https://test.com/"

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function () {
        // Get the ContractFactory and Signers here.
        DMarketNFTSwap = await ethers.getContractFactory("DMarketNFTToken");
        [creator, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        hardhatDMarketNFTSwap = await DMarketNFTSwap.deploy(owner.address, tokenPrefix);
    });

    describe("Deployment", async function() {
        it("should assign the prefixURI ", async function() {
            const tokenID = 1;
            await hardhatDMarketNFTSwap.mintToken(addr1.address, tokenID);
            const fullURI = await hardhatDMarketNFTSwap.tokenURI(tokenID);
            expect(tokenPrefix+tokenID).equal(fullURI);
        });
        it("should set the owner", async function() {
            expect(owner.address).equal(await hardhatDMarketNFTSwap.owner());
        });
        it("should set the mint_role for creator address", async function() {
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, creator.address));
        });
        it("owner isn't minter", async function() {
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, owner.address));
        });
        it("name and symbol", async function () {
            expect("DMarket NFT Swap").equal(await hardhatDMarketNFTSwap.name());
            expect("DM NFT").equal(await hardhatDMarketNFTSwap.symbol());
        });
    });

    describe("Mint", async function () {
        it("creator mintToken to addr1", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 1);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(1));
        });
        it("minter mintToken to addr2", async function () {
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            await hardhatDMarketNFTSwap.connect(minter).mintToken(addr2.address, 2);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(2));
        });
        it("failed mintToken", async function () {
            let isFailed = false;
            try {
                await hardhatDMarketNFTSwap.connect(addr1).mintToken(addr2.address, 3);
            } catch (e) {
                isFailed = e.toString().includes("MinterAccess: Sender is not a minter")
            }
            expect(true).equal(isFailed)
        });
        it("already minted token", async function() {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            let alreadyMinted = false;
            try {
                await hardhatDMarketNFTSwap.mintToken(addr1.address, 10);
            } catch (e) {
                alreadyMinted = e.toString().includes("ERC721: token already minted");
            }
            expect(true).equal(alreadyMinted);
        });
        it("mintTokenBatch", async function () {
            await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(101));
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(102));
        });
        it("mintTokenBatch must be the same number of receivers/tokenIDs", async function () {
            let getError = false;
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address], [101, 102]);
            } catch (e) {
                getError = e.toString().includes("DMarketNFTToken: must be the same number of receivers/tokenIDs");
            }
            expect(true).equal(getError);
            getError = false;
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101]);
            } catch (e) {
                getError = e.toString().includes("DMarketNFTToken: must be the same number of receivers/tokenIDs");
            }
            expect(true).equal(getError);
        });
        it("mintTokenBatch token already minted", async function () {
            await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
            let getError = false;
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 102]);
            } catch (e) {
                getError = e.toString().includes("ERC721: token already minted");
            }
            expect(true).equal(getError);
            getError = false;
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [101, 103]);
            } catch (e) {
                getError = e.toString().includes("ERC721: token already minted");
            }
            expect(true).equal(getError);
            getError = false;
            try {
                await hardhatDMarketNFTSwap.mintTokenBatch([addr1.address, addr2.address], [201, 201]);
            } catch (e) {
                getError = e.toString().includes("ERC721: token already minted");
            }
            expect(true).equal(getError);
        });
    });
    describe("Roles", async function () {
        it("owner add Minter", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("revokeMinter role", async function (){
            await hardhatDMarketNFTSwap.addMinter(minter.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
            await hardhatDMarketNFTSwap.revokeMinter(minter.address)
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role", async function () {
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            await hardhatDMarketNFTSwap.connect(addr2).renounceMinter(addr2.address);
            expect(false).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, minter.address));
        });
        it("renounceMinter role by owner", async function () {
            await hardhatDMarketNFTSwap.addMinter(addr2.address);
            expect(true).equal(await hardhatDMarketNFTSwap.hasRole(MINT_ROLE, addr2.address));
            let getError = false;
            try {
                await hardhatDMarketNFTSwap.connect(owner).renounceMinter(addr2.address);
            } catch (e) {
                getError = e.toString().includes("AccessControl: can only renounce roles for self");
            }
            expect(true).equal(getError);
        });
    });

    describe("Transfers", async function (){
        it("transferFrom", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
            await hardhatDMarketNFTSwap.connect(addr1).transferFrom(addr1.address, addr2.address, 11);
            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("transferFrom nonexistent token", async function () {
            let getError = false
            try {
                await hardhatDMarketNFTSwap.connect(addr1).transferFrom(addr1.address, addr2.address, 11);
            } catch (e) {
                getError = e.toString().includes("ERC721: operator query for nonexistent token");
            }
            expect(true).equal(getError);
        });
        it("safeTransferFrom without bytes ", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11)
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));

            const contract = await hardhatDMarketNFTSwap.connect(addr1);
            await contract['safeTransferFrom(address,address,uint256)'](addr1.address, addr2.address, 11);

            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("safeTransferFrom without bytes nonexistent token", async function () {
            let getError = false
            try {
                const contract = await hardhatDMarketNFTSwap.connect(addr1);
                await contract['safeTransferFrom(address,address,uint256)'](addr1.address, addr2.address, 11);
            } catch (e) {
                getError = e.toString().includes("ERC721: operator query for nonexistent token");
            }
            expect(true).equal(getError);
        });
        it("safeTransferFrom with bytes", async function () {
            await hardhatDMarketNFTSwap.mintToken(addr1.address, 11);
            expect(addr1.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));

            const contract = await hardhatDMarketNFTSwap.connect(addr1);
            await contract['safeTransferFrom(address,address,uint256,bytes)'](addr1.address, addr2.address, 11, [0, 1]);

            expect(addr2.address).equal(await hardhatDMarketNFTSwap.ownerOf(11));
        });
        it("safeTransferFrom with bytes nonexistent token", async function () {
            let getError = false
            try {
                const contract = await hardhatDMarketNFTSwap.connect(addr1);
                await contract['safeTransferFrom(address,address,uint256,bytes)'](addr1.address, addr2.address, 11, []);
            } catch (e) {
                getError = e.toString().includes("ERC721: operator query for nonexistent token");
            }
            expect(true).equal(getError);
        });
    });
});
