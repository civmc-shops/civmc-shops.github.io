import React, { useState } from "react";
import { PASSKEYS } from "./passkeys";

export default function ShopkeeperLoginModal({ onLogin, onClose }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (input.length !== 16) {
      setError("Passkey must be 16 characters.");
      return;
    }
    const shop = PASSKEYS[input];
    if (!shop) {
      setError("Invalid passkey.");
      return;
    }
    onLogin(shop, input);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#222", padding: 30, borderRadius: 12, minWidth: 350 }}>
        <h2>Shopkeeper Login</h2>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          placeholder="Enter 16 character passkey"
          style={{ width: "100%", padding: "0.7em", fontSize: "1.1em" }}
        />
        {error && <div style={{ color: "red", margin: "8px 0 0" }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: "#6fd0ff" }}>Login</button>
        </div>
      </div>
    </div>
  );
}