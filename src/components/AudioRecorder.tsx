"use client";

import { useState } from "react";
import { MicIcon, StopIcon } from "./icons";
import type { ItemType } from "@/lib/types";

export function AudioRecorder({
  onBlob,
}: {
  onBlob: (blob: Blob) => void;
}): React.ReactElement {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  const start = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    mr.onstop = () => {
      onBlob(new Blob(chunks, { type: "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setRec(mr);
    setRecording(true);
  };

  const stop = (): void => {
    rec?.stop();
    setRec(null);
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        recording ? "bg-[#e60023] text-white" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
      }`}
    >
      {recording ? <StopIcon /> : <MicIcon />}
      {recording ? "Stop recording" : "Record audio note"}
    </button>
  );
}
