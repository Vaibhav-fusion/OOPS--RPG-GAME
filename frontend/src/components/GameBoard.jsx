import Tile from "./Tile.jsx";

const GameBoard = ({ game, flags, onTileClick, onFlagTile, loading }) => {
  if (!game || !game.revealedGrid) return null;

  const { revealedGrid, gridSize } = game;

  return (
    <div className="mb-8 flex justify-center">
      <div
        className="grid gap-2 rounded-2xl border border-indigo-300/30 bg-slate-950/70 p-4 shadow-2xl sm:p-5"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {revealedGrid.flat().map((tile, index) => {
          const x = Math.floor(index / gridSize);
          const y = index % gridSize;
          return (
            <Tile
              key={`${x}-${y}`}
              tile={tile}
              isFlagged={flags.has(`${x},${y}`)}
              onClick={() => onTileClick(x, y)}
              onContextMenu={(e) => onFlagTile(e, x, y)}
              disabled={loading}
            />
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
