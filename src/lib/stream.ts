import type { StreamEvent } from "@/types";

/** Yield each non-empty line of a streamed body, handling lines split across chunks. */
export async function* lines(body: ReadableStream): AsyncGenerator<string> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;

    const parts = buffer.split("\n");
    buffer = parts.pop()!;
    for (const part of parts) {
      const line = part.trim();
      if (line) yield line;
    }
  }

  const last = buffer.trim();
  if (last) yield last;
}

/** Read newline-delimited JSON events. */
export async function* readEvents(res: Response): AsyncGenerator<StreamEvent> {
  if (!res.body) return;
  for await (const line of lines(res.body)) {
    let event: StreamEvent;
    try {
      event = JSON.parse(line) as StreamEvent;
    } catch {
      continue;
    }
    yield event;
  }
}
