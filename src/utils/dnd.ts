/** Liten hjälpare för HTML5 drag and drop. Vi använder en egen MIME-typ
 *  så att vi kan skilja paletten (ny pass) från flytt av befintligt pass. */

export const DND_MIME = 'application/x-schema-shift'

export type DragPayload =
  | { kind: 'template'; templateId: string }
  | { kind: 'move'; shiftId: string; templateId: string }

export function writeDragPayload(e: React.DragEvent, payload: DragPayload): void {
  const json = JSON.stringify(payload)
  e.dataTransfer.setData(DND_MIME, json)
  // Fallback så att webbläsaren tillåter släpp även om MIME-typen filtreras.
  e.dataTransfer.setData('text/plain', json)
  e.dataTransfer.effectAllowed = payload.kind === 'move' ? 'move' : 'copy'
}

export function readDragPayload(e: React.DragEvent): DragPayload | null {
  const raw = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    return JSON.parse(raw) as DragPayload
  } catch {
    return null
  }
}
