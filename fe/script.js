let provider, signer, nftCollection, whitelistMinter;

const walletDisplay = document.getElementById("walletAddress");

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  if (toast._timeoutId) {
    clearTimeout(toast._timeoutId);
    toast._timeoutId = null;
  }

  if (duration !== false) {
    toast._timeoutId = setTimeout(() => {
      toast.style.display = "none";
    }, duration);
  }
}

function hideToast() {
  const toast = document.getElementById("toast");
  toast.style.display = "none";
  if (toast._timeoutId) {
    clearTimeout(toast._timeoutId);
    toast._timeoutId = null;
  }
}

document.getElementById("connectBtn").onclick = async () => {
  if (typeof window.ethereum === "undefined") {
    showToast("❌ MetaMask không được cài đặt", 3000);
    return;
  }
  showToast("⏳ Đang kết nối ví...", false);

  try {
    await ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    walletDisplay.textContent = "Wallet: " + showAddress(address);

    // contract = new ethers.Contract(contractAddress, contractABI, signer);

    whitelistMinter = new ethers.Contract(AddressWhitelist, ABIWhitelist, signer);
    nftCollection = new ethers.Contract(AddressNft, ABINft, signer);
    localStorage.setItem("connectedWallet", address);
    showToast("	✅ Đã kết nối thành công!");
  } catch (err) {
    console.error("❌ Kết nối ví thất bại:", err);
    hideToast();
    if (err.code === 4001) {
      showToast("❌ Bạn đã từ chối kết nối MetaMask", 3000);
    } else {
      showToast("❌ Lỗi kết nối ví: " + getReadableError(err), 3000);
    }
  }
};

document.getElementById("mintBtn").onclick = async () => {
  const amount = parseInt(document.getElementById("mintAmount").value);
  if (!amount) return;
  const userAddress = await signer.getAddress();

  try {
    showToast("⏳ Đang kiểm tra whitelist...", false);
    const res = await fetch(`http://localhost:3000/api/proof/${userAddress}`);
    if (!res.ok) {
      // Lỗi HTTP như 404, 500
      showToast("❌ Địa chỉ của bạn không nằm trong whitelist", 3000);
      return;
    }

    const data = await res.json();
    const leafProof = data.proof;
    if (!leafProof) {
      showToast("❌ Địa chỉ của bạn không nằm trong whitelist", 3000);
      return;
    }
    const price = await whitelistMinter.price();
    const totalCost = price.mul(amount);
    console.log("Calling mint with", amount, leafProof, price.toString());

    // const tx = await whitelistMinter.mint(amount, leafProof, { value: totalCost });
    // await tx.wait();
    try {
      showToast("⏳ Đang gửi giao dịch mint...", false);
      const tx = await whitelistMinter.mint(amount, leafProof, {
        value: totalCost
      });
      showToast("⏳ Giao dịch đang xử lý...",false);
      await tx.wait();
      showToast("✅ Đã mint thành công!");
    } catch (err) {
      console.error("❌ Giao dịch thất bại:", err);
      const readable = getReadableError(err);
      showToast("❌ " + readable, 3000);
    }

    // console.log("Tx created", tx);
    // await tx.wait();
    // showToast(`✅ Minted ${amount} NFTs`);
  } catch (err) {
    console.error("TX error", err);
    showToast("❌ " + getReadableError(err), 3000);
  }
};

