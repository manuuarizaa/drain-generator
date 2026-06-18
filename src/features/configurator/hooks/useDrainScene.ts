import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { DrainModel } from "../domain/geometry";
import { createDrainModel, disposeGroup } from "../domain/geometry";
import type { DrainConfig } from "../domain/config";
import {
  createDrainSceneRuntime,
  disposeDrainSceneRuntime,
  initialCameraState,
  renderDrainScene,
  type CameraState,
  type DrainSceneRuntime,
} from "./drainSceneRuntime";
import { useAnimationLoop } from "./useAnimationLoop";
import { useDrainInteraction } from "./useDrainInteraction";

export interface SceneControls extends ReturnType<typeof useDrainInteraction> {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isAutoRotating: boolean;
  hasWebGlError: boolean;
}

export function useDrainScene(config: DrainConfig): SceneControls {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<DrainSceneRuntime | null>(null);
  const cameraState = useRef<CameraState>({ ...initialCameraState });
  const [sceneStatus, setSceneStatus] = useState({
    runtimeVersion: 0,
    hasWebGlError: false,
  });
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const renderFrame = useCallback((deltaSeconds: number) => {
    const runtime = runtimeRef.current;
    if (!runtime) return false;
    return renderDrainScene(runtime, cameraState.current, deltaSeconds);
  }, []);

  const { invalidate, prefersReducedMotion } = useAnimationLoop(
    canvasRef,
    renderFrame,
  );

  const interaction = useDrainInteraction({
    cameraState,
    invalidate,
    onAutoRotateChange: setIsAutoRotating,
  });

  useEffect(() => {
    if (!prefersReducedMotion) return;
    cameraState.current.autoRotate = false;
    setIsAutoRotating(false);
    invalidate();
  }, [invalidate, prefersReducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    try {
      const runtime = createDrainSceneRuntime(canvas, container, () => {
        setSceneStatus((status) => ({ ...status, hasWebGlError: true }));
      });
      runtimeRef.current = runtime;
      setSceneStatus((status) => ({
        runtimeVersion: status.runtimeVersion + 1,
        hasWebGlError: false,
      }));
      invalidate();
    } catch {
      setSceneStatus((status) => ({ ...status, hasWebGlError: true }));
    }

    return () => {
      const runtime = runtimeRef.current;
      if (runtime) {
        disposeDrainSceneRuntime(runtime);
        runtimeRef.current = null;
      }
    };
  }, [invalidate]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || sceneStatus.runtimeVersion === 0) return;

    let idleHandle: number | null = null;
    let createdModel: DrainModel | null = null;
    const timer = window.setTimeout(() => {
      const rebuild = () => {
        const currentRuntime = runtimeRef.current;
        if (!currentRuntime) return;

        const model = createDrainModel(
          config,
          currentRuntime.topMaterial,
          currentRuntime.bottomMaterial,
        );
        createdModel = model;
        cameraState.current.distance = model.cameraDistance;
        currentRuntime.floor.position.y = -model.visualHeight / 2 - 0.02;
        currentRuntime.scene.add(model.group);
        invalidate();
      };

      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(rebuild, { timeout: 180 });
      } else {
        rebuild();
      }
    }, 90);

    return () => {
      window.clearTimeout(timer);
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (createdModel) {
        runtime.scene.remove(createdModel.group);
        disposeGroup(createdModel.group);
      }
    };
  }, [config, invalidate, sceneStatus.runtimeVersion]);

  return {
    canvasRef,
    isAutoRotating,
    hasWebGlError: sceneStatus.hasWebGlError,
    ...interaction,
  };
}
