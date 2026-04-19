import { useState } from "react";

const Tile = ({ tile, isFlagged, onClick, onContextMenu, disabled }) => {
  const [animating, setAnimating] = useState(false);
  const safeTile = tile || { revealed: false, type: "empty", danger: 0 };
  const actionableRevealedType = ["enemy", "trap", "support", "mystery"].includes(
    safeTile.type,
  );
  const canInteractRevealed =
    safeTile.type === "boss" ||
    actionableRevealedType ||
    (safeTile.name === "blue orb" && !safeTile.extra?.used);
  const tileLocked = disabled || (safeTile.revealed && !canInteractRevealed);

  const handleClick = () => {
    if (tileLocked || isFlagged) return;
    setAnimating(true);
    onClick();
    setTimeout(() => setAnimating(false), 300);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (disabled || safeTile.revealed) return;
    if (onContextMenu) onContextMenu(e);
  };

  const getTileContent = () => {
    if (!safeTile.revealed) {
      return isFlagged ? "🚩" : "";
    }

    // Map tile names to emojis
    const emojiMap = {
      bat: "🦇",
      wolf: "🐺",
      skeleton: "💀",
      rat: "🐀",
      goblin: "👹",
      slime: "🟢",
      orge: "👺",
      bombslime: "🧨",
      "rat master": "🐭",
      "free elf": "🧝",
      "centre dragon": "🐲",
      bomb: "💣",
      trapchest: "🧰",
      heal: "❤️",
      chest: "🪙",
      "blue orb": "🔵",
      question: "❓",
      enemy: "👹",
      trap: "💥",
      support: "⭐",
    };

    if (emojiMap[safeTile.name]) return emojiMap[safeTile.name];
    if (emojiMap[safeTile.type]) return emojiMap[safeTile.type];

    if (safeTile.type === "empty") {
      return safeTile.danger > 0 ? safeTile.danger : "·";
    }

    return "❓";
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={tileLocked}
      className={`
        flex h-10 w-10 items-center justify-center rounded-md border text-lg font-bold
        shadow-lg transition-all duration-200 sm:h-12 sm:w-12 sm:text-xl md:h-14 md:w-14
        ${
          safeTile.revealed
            ? "border-amber-300 bg-gradient-to-br from-amber-100 to-orange-200 text-slate-800"
            : "border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100 hover:-translate-y-0.5 hover:border-indigo-300 hover:from-slate-600 hover:to-slate-800"
        }
        ${animating ? "animate-bounce" : ""}
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
      style={{
        boxShadow: safeTile.revealed
          ? "inset 0 2px 4px rgba(0,0,0,0.1)"
          : "0 4px 10px rgba(15, 23, 42, 0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      {getTileContent()}
    </button>
  );
};

export default Tile;
