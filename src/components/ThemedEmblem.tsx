import emblemAsset from "@/assets/sudoku-drop-emblem.png.asset.json";

export function ThemedEmblem({ theme: _theme }: { theme: string }) {
  return (
    <img
      src={emblemAsset.url}
      alt="Emblema rotundă Sudoku Drop cu piese numerotate care cad"
      className="h-full w-full object-contain drop-shadow-xl"
    />
  );
}