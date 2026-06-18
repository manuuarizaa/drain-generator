import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type FrameCallback = (deltaSeconds: number) => boolean;

export function useAnimationLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onFrame: FrameCallback,
) {
  const callbackRef = useRef(onFrame);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef(0);
  const isActiveRef = useRef(true);
  const [isPageVisible, setIsPageVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const isActive = isPageVisible && isIntersecting;

  callbackRef.current = onFrame;
  isActiveRef.current = isActive;

  const runFrame = useCallback((timestamp: number) => {
    frameRef.current = null;
    if (!isActiveRef.current) return;

    const elapsed = previousTimeRef.current
      ? (timestamp - previousTimeRef.current) / 1000
      : 1 / 60;
    previousTimeRef.current = timestamp;
    const shouldContinue = callbackRef.current(Math.min(elapsed, 0.05));

    if (shouldContinue) {
      frameRef.current = requestAnimationFrame(runFrame);
    }
  }, []);

  const invalidate = useCallback(() => {
    if (!isActiveRef.current || frameRef.current !== null) return;
    previousTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const target = canvas?.parentElement;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry?.isIntersecting ?? false);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isActive) {
      invalidate();
    } else if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [invalidate, isActive]);

  return { invalidate, prefersReducedMotion };
}
