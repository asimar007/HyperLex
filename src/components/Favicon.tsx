"use client";

import { useState } from "react";
import { faviconUrl } from "@/lib/utils";

export default function Favicon({ domain, className = "h-3.5 w-3.5" }: { domain: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) {
    return <span className={`${className} inline-block shrink-0 rounded-sm bg-rule`} aria-hidden="true" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(domain)}
      alt=""
      className={`${className} shrink-0 rounded-sm`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
