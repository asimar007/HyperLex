import type { StreamEvent } from "@/types";

/** Read newline-delimited JSON events, handling lines split across chunks. */
export async function* readEvents(res: Response): AsyncGenerator<StreamEvent> {
  if (!res.body) return;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    const parts = (buffer + (value ?? "")).split("\n");
    buffer = done ? "" : parts.pop()!;
    for (const line of parts) {
      let event: StreamEvent;
      try {
        event = JSON.parse(line);
      } catch {
        continue; // blank or malformed line
      }
      yield event;
    }
    if (done) return;
  }
}
