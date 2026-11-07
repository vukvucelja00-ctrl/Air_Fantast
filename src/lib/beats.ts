/** Calls `onBeat` with 1, 2, 3… every `ms`, `beats` times. Returns a function that stops it. */
export function everyBeat(ms: number, beats: number, onBeat: (beat: number) => void): () => void {
  let beat = 0
  const id = window.setInterval(() => {
    beat += 1
    onBeat(beat)
    if (beat >= beats) window.clearInterval(id)
  }, ms)
  return () => window.clearInterval(id)
}
