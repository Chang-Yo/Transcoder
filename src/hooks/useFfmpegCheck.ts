import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import type { FfmpegAvailability } from "../types";

export function useFfmpegCheck() {
  const [ffmpegAvailable, setFfmpegAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    invoke<FfmpegAvailability>("check_ffmpeg_available")
      .then((result) => {
        setFfmpegAvailable(result.ffmpeg && result.ffprobe);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  return { ffmpegAvailable, checking };
}
