import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";

const STEP = 5; // seconds per -5 / +5 tap

export type RestTimer = {
  running: boolean;
  remainingSec: number;
  targetSec: number;
  start: (seconds: number) => void;
  addSeconds: (delta: number) => void;
  togglePause: () => void;
  skip: () => void;
};

export function useRestTimer(): RestTimer {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [targetSec, setTargetSec] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const endAtRef = useRef<number>(0);

  const start = useCallback((seconds: number) => {
    setTargetSec(seconds);
    setRemainingSec(seconds);
    endAtRef.current = Date.now() + seconds * 1000;
    setPaused(false);
    setRunning(true);
  }, []);

  const addSeconds = useCallback(
    (delta: number) => {
      endAtRef.current += delta * 1000;
      setTargetSec((t) => Math.max(STEP, t + delta));
      setRemainingSec((r) => Math.max(0, r + delta));
    },
    [],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (p) endAtRef.current = Date.now() + remainingSec * 1000;
      return !p;
    });
  }, [remainingSec]);

  const skip = useCallback(() => {
    setRunning(false);
    setPaused(false);
    setRemainingSec(0);
  }, []);

  useEffect(() => {
    if (!running || paused) return;
    const tick = setInterval(() => {
      const left = Math.round((endAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemainingSec(0);
        setRunning(false);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        setRemainingSec(left);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [running, paused]);

  return {
    running,
    remainingSec,
    targetSec,
    start,
    addSeconds,
    togglePause,
    skip,
  };
}

export const REST_STEP = STEP;
