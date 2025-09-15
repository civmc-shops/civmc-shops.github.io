import './App.css';
import shops from './shops';
import { useState, useEffect, useRef } from 'react';
import StarRating from './StarRating';
import ShopkeeperLoginModal from './ShopkeeperLoginModal';
import ShopkeeperPanel from './ShopkeeperPanel';

// DEMO storage key for editable shop data
const SHOP_DATA_STORAGE_KEY = "SHOP_DATA_V1";

// --- Helper functions ---
function normalizeName(str) {
  return str.trim().toLowerCase();
}
function calculateDistance(x1, z1, x2, z2) {
  if (isNaN(x1) || isNaN(z1) || isNaN(x2) || isNaN(z2)) return null;
  return Math.round(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(z1 - z2, 2)));
}
function isValidCoord(val) {
  return val !== "" && !isNaN(Number(val));
}
function formatCoords(coords) {
  return `(${coords.x}, ${coords.y}, ${coords.z})`;
}

// --- Constants for item disambiguation menu ---
const DISAMBIG_ITEM_MARGIN = 7;
const MAX_VISIBLE_DISAMBIG = 4;
const DISAMBIG_BTN_WIDTH = "92%";
const MIN_BOX_WIDTH = 200;

function App() {
  // Main public UI state
  const [search, setSearch] = useState('');
  const [selectedItemName, setSelectedItemName] = useState(null);
  const [openShopIndices, setOpenShopIndices] = useState([]);
  const [userCoords, setUserCoords] = useState({ x: "", z: "" });
  const [maxDistance, setMaxDistance] = useState('');
  const [minRating, setMinRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [bestDealMode, setBestDealMode] = useState('best');

  // Shopkeeper edit UI state
  const [showLogin, setShowLogin] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [editingKey, setEditingKey] = useState("");
  const [shopData, setShopData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SHOP_DATA_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const disambigScrollRef = useRef(null);

  const filterMenuWidth = 200;
  const leftEdgeMargin = "18px";
  const filterButtonOffsetFromTop = "62px";
  const filterMenuOffsetFromButton = "4px";

  // --- Data prep ---
  // Use new shopData if it exists, else default shops
  const effectiveShops = shops.map(shop =>
    shopData[shop.name]
      ? { ...shop, ...shopData[shop.name] }
      : shop
  );

  const allItemNames = Array.from(
    new Set(
      effectiveShops.flatMap(shop => shop.items.map(item => item.name))
    )
  );

  const searchTerm = search.trim();
  const normalizedSearch = normalizeName(searchTerm);

  let matchingItemNames = [];
  if (searchTerm) {
    matchingItemNames = allItemNames.filter(
      name => normalizeName(name).includes(normalizedSearch)
    );
  }

  const activeItemName = selectedItemName
    ? selectedItemName
    : (matchingItemNames.length === 1 && searchTerm)
      ? matchingItemNames[0]
      : null;

  // --- Best deals ---
  const userX = isValidCoord(userCoords.x) ? Number(userCoords.x) : null;
  const userZ = isValidCoord(userCoords.z) ? Number(userCoords.z) : null;

  let itemOffers = [];
  if (activeItemName) {
    const normalizedActive = normalizeName(activeItemName);
    for (const shop of effectiveShops) {
      for (const item of shop.items) {
        if (normalizeName(item.name) === normalizedActive) {
          const quantity = item.quantity || 1;
          const unitPrice = item.price / quantity;
          let distance = null;
          if (
            shop.coordinates &&
            typeof shop.coordinates.x === "number" &&
            typeof shop.coordinates.z === "number" &&
            userX !== null &&
            userZ !== null
          ) {
            distance = calculateDistance(userX, userZ, shop.coordinates.x, shop.coordinates.z);
          }
          itemOffers.push({
            shop,
            item,
            quantity,
            unitPrice,
            distance,
          });
        }
      }
    }
    itemOffers = itemOffers.filter(({ shop, distance }) => {
      let valid = true;
      if (minRating !== "" && shop.rating < Number(minRating)) valid = false;
      if (maxDistance !== "" && userX !== null && userZ !== null) {
        if (distance !== null && distance > Number(maxDistance)) valid = false;
      }
      return valid;
    });
    if (bestDealMode === 'best') {
      itemOffers.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (bestDealMode === 'closest') {
      itemOffers.sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return a.unitPrice - b.unitPrice;
      });
    }
    itemOffers = itemOffers.slice(0, 5);
  }

  // --- Shop list ---
  let shopsToDisplay;
  if (activeItemName) {
    const normalizedActive = normalizeName(activeItemName);
    shopsToDisplay = effectiveShops.filter(shop =>
      shop.items.some(item => normalizeName(item.name) === normalizedActive)
    );
    shopsToDisplay = shopsToDisplay.filter(shop => {
      if (
        minRating !== "" &&
        shop.rating < Number(minRating)
      ) return false;
      if (
        maxDistance !== "" &&
        userX !== null && userZ !== null &&
        shop.coordinates &&
        typeof shop.coordinates.x === "number" &&
        typeof shop.coordinates.z === "number"
      ) {
        const distance = calculateDistance(userX, userZ, shop.coordinates.x, shop.coordinates.z);
        if (distance > Number(maxDistance)) return false;
      }
      return true;
    });
  } else {
    shopsToDisplay = effectiveShops.filter(shop =>
      !searchTerm ||
      shop.items.some(item =>
        normalizeName(item.name).includes(normalizedSearch)
      )
    );
    shopsToDisplay = shopsToDisplay.filter(shop => {
      if (
        minRating !== "" &&
        shop.rating < Number(minRating)
      ) return false;
      if (
        maxDistance !== "" &&
        userX !== null && userZ !== null &&
        shop.coordinates &&
        typeof shop.coordinates.x === "number" &&
        typeof shop.coordinates.z === "number"
      ) {
        const distance = calculateDistance(userX, userZ, shop.coordinates.x, shop.coordinates.z);
        if (distance > Number(maxDistance)) return false;
      }
      return true;
    });
  }

  let sortedShopsToDisplay = shopsToDisplay.map(shop => {
    const shopCoords = shop.coordinates;
    let distance = null;
    if (
      shopCoords &&
      typeof shopCoords.x === "number" &&
      typeof shopCoords.z === "number" &&
      userX !== null &&
      userZ !== null
    ) {
      distance = calculateDistance(userX, userZ, shopCoords.x, shopCoords.z);
    }
    return { shop, distance };
  });

  if (userX !== null && userZ !== null) {
    sortedShopsToDisplay = sortedShopsToDisplay
      .sort((a, b) => {
        if (a.distance === null && b.distance !== null) return 1;
        if (a.distance !== null && b.distance === null) return -1;
        if (a.distance === null && b.distance === null) return 0;
        return a.distance - b.distance;
      });
  }

  const noValidShopsForItem =
    !!activeItemName &&
    sortedShopsToDisplay.length === 0;

  // --- Disambiguation menu ---
  let disambiguationUI = null;
  if (searchTerm && matchingItemNames.length > 1 && !selectedItemName) {
    const numItems = matchingItemNames.length;
    const visibleItems = Math.min(numItems, MAX_VISIBLE_DISAMBIG);

    function getLineCount(str) {
      const charsPerLine = 30;
      return Math.max(1, Math.ceil(str.length / charsPerLine));
    }
    const lineCounts = matchingItemNames.map(getLineCount);
    const maxLineCount = Math.max(...lineCounts, 1);

    const baseBtnHeight = 36;
    const extraLineHeight = 18;
    const buttonHeight = baseBtnHeight + (maxLineCount - 1) * extraLineHeight;

    const buttonBlockHeight =
      buttonHeight * visibleItems +
      DISAMBIG_ITEM_MARGIN * (visibleItems - 1);

    const isScroll = numItems > MAX_VISIBLE_DISAMBIG;
    const scrollHeight =
      buttonHeight * MAX_VISIBLE_DISAMBIG +
      DISAMBIG_ITEM_MARGIN * (MAX_VISIBLE_DISAMBIG - 1) +
      20;

    const boxHeight = isScroll ? scrollHeight : buttonBlockHeight;

    disambiguationUI = (
      <div style={{
        background: "#242733",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "1em",
        margin: "1em auto",
        maxWidth: 350,
        color: "#fff",
        minWidth: MIN_BOX_WIDTH
      }}>
        <div style={{ fontWeight: 500, marginBottom: "0.6em", fontSize: "0.99em" }}>
          Multiple items match “{searchTerm}”. Which did you mean?
        </div>
        <div
          ref={disambigScrollRef}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: `${boxHeight}px`,
            minHeight: `${boxHeight}px`,
            maxHeight: isScroll ? `${scrollHeight}px` : `${boxHeight}px`,
            overflowY: isScroll ? "auto" : "hidden",
            padding: isScroll ? "10px 0" : 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: isScroll ? "flex-start" : "center"
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: isScroll ? "flex-start" : "center",
              height: isScroll ? "auto" : buttonBlockHeight,
            }}
          >
            {matchingItemNames.map((name, idx) => (
              <button
                key={name}
                style={{
                  background: "#2a2e38",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  padding: "0.35em 0.6em",
                  cursor: "pointer",
                  width: DISAMBIG_BTN_WIDTH,
                  textAlign: "left",
                  fontSize: "0.97em",
                  minHeight: `${buttonHeight}px`,
                  maxHeight: `${buttonHeight}px`,
                  lineHeight: "1.22",
                  boxSizing: "border-box",
                  marginBottom: idx !== matchingItemNames.length - 1 ? `${DISAMBIG_ITEM_MARGIN}px` : "0",
                  alignSelf: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflow: "hidden"
                }}
                onClick={() => setSelectedItemName(name)}
              >
                <span style={{
                  width: "100%",
                  textAlign: "left",
                  margin: "0 auto",
                  display: "block"
                }}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setSelectedItemName(null);
  }, [search]);

  const handleToggle = idx => {
    setOpenShopIndices(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // --- Shopkeeper system logic ---
  const openLogin = () => setShowLogin(true);

  const handleLogin = (shopName, passKey) => {
    setEditingShop(shopName);
    setEditingKey(passKey);
    setShowLogin(false);
  };

  const handleSave = (newData) => {
    const newShopData = { ...shopData, [editingShop]: { ...shopData[editingShop], ...newData } };
    setShopData(newShopData);
    localStorage.setItem(SHOP_DATA_STORAGE_KEY, JSON.stringify(newShopData));
    setEditingShop(null);
    setEditingKey("");
  };

  const handleLogout = () => {
    setEditingShop(null);
    setEditingKey("");
  };

  // --- Best Deal Mode Switcher ---
  const bestDealSwitcher = (
    <div style={{ marginBottom: "1em", textAlign: "center" }}>
      <span style={{ fontWeight: 500, marginRight: "0.8em", fontSize: "0.96em" }}>Sort by: </span>
      <button
        onClick={() => setBestDealMode('best')}
        style={{
          background: bestDealMode === 'best' ? "#6fd0ff" : "#2a2e38",
          color: bestDealMode === 'best' ? "#222" : "#fff",
          border: "1px solid #444",
          borderRadius: "4px",
          marginRight: "0.5em",
          padding: "0.20em 0.85em",
          fontWeight: bestDealMode === 'best' ? 600 : 400,
          cursor: "pointer",
          fontSize: "0.92em"
        }}
        aria-pressed={bestDealMode === 'best'}
      >
        Best Price
      </button>
      <button
        onClick={() => setBestDealMode('closest')}
        style={{
          background: bestDealMode === 'closest' ? "#6fd0ff" : "#2a2e38",
          color: bestDealMode === 'closest' ? "#222" : "#fff",
          border: "1px solid #444",
          borderRadius: "4px",
          padding: "0.20em 0.85em",
          fontWeight: bestDealMode === 'closest' ? 600 : 400,
          cursor: "pointer",
          fontSize: "0.92em"
        }}
        aria-pressed={bestDealMode === 'closest'}
      >
        Closest Shop
      </button>
    </div>
  );

  // --- Shopkeeper edit panel routing ---
  if (editingShop) {
    return (
      <ShopkeeperPanel
        shopName={editingShop}
        shopData={shopData[editingShop] || {}}
        onSave={handleSave}
        onLogout={handleLogout}
      />
    );
  }

  // --- Main public UI ---
  return (
    <div
      className="App"
      style={{
        background: "#24272c",
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        overflowX: "hidden"
      }}
    >
      {/* Shopkeeper login button (static, 75% of previous size, much more margin top/right) */}
      <div
        style={{
          width: "100%",
          background: "#24272c",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          marginTop: 0,
          marginBottom: "1.2em",
          paddingTop: "2.5em",
          paddingRight: "72px", // even more space from right
          boxSizing: "border-box"
        }}
      >
        <button
          style={{
            background: "#6fd0ff",
            borderRadius: 8,
            padding: "0.5625em 1.35em",
            fontSize: "1.125em",
            fontWeight: 600,
            border: "1px solid #333",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            cursor: "pointer"
          }}
          onClick={openLogin}
        >
          Shopkeeper Login
        </button>
      </div>
      {/* Shopkeeper modal */}
      {showLogin && <ShopkeeperLoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      <header
        className="App-header"
        style={{
          alignItems: "stretch",
          background: "#24272c",
          boxShadow: "none",
          maxWidth: "100vw",
          overflowX: "hidden",
          margin: 0,
          padding: 0
        }}
      >
        <h1 style={{ marginTop: 0 }}>CivMC Shops Directory</h1>
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '2.6em'
        }}>
          <div style={{
            position: "absolute",
            left: leftEdgeMargin,
            top: filterButtonOffsetFromTop,
            minWidth: `${filterMenuWidth}px`,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start"
          }}>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                background: "#2a2e38",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "5px",
                padding: "0.22em 0",
                cursor: "pointer",
                fontSize: "0.99em",
                fontWeight: 500,
                letterSpacing: "0.04em",
                transition: "background 0.15s, box-shadow 0.15s",
                boxShadow: showFilters ? "0 2px 8px rgba(0,0,0,0.22)" : "none",
                width: `${filterMenuWidth}px`,
                boxSizing: "border-box",
                marginBottom: filterMenuOffsetFromButton
              }}
            >
              Filters {showFilters ? "▲" : "▼"}
            </button>
            {showFilters && (
              <div
                style={{
                  background: "#2a2e38",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "0.55em 0.6em 0.65em 0.6em",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  minWidth: `${filterMenuWidth}px`,
                  width: `${filterMenuWidth}px`,
                  boxSizing: "border-box"
                }}
              >
                <div style={{ marginBottom: "0.7em", fontSize: "0.89em", color: "#fff" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "0.17em" }}>
                    <span style={{ fontSize: "0.89em" }}>Max distance (blocks):</span>
                    <input
                      type="number"
                      min="0"
                      value={maxDistance}
                      onChange={e => setMaxDistance(e.target.value)}
                      placeholder="Any"
                      style={{
                        width: "100%",
                        fontSize: "0.89em",
                        padding: "0.21em 0.3em",
                        borderRadius: "4px",
                        border: "1px solid #444",
                        background: "#222",
                        color: "#fff",
                        boxSizing: "border-box"
                      }}
                    />
                  </label>
                </div>
                <div style={{ fontSize: "0.89em", color: "#fff" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "0.17em" }}>
                    <span style={{ fontSize: "0.89em" }}>Min rating:</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={minRating}
                      onChange={e => setMinRating(e.target.value)}
                      placeholder="Any"
                      style={{
                        width: "100%",
                        fontSize: "0.89em",
                        padding: "0.21em 0.3em",
                        borderRadius: "4px",
                        border: "1px solid #444",
                        background: "#222",
                        color: "#fff",
                        boxSizing: "border-box"
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%"
          }}>
            <div className="coords-input-row" style={{ marginBottom: "0" }}>
              <label>
                <span style={{ marginRight: "0.3em" }}>X:</span>
                <input
                  type="number"
                  value={userCoords.x}
                  onChange={e => setUserCoords({ ...userCoords, x: e.target.value.trim() })}
                  placeholder="X"
                />
              </label>
              <label>
                <span style={{ marginRight: "0.3em" }}>Z:</span>
                <input
                  type="number"
                  value={userCoords.z}
                  onChange={e => setUserCoords({ ...userCoords, z: e.target.value.trim() })}
                  placeholder="Z"
                />
              </label>
            </div>
            <div className="searchbar-container" style={{ marginBottom: "1.2em" }}>
              <input
                type="text"
                className="searchbar"
                placeholder="Search for an item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  minWidth: "200px"
                }}
              />
            </div>
          </div>
        </div>
        {disambiguationUI}
        {activeItemName && itemOffers.length > 0 && (
          <div style={{
            background: "#1d2636",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            padding: "1em",
            margin: "1.2em auto 1.2em auto",
            width: "62.5vw",
            minWidth: 420,
            maxWidth: "100vw",
            color: "#fff"
          }}>
            {bestDealSwitcher}
            <div style={{ fontWeight: 600, fontSize: "1.07em", marginBottom: "0.6em", textAlign: "center" }}>
              {bestDealMode === 'best' ? (
                <>Best deals for <span style={{ color: "#6fd0ff" }}>{activeItemName}</span>:</>
              ) : (
                <>Closest shops selling <span style={{ color: "#6fd0ff" }}>{activeItemName}</span>:</>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={{
                      textAlign: "center",
                      padding: "0.3em 0.75em 0.3em 0",
                      minWidth: 90
                    }}>Shop</th>
                    <th style={{ textAlign: "left", padding: "0.3em 0.5em" }}>Coords</th>
                    <th style={{ textAlign: "center", padding: "0.3em 0.5em", minWidth: 72 }}>Rating</th>
                    <th style={{ textAlign: "left", padding: "0.3em 0.5em" }}>Pack Size</th>
                    <th style={{ textAlign: "left", padding: "0.3em 0.5em" }}>Total Price (d)</th>
                    <th style={{ textAlign: "left", padding: "0.3em 0.5em" }}>Unit Price (d)</th>
                    <th style={{ textAlign: "left", padding: "0.3em 0.5em" }}>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {itemOffers.map(({ shop, item, quantity, unitPrice, distance }, i) => (
                    <tr key={i}
                      style={{
                        borderBottom: "1px solid #222"
                      }}>
                      <td style={{
                        padding: "0.3em 0.75em 0.3em 0",
                        textAlign: "center"
                      }}>{shop.name}</td>
                      <td style={{ padding: "0.3em 0.5em" }}>{formatCoords(shop.coordinates)}</td>
                      <td style={{ padding: "0.3em 0.5em", textAlign: "center" }}>
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: 42,
                          width: "100%"
                        }}>
                          <span style={{
                            display: "inline-block", width: "100%"
                          }}>
                            <StarRating rating={shop.rating} size={16} />
                          </span>
                          <span style={{
                            color: "#aaa",
                            fontSize: "0.97em",
                            marginTop: "2px",
                            width: "100%",
                            display: "block",
                            textAlign: "center"
                          }}>{shop.rating}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.3em 0.5em" }}>{quantity}</td>
                      <td style={{ padding: "0.3em 0.5em" }}>{item.price}</td>
                      <td style={{ padding: "0.3em 0.5em" }}>{unitPrice.toFixed(3)}</td>
                      <td style={{ padding: "0.3em 0.5em" }}>
                        {distance !== null ? distance : <span style={{ color: "#888" }}>N/A</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {noValidShopsForItem && (
          <div style={{
            margin: "2em auto",
            background: "#2a2e38",
            color: "#fff",
            padding: "1em 1.5em",
            borderRadius: "8px",
            textAlign: "center",
            maxWidth: 400,
            fontSize: "1.08em"
          }}>
            No shops found selling <span style={{ color: "#6fd0ff" }}>{activeItemName}</span> that match your filters.
          </div>
        )}
        {!noValidShopsForItem && (
          <ul className="shop-list" style={{ listStyle: "none", padding: 0, width: "100%", margin: "0 auto" }}>
            {sortedShopsToDisplay.map(({ shop, distance }, idx) => (
              <li key={idx} style={{
                background: "#2a2e38",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                marginBottom: "1em",
                overflow: "hidden"
              }}>
                <div
                  style={{
                    cursor: "pointer",
                    padding: "1em",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "1.1em"
                  }}
                  onClick={() => handleToggle(idx)}
                  aria-expanded={openShopIndices.includes(idx)}
                >
                  <span>
                    <strong>{shop.name}</strong>
                    {" | "}
                    <span>{formatCoords(shop.coordinates)}</span>
                    {distance !== null ? (
                      <span style={{ margin: "0 0.2em" }}>
                        {" | "}
                        <span style={{ color: "#6fd0ff" }}>({distance} blocks away)</span>
                        {" | "}
                      </span>
                    ) : (
                      " | "
                    )}
                    <StarRating rating={shop.rating} size={22} />
                    <span style={{ marginLeft: "0.4em", color: "#aaa" }}>{shop.rating}</span>
                  </span>
                  <span
                    style={{
                      fontSize: "1.2em",
                      transition: "transform 0.2s",
                      transform: openShopIndices.includes(idx) ? "rotate(90deg)" : "rotate(0deg)"
                    }}
                  >
                    ▶
                  </span>
                </div>
                {openShopIndices.includes(idx) && (
                  <div style={{
                    background: "#191c22",
                    padding: "0.65em 0 0.7em 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}>
                    <div style={{
                      display: "table",
                      width: "auto",
                      minWidth: 320,
                    }}>
                      {shop.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "table-row",
                            textAlign: "center"
                          }}
                        >
                          <div style={{
                            display: "table-cell",
                            padding: "0.25em 1.5em",
                            textAlign: "center",
                            borderBottom: i !== shop.items.length - 1 ? "1px solid #333" : "none"
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            display: "table-cell",
                            padding: "0.25em 1.5em",
                            textAlign: "center",
                            borderBottom: i !== shop.items.length - 1 ? "1px solid #333" : "none"
                          }}>
                            {/* Show nothing if measure is "none" or falsy */}
                            {item.measure && item.measure !== "none"
                              ? `${item.quantity} ${item.measure}`
                              : item.quantity}
                          </div>
                          <div style={{
                            display: "table-cell",
                            padding: "0.25em 1.5em",
                            textAlign: "center",
                            borderBottom: i !== shop.items.length - 1 ? "1px solid #333" : "none"
                          }}>
                            {item.price} d
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {sortedShopsToDisplay.length === 0 && !activeItemName && (
          <div style={{ marginTop: "2em" }}>No shops found for your filter/search.</div>
        )}
      </header>
    </div>
  );
}

export default App;