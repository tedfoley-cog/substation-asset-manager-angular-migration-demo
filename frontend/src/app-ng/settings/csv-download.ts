// Browser download of an already-assembled CSV text (DES-SETCMP-010). Kept out of controllers/components so the
// UI layer carries no CSV assembly; the text itself comes from settings-compare.logic.ts#csvText.
export function downloadCsv(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
