const express = require("express");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "chaincraft-dev-secret";

/**
 * POST /api/auth/nonce
 * Get a sign challenge nonce for a wallet address
 */
router.post("/nonce", (req, res) => {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
        return res.status(400).json({ error: "Valid Ethereum address required" });
    }

    const nonce = `ChainCraft Login\nAddress: ${address}\nNonce: ${Date.now()}\nSigned at: ${new Date().toISOString()}`;
    res.json({ nonce });
});

/**
 * POST /api/auth/verify
 * Verify a signed message and issue a JWT
 */
router.post("/verify", (req, res) => {
    try {
        const { address, signature, nonce } = req.body;

        if (!address || !signature || !nonce) {
            return res.status(400).json({ error: "address, signature, and nonce required" });
        }

        // Recover signer from signature
        const recovered = ethers.verifyMessage(nonce, signature);

        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: "Signature verification failed" });
        }

        // Issue JWT
        const token = jwt.sign(
            { address, iat: Date.now() },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            address,
            expiresIn: "7d",
        });
    } catch (err) {
        console.error("Auth verify error:", err);
        res.status(401).json({ error: "Authentication failed" });
    }
});

module.exports = router;
