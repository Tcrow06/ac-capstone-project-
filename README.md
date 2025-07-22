# 🎨 NFT Whitelist Sale DApp

Một DApp NFT whitelist mint đơn giản được xây dựng bằng Solidity và triển khai trên mạng Sepolia. Người dùng có thể mint NFT nếu nằm trong danh sách whitelist, với giới hạn số lượng mint mỗi ví. Admin có thể thêm/xóa whitelist, thay đổi giá mint và rút ETH từ hợp đồng.

---

## 🔗 Contract Verified on Sepolia

✅ [0x67426256B28c89349ab25e886876Fe5A24c21976](https://sepolia.etherscan.io/address/0x67426256B28c89349ab25e886876Fe5A24c21976#code)

---

## 🛠️ Công nghệ sử dụng

- Smart Contract: Solidity + OpenZeppelin (ERC721)
- Frontend: HTML, CSS, JavaScript (thuần)
- Blockchain: Ethereum Testnet Sepolia
- Metadata: MockAPI server (`baseURI` → JSON Metadata)

---

## ⚙️ Tính năng chính

### 👑 Admin (Owner)
- `addToWhitelist(address)`: Thêm người dùng vào whitelist.
- `deleteFromWhitelist(address)`: Xóa người dùng khỏi whitelist.
- `setterPrice(uint)`: Thay đổi giá mint.
- `setterMaxPerWallet(uint8)`: Cập nhật giới hạn số lượng mint mỗi ví.
- `withdraw()`: Rút toàn bộ ETH từ hợp đồng về ví owner.

### 🧑‍🎨 Người dùng (Whitelisted User)
- `mint(uint8 amount)`: Mint NFT (tối đa `MAX_PER_WALLET`, phải thanh toán `price * amount`)
- `getAllMintedTokens()`: Trả về danh sách tất cả tokenId, chủ sở hữu, và URI.

---

## 🖼️ Giao diện người dùng

Trang web được xây dựng đơn giản với:
- Kết nối ví
- Form mint NFT
- Danh sách NFT đã mint
- Giao diện quản trị (thêm whitelist, rút tiền, thay đổi thông số)

👉 **Hình ảnh minh họa**:  

![UI Screenshot](./image/image1.png)
![UI Screenshot](./image/image2.png)

---

## 📂 Metadata

Metadata cho mỗi NFT được lưu ở dạng JSON tại MockAPI (có thể thay bằng NFT.Storage hoặc IPFS thật). Ví dụ:

```json
{
  "name": "NFT 1",
  "description": "This is a whitelist-only NFT.",
  "image": "https://picsum.photos/id/1/300/300",
  "id": "1"
}
