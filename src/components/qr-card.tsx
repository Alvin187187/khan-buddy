"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCard({ url, pin }: { url: string; pin?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: "#1a1916", light: "#fffdf8" } }).then(setSrc);
  }, [url]);
  return (
    <div className="flex flex-col items-center gap-3 rounded-[12px] border border-line bg-surface p-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={pin ? `PIN ${pin}` : "Join QR"} className="size-56" />
      ) : (
        <div className="size-56 rounded-[8px] border border-line" aria-hidden />
      )}
      {pin ? <p className="text-4xl font-black tracking-[0.18em]">{pin}</p> : null}
    </div>
  );
}
