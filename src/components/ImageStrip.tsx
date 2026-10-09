"use client";

import { useState } from "react";
import type { SearchImage } from "@/types";

export default function ImageStrip({ images }: { images: SearchImage[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const shown = images.filter((img) => !failed.includes(img.url));
  if (shown.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Related images">
      {shown.map((img) => (
        <a
          key={img.url}
          href={img.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-[4/3] overflow-hidden rounded-lg border border-rule bg-rule/40"
          title={img.description}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.description ?? ""}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
            onError={() => setFailed((prev) => [...prev, img.url])}
          />
        </a>
      ))}
    </div>
  );
}
