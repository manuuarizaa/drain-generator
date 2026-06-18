import { useCallback } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent,
} from "react";
import { initialCameraState, type CameraState } from "./drainSceneRuntime";

const MIN_ROTATION_X = 0.05;
const MAX_ROTATION_X = Math.PI / 2 - 0.05;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

interface DrainInteractionOptions {
  cameraState: RefObject<CameraState>;
  invalidate: () => void;
  onAutoRotateChange: (isAutoRotating: boolean) => void;
}

export function useDrainInteraction({
  cameraState,
  invalidate,
  onAutoRotateChange,
}: DrainInteractionOptions) {
  const stopAutoRotate = useCallback(() => {
    cameraState.current.autoRotate = false;
    onAutoRotateChange(false);
  }, [cameraState, onAutoRotateChange]);

  const rotate = useCallback(
    (horizontal: number, vertical = 0) => {
      const state = cameraState.current;
      stopAutoRotate();
      state.targetY += horizontal;
      state.targetX = clamp(
        state.targetX + vertical,
        MIN_ROTATION_X,
        MAX_ROTATION_X,
      );
      invalidate();
    },
    [cameraState, invalidate, stopAutoRotate],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const state = cameraState.current;
      state.zoom = clamp(state.zoom * factor, 0.3, 3.2);
      invalidate();
    },
    [cameraState, invalidate],
  );

  const resetView = useCallback(() => {
    const state = cameraState.current;
    state.zoom = initialCameraState.zoom;
    state.targetX = initialCameraState.targetX;
    state.targetY = initialCameraState.targetY;
    state.autoRotate = false;
    onAutoRotateChange(false);
    invalidate();
  }, [cameraState, invalidate, onAutoRotateChange]);

  const toggleAutoRotate = useCallback(() => {
    const state = cameraState.current;
    state.autoRotate = !state.autoRotate;
    onAutoRotateChange(state.autoRotate);
    invalidate();
  }, [cameraState, invalidate, onAutoRotateChange]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const state = cameraState.current;
      stopAutoRotate();
      state.dragging = true;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [cameraState, stopAutoRotate],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const state = cameraState.current;
      if (!state.dragging) return;

      state.targetY += (event.clientX - state.pointerX) * 0.013;
      state.targetX = clamp(
        state.targetX - (event.clientY - state.pointerY) * 0.013,
        MIN_ROTATION_X,
        MAX_ROTATION_X,
      );
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      invalidate();
    },
    [cameraState, invalidate],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      cameraState.current.dragging = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [cameraState],
  );

  const onLostPointerCapture = useCallback(() => {
    cameraState.current.dragging = false;
  }, [cameraState]);

  const onWheel = useCallback(
    (event: WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      zoomBy(1 - event.deltaY * 0.001);
    },
    [zoomBy],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
      const keyActions: Partial<Record<string, () => void>> = {
        ArrowLeft: () => rotate(-0.18),
        ArrowRight: () => rotate(0.18),
        ArrowUp: () => rotate(0, 0.14),
        ArrowDown: () => rotate(0, -0.14),
        "+": () => zoomBy(1.12),
        "=": () => zoomBy(1.12),
        "-": () => zoomBy(0.88),
        Home: resetView,
        " ": toggleAutoRotate,
      };
      const action = keyActions[event.key];
      if (!action) return;

      event.preventDefault();
      action();
    },
    [resetView, rotate, toggleAutoRotate, zoomBy],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onLostPointerCapture,
    onWheel,
    onKeyDown,
    rotate,
    zoomBy,
    resetView,
    toggleAutoRotate,
  };
}
