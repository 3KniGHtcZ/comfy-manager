import { useCallback, useEffect, useRef, useState } from "react";
import type { ComfyUISystemStats } from "~/lib/comfyuiTypes";
import { checkStatus } from "~/server/comfyui";

const POLL_INTERVAL_MS = 10_000;

interface ComfyUIStatusState {
  online: boolean;
  systemStats: ComfyUISystemStats | null;
}

/**
 * React hook that polls the ComfyUI server status every 10 seconds.
 * Automatically stops polling when the component unmounts.
 */
export function useComfyUIStatus(): ComfyUIStatusState {
  const [online, setOnline] = useState(false);
  const [systemStats, setSystemStats] = useState<ComfyUISystemStats | null>(
    null,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await checkStatus();
      setOnline(result.online);
      setSystemStats(result.systemStats ?? null);
    } catch {
      setOnline(false);
      setSystemStats(null);
    }
  }, []);

  useEffect(() => {
    // Initial check
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [poll]);

  return { online, systemStats };
}
