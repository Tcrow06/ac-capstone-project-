
let provider, signer, contract;

const walletDisplay = document.getElementById("walletAddress");

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, duration);
}

document.getElementById("connectBtn").onclick = async () => {
  if (typeof window.ethereum !== "undefined") {
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    walletDisplay.textContent = "Wallet: " + address;

    contract = new ethers.Contract(contractAddress, contractABI, signer);
    localStorage.setItem("connectedWallet", address);
    showToast("✅ Connected!");
  } else {
    showToast("❌ MetaMask not installed", false);
  }
};

document.getElementById("mintBtn").onclick = async () => {
  const amount = parseInt(document.getElementById("mintAmount").value);
  if (!amount) return;
  const userAddress = await signer.getAddress();
  try {
    // const res = await fetch(`http://localhost:3000/api/proof/${userAddress}`);
    const res = await fetch(`https://server-nft-myci.vercel.app/api/proof/${userAddress}`);
    const data = await res.json();
    const leafProof = data.proof;
    if (!leafProof) {
      showToast("❌ Your address is not whitelisted", false);
      return;
    }
    const price = await contract.price();
    const totalCost = price.mul(amount);

    const tx = await contract.mint(amount, leafProof, { value: totalCost });
    await tx.wait();
    showToast(`✅ Minted ${amount} NFTs`);
  } catch (err) {
    showToast("❌ " + getReadableError(err), false);
  }
};

document.getElementById("addWhitelistBtn").onclick = async (e) => {
  e.preventDefault();
  const address = document.getElementById("whitelistAddress").value;
  try {
    const res = await fetch('http://localhost:3000/api/whitelist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const tx = await contract.setMerkleRoot(data.merkleRoot);
    await tx.wait();
    showToast(`✅Đã thêm ${address} và cập nhật Merkle Root`);
  } catch (err) {
    showToast("❌ " + err.message);
  }
};
document.getElementById("removeWhitelistBtn").onclick = async () => {
  const address = document.getElementById("whitelistAddress").value;
  try {
    const res = await fetch('http://localhost:3000/api/whitelist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Gọi contract để set merkle root
    const tx = await contract.setMerkleRoot(data.merkleRoot);
    await tx.wait();
    showToast(`✅Đã thêm ${address} và cập nhật Merkle Root`);
  } catch (err) {
    showToast("❌ " + err.message);
  }
};

document.getElementById("setPriceBtn").onclick = async () => {
  const eth = parseFloat(document.getElementById("priceInput").value);
  if (!eth) return;
  try {
    const wei = ethers.utils.parseEther(eth.toFixed(18).toString());
    const tx = await contract.setterPrice(wei);
    await tx.wait();
    showToast(`✅ Set price to ${eth} ETH`);
  } catch (err) {
    showToast("❌ " + getReadableError(err), false);
  }
};

document.getElementById("setMaxBtn").onclick = async () => {
  const max = parseInt(document.getElementById("maxPerWalletInput").value);
  try {
    const tx = await contract.setterMaxPerWallet(max);
    await tx.wait();
    showToast(`✅ Set max per wallet to ${max}`);
  } catch (err) {
    showToast("❌ " + getReadableError(err), false);
  }
};

document.getElementById("withdrawBtn").onclick = async () => {
  try {
    const tx = await contract.withdraw();
    await tx.wait();
    showToast("✅ Withdraw successful!");
  } catch (err) {
    showToast("❌ " + getReadableError(err), false);
  }
};

document.getElementById("loadMintedBtn").onclick = async () => {
  const listDiv = document.getElementById("mintedList");
  listDiv.innerHTML = "⏳ Loading...";

  try {
    const [_, ids, owners, uris] = await contract.getAllMintedTokens();
    listDiv.innerHTML = "";

    if (ids.length === 0) {
      listDiv.innerHTML = "⚠️ No NFTs minted yet.";
      return;
    }

    for (let i = 0; i < ids.length; i++) {
      const tokenId = ids[i];
      const owner = owners[i];
      const uri = uris[i];

      // Fetch metadata from URI
      let meta;
      try {
        const res = await fetch(uri);
        meta = await res.json();
      } catch (e) {
        console.warn("❌ Cannot load metadata:", uri);
        continue;
      }

      const shortOwner =
        owner.slice(0, 4) + "..." + owner.slice(-2);

      const card = document.createElement("div");
      card.className = "nft-card";
      card.innerHTML = `
        <img src="${meta.image}" alt="NFT Image" class="nft-img"/>
        <div class="nft-info">
          <h4>#${tokenId} - ${meta.name}</h4>
          <p class="nft-desc">${meta.description}</p>
          <small><strong>Owner:</strong> ${shortOwner}</small>
          <p>
              <a href="https://sepolia.etherscan.io/token/${contractAddress}?a=${ids[i]}" 
                target="_blank" 
                class="tx-link">View on Etherscan</a>
          </p>
        </div>
      `;

      listDiv.appendChild(card);
    }
  } catch (err) {
    listDiv.innerHTML = "❌ Failed to load tokens: " + getReadableError(err);
  }
};


function getReadableError(err) {
  if (err?.error?.message) return err.error.message;
  if (err?.data?.message) return err.data.message;
  return err.message || "Unknown error";
}

window.addEventListener("load", async () => {
  const savedAddress = localStorage.getItem("connectedWallet");
  if (savedAddress && typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      const address = await signer.getAddress();

      if (address.toLowerCase() === savedAddress.toLowerCase()) {
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        walletDisplay.textContent = "Wallet: " + address;
        // showToast("✅ Auto-connected to wallet");
      }
    } catch (e) {
      localStorage.removeItem("connectedWallet"); // nếu thất bại thì xóa cache
    }
  }
});