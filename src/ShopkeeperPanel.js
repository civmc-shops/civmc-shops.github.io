import React, { useState, useRef, useEffect } from "react";
import { ALL_MINECRAFT_ITEMS } from "./minecraftItems";

const MEASURE_TYPES = [
  { value: "", label: "Select measure..." },
  { value: "none", label: "None" },
  { value: "ci", label: "ci" },
  { value: "cs", label: "cs" }
];

const mainButtonStyle = {
  background: "#6fd0ff",
  color: "#222",
  border: "1px solid #444",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "1em",
  padding: "0.5em 1.2em",
  transition: "background 0.15s, box-shadow 0.15s",
  boxShadow: "0 2px 8px rgba(0,0,0,0.10)"
};

export default function ShopkeeperPanel({ shopName, shopData, onSave, onLogout }) {
  const [items, setItems] = useState(shopData.items || []);
  const [newItem, setNewItem] = useState({ name: "", quantity: "", measure: "", price: "" });
  const [itemSearch, setItemSearch] = useState("");
  const [showItemList, setShowItemList] = useState(false);

  // For click-outside detection
  const itemSearchRef = useRef(null);
  const itemSearchMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target) &&
        itemSearchMenuRef.current &&
        !itemSearchMenuRef.current.contains(event.target)
      ) {
        setShowItemList(false);
      }
    }
    if (showItemList) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showItemList]);

  const filteredItems = itemSearch
    ? ALL_MINECRAFT_ITEMS.filter(i => i.toLowerCase().includes(itemSearch.toLowerCase()))
    : ALL_MINECRAFT_ITEMS;

  const addItem = () => {
    if (!newItem.name || !newItem.quantity || !newItem.price || !newItem.measure) return;
    setItems(items.concat([{ ...newItem, price: Number(newItem.price) }]));
    setNewItem({ name: "", quantity: "", measure: "", price: "" });
    setItemSearch("");
    setShowItemList(false);
  };

  const deleteItem = idx => setItems(items.filter((_, i) => i !== idx));
  const handleChange = (key, value) => setNewItem({ ...newItem, [key]: value });

  const mainContentWidth = "62.5vw";
  const maxWidth = 900;

  // Margin style for each field/button in the add-item row
  const fieldMargin32 = { marginRight: 32 };
  const fieldMargin16 = { marginRight: 16 };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#181c23",
      color: "#fff",
      padding: "2em 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        width: mainContentWidth,
        maxWidth,
        minWidth: 350,
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Editing: {shopName}</h2>
          <button onClick={onLogout} style={mainButtonStyle}>Logout</button>
        </div>
        {/* Centered Add Item Row */}
        <div style={{
          margin: "2em 0 1.5em 0",
          display: "flex",
          justifyContent: "center",
          width: "100%"
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}>
            {/* Searchable item select */}
            <div style={{ width: 210, position: "relative", flexShrink: 0, ...fieldMargin32 }}>
              <input
                ref={itemSearchRef}
                type="text"
                placeholder="Search for item..."
                value={itemSearch}
                onChange={e => {
                  setItemSearch(e.target.value);
                  setShowItemList(true);
                  handleChange("name", "");
                }}
                onFocus={() => setShowItemList(true)}
                style={{
                  width: "100%",
                  padding: "0.5em",
                  borderRadius: 5,
                  border: "1px solid #555",
                  fontSize: "1em"
                }}
                autoComplete="off"
              />
              {showItemList && (
                <ul
                  ref={itemSearchMenuRef}
                  style={{
                    position: "absolute",
                    zIndex: 10,
                    width: "100%",
                    background: "#222",
                    maxHeight: 180,
                    overflowY: "auto",
                    margin: 0,
                    padding: "0.3em 0",
                    border: "1px solid #444",
                    borderRadius: "0 0 6px 6px",
                    listStyle: "none"
                  }}
                >
                  {filteredItems.length === 0 && (
                    <li style={{ padding: "0.3em 1em", color: "#aaa" }}>No items found</li>
                  )}
                  {filteredItems.slice(0, 50).map(i => (
                    <li
                      key={i}
                      style={{
                        padding: "0.3em 1em",
                        cursor: "pointer",
                        background: newItem.name === i ? "#444" : "inherit"
                      }}
                      onMouseDown={() => {
                        handleChange("name", i);
                        setItemSearch(i);
                        setShowItemList(false);
                      }}
                    >
                      {i}
                    </li>
                  ))}
                  {filteredItems.length > 50 && (
                    <li style={{ padding: "0.3em 1em", color: "#aaa" }}>
                      (Showing first 50 results)
                    </li>
                  )}
                </ul>
              )}
            </div>
            {/* Quantity */}
            <div style={{ width: 110, ...fieldMargin32 }}>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={newItem.quantity}
                onChange={e => handleChange("quantity", e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5em",
                  borderRadius: 5,
                  border: "1px solid #555",
                  fontSize: "1em"
                }}
              />
            </div>
            {/* Measure */}
            <div style={{ width: 150, ...fieldMargin16 }}>
              <select
                value={newItem.measure}
                onChange={e => handleChange("measure", e.target.value)}
                style={{
                  borderRadius: 5,
                  border: "1px solid #555",
                  fontSize: "1em",
                  padding: "0.5em",
                  width: "100%",
                  background: "#191c22",
                  color: newItem.measure ? "#fff" : "#888"
                }}
              >
                {MEASURE_TYPES.map(t => (
                  <option key={t.value} value={t.value} disabled={t.value === ""}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Price */}
            <div style={{ width: 90, ...fieldMargin32 }}>
              <input
                type="number"
                min="0"
                placeholder="Price"
                value={newItem.price}
                onChange={e => handleChange("price", e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5em",
                  borderRadius: 5,
                  border: "1px solid #555",
                  fontSize: "1em"
                }}
              />
            </div>
            {/* Add Button */}
            <div>
              <button onClick={addItem} style={mainButtonStyle}>Add Item</button>
            </div>
          </div>
        </div>
        {/* Items Table */}
        <div style={{
          margin: "0 auto",
          width: "100%",
          background: "#222",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "0.8em 0.5em"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "1em",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: "center", padding: "0.3em 0.15em" }}>Item</th>
                <th style={{ textAlign: "center", padding: "0.3em 0.15em" }}>Quantity</th>
                <th style={{ textAlign: "center", padding: "0.3em 0.15em" }}>Measure</th>
                <th style={{ textAlign: "center", padding: "0.3em 0.15em" }}>Price (d)</th>
                <th style={{ textAlign: "center", padding: "0.3em 0.15em" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{
                    textAlign: "center",
                    padding: "0.3em 0.15em",
                    wordBreak: "break-word"
                  }}>{it.name}</td>
                  <td style={{ textAlign: "center", padding: "0.3em 0.15em" }}>{it.quantity}</td>
                  <td style={{ textAlign: "center", padding: "0.3em 0.15em" }}>{it.measure}</td>
                  <td style={{ textAlign: "center", padding: "0.3em 0.15em" }}>{Number(it.price).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                  <td style={{ textAlign: "center", padding: "0.3em 0.15em" }}>
                    <button
                      onClick={() => deleteItem(idx)}
                      style={{
                        ...mainButtonStyle,
                        background: "#e23c3c",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: "0.97em",
                        padding: "0.4em 1.1em"
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Update Shop Button */}
        <div style={{
          textAlign: "right",
          marginTop: 24,
          width: "100%",
        }}>
          <button
            style={{
              ...mainButtonStyle,
              fontSize: "1.08em",
              padding: "0.8em 1.8em"
            }}
            onClick={() => onSave({ items })}
          >Update Shop Catalogue</button>
        </div>
      </div>
    </div>
  );
}