document.getElementById("addWhitelistBtn").onclick = async () => {
  const address = document.getElementById("whitelistAddress").value;

  const currentAddress = await signer.getAddress();
  const ownerAddress = await whitelistMinter.owner();
  if (currentAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      showToast("❌ Bạn không phải là contract owner", 3000);
      return;
    }
  try {
    showToast("⏳ Đang lấy MerkleRoot mới...", false);
    const res = await fetch('http://localhost:3000/api/whitelist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`⏳ Đang thêm ${showAddress(address)} và cập nhật Merkle Root`, false);
    const tx = await whitelistMinter.setMerkleRoot(data.merkleRoot);
    await tx.wait();
    showToast(`✅Đã thêm ${showAddress(address)} và cập nhật Merkle Root`);
  } catch (err) {
    showToast("❌ " + err.message);
  }
};
document.getElementById("removeWhitelistBtn").onclick = async () => {

  const currentAddress = await signer.getAddress();
  const ownerAddress = await whitelistMinter.owner();
  if (currentAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      showToast("❌ Bạn không phải contract owner", 3000);
      return;
    }
  const address = document.getElementById("whitelistAddress").value;
  try {
    showToast("⏳ Đang lấy MerkleRoot mới...", false);
    const res = await fetch('http://localhost:3000/api/whitelist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Gọi contract để set merkle root
    showToast(`⏳ Đang xóa ${showAddress(address)} và cập nhật Merkle Root...`, false);
    const tx = await whitelistMinter.setMerkleRoot(data.merkleRoot);
    await tx.wait();
    showToast(`✅Đã xóa ${showAddress(address)} và cập nhật Merkle Root`);
  } catch (err) {
    showToast("❌ " + err.message);
  }
};

document.getElementById("setPriceBtn").onclick = async () => {
  const eth = parseFloat(document.getElementById("priceInput").value);
  if (!eth) return;
  try {
    const wei = ethers.utils.parseEther(eth.toFixed(18).toString());
    showToast(`⏳ Đang đổi giá ${eth} ETH`, false);
    const tx = await whitelistMinter.setPrice(wei);
    await tx.wait();
    showToast(`✅ Đã đổi giá thành công: ${eth} ETH`);
  } catch (err) {
    showToast("❌ " + getReadableError(err), 3000);
  }
};

document.getElementById("setMaxBtn").onclick = async () => {
  const max = parseInt(document.getElementById("maxPerWalletInput").value);
  try {
    showToast(`⏳ Đang đổi số token tối đa / ví...`, false);
    const tx = await whitelistMinter.setMaxPerWallet(max);
    await tx.wait();
    showToast(`✅ Đã đổi số lượng tối đa mỗi ví: ${max}`);
  } catch (err) {
    showToast("❌ " + getReadableError(err), 3000);
  }
};

document.getElementById("withdrawBtn").onclick = async () => {
  try {
    showToast(`⏳ Đang rút tiền về ví...`, false);
    const tx = await whitelistMinter.withdraw();
    await tx.wait();
    showToast("✅ Đã rút tiền thành công!");
  } catch (err) {
    showToast("❌ " + getReadableError(err), 3000);
  }
};

document.getElementById("loadMintedBtn").onclick = async () => {
  const listDiv = document.getElementById("mintedList");
  listDiv.innerHTML = "⏳ Loading...";

  try {
    const [_, ids, owners, uris] = await nftCollection.getAllMintedTokens();
    listDiv.innerHTML = "";

    if (ids.length === 0) {
      listDiv.innerHTML = "⚠️ Chưa có NFT nào được mint.";
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
              <a href="https://sepolia.etherscan.io/token/${AddressNft}?a=${ids[i]}" 
                target="_blank" 
                class="tx-link">View on Etherscan</a>
          </p>
        </div>
      `;

      listDiv.appendChild(card);
    }
  } catch (err) {
    listDiv.innerHTML = "❌ Tải danh sách NFT thất bại: " + getReadableError(err);
  }
};


function getReadableError(err) {
  console.log(err);
  const message = err?.error?.message || err?.message || "";;
  if (message.includes("user rejected")) return "Bạn đã từ chối giao dịch";
  if (err?.error?.message) return err.error.message;
  if (err?.message) return err.message;
  if (error?.revert?.message) return error.revert.message;
}

window.addEventListener("load", async () => {
  const savedAddress = localStorage.getItem("connectedWallet");
  if (savedAddress && typeof window.ethereum !== "undefined") {
    try {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      const address = await signer.getAddress();

      if (address.toLowerCase() === savedAddress.toLowerCase()) {
        // contract = new ethers.Contract(contractAddress, contractABI, signer);
        whitelistMinter = new ethers.Contract(AddressWhitelist, ABIWhitelist, signer);
        nftCollection = new ethers.Contract(AddressNft, ABINft, signer);
        walletDisplay.textContent = "Wallet: " +  showAddress(address);
        showToast("✅ Đã tự động kết nối ví", 2000);
      }
    } catch (e) {
      localStorage.removeItem("connectedWallet"); // nếu thất bại thì xóa cache
    }
  }
  if (typeof AddressWhitelist !== "undefined") {
    const etherscanLink = `https://sepolia.etherscan.io/address/${AddressWhitelist}`;
    document.getElementById("viewContractBtn").href = etherscanLink;
  }
});

function showAddress(add) {
  return add ? add.slice(0, 6) + "..." + add.slice(-4) : "";
}
