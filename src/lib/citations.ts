/** Separates the answer from the model's suggested follow-up questions. */
export const FOLLOWUP_MARKER = "%%FOLLOWUPS%%";

/**
 * Split the model output into the answer and its follow-up questions.
 * While streaming, hide a half-written marker so it never flashes on screen.
 */
export function splitAnswer(text: string): { answer: string; followUps: string[] } {
  const index = text.indexOf(FOLLOWUP_MARKER);
  if (index === -1) {
    // Hide a partial marker ("%%FOLL") at the end, but keep a real "5%"
    return { answer: text.replace(/\n?(?:%%[A-Z]*%?|%[A-Z]{1,12}%?)$/, ""), followUps: [] };
  }
  const followUps = text
    .slice(index + FOLLOWUP_MARKER.length)
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim())
    .filter((line) => line.length > 3)
    .slice(0, 3);
  // Drop a leftover formatting-only line, e.g. "**" when the model bolded the marker
  const answer = text.slice(0, index).replace(/\n\s*[*_#>-]*\s*$/, "").trimEnd();
  return { answer, followUps };
}

// Leading spaces are captured so the chip can sit directly after the word it supports
const CITATION = /[ \t]*\[(?:Sources?\s*)?(\d{1,2}(?:\s*(?:,|–|-)\s*\d{1,2})*)\](?!\()/gi;

function expand(list: string): number[] {
  const out: number[] = [];
  for (const part of list.split(",")) {
    const [a, b] = part.split(/[–-]/).map((n) => parseInt(n.trim(), 10));
    if (Number.isNaN(a)) continue;
    if (!Number.isNaN(b) && b >= a && b - a < 10) {
      for (let n = a; n <= b; n++) out.push(n);
    } else {
      out.push(a);
    }
  }
  return out;
}

/**
 * Turn [1], [2, 3] and [Source 4] into links the renderer shows as citation chips.
 * Code blocks and inline code are left untouched.
 */
export function linkCitations(markdown: string, sourceCount: number): string {
  return markdown
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
    .map((segment, i) => {
      if (i % 2 === 1) return segment; // code
      return segment.replace(CITATION, (match, list: string) => {
        const nums = expand(list).filter((n) => n >= 1 && n <= sourceCount);
        if (nums.length === 0) return match;
        return nums.map((n) => `[${n}](#cite-${n})`).join("");
      });
    })
    .join("");
}
