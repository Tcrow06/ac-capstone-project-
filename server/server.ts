import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { updateMerkleTree } from './scripts/updateMerkleTree';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const whitelistPath = path.join(__dirname, './whitelist.json');

// Thêm địa chỉ vào whitelist
app.post('/api/whitelist/add', (req, res) => {

     console.log(`Adding address`);
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing address' });

    const whitelist = new Set(JSON.parse(fs.readFileSync(whitelistPath, 'utf-8')));
    whitelist.add(address.toLowerCase());
    fs.writeFileSync(whitelistPath, JSON.stringify(Array.from(whitelist), null, 2));

  const result = updateMerkleTree();
  res.json({ merkleRoot: result.merkleRoot });
});
// Xóa địa chỉ vào whitelist
app.post('/api/whitelist/remove', (req, res) => {

     console.log(`Deleting address`);
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing address' });

    const whitelist = new Set(JSON.parse(fs.readFileSync(whitelistPath, 'utf-8')));
    whitelist.delete(address.toLowerCase());
    fs.writeFileSync(whitelistPath, JSON.stringify(Array.from(whitelist), null, 2));

  const result = updateMerkleTree();
  res.json({ merkleRoot: result.merkleRoot });
});

// Lấy merkleRoot
app.get('/api/merkleRoot', (req, res) => {
  const data = fs.readFileSync(path.join(__dirname, './merkleRoot.json'), 'utf-8');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Lấy proof cho địa chỉ
app.get('/api/proof/:address', (req, res) => {

 console.log(`Getting proof`);
  const proofs = JSON.parse(fs.readFileSync(path.join(__dirname, './proofs.json'), 'utf-8'));
  const addr = req.params.address.toLowerCase();
  const proof = proofs[addr];
  if (!proof) return res.status(404).json({ error: 'Address not in whitelist' });
  res.json({ proof });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
