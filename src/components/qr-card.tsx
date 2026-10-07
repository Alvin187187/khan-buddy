"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card } from "./ui";

export function QrCard({ url, label }: { url: string; label: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#1a1916", light: "#fffdf8" } }).then(
      setSrc,
    );
  }, [url]);
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="size-44" />
      ) : (
        <div className="size-44 rounded-[8px] border border-line" />
      )}
      <p className="text-sm font-bold">{label}</p>
      <p className="break-all text-xs text-muted">{url}</p>
    </Card>
  );
}
