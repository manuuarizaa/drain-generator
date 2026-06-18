import { useCallback, useEffect, useRef, useState } from "react";
import { downloadBlob } from "../../../shared/browser/downloadBlob";
import type { DrainConfig } from "../domain/config";

export function useStlExport(config: DrainConfig) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const isExportingRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  const exportStl = useCallback(async () => {
    if (isExportingRef.current) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setError(null);

    try {
      const worker = new Worker(
        new URL("./stlExport.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      const model = await new Promise<{
        buffer: ArrayBuffer;
        fileName: string;
      }>((resolve, reject) => {
        worker.onmessage = (
          event: MessageEvent<
            | { ok: true; buffer: ArrayBuffer; fileName: string }
            | { ok: false; message: string }
          >,
        ) => {
          if (event.data.ok) {
            resolve(event.data);
          } else {
            reject(new Error(event.data.message));
          }
        };
        worker.onerror = () => reject(new Error("STL worker failed"));
        worker.postMessage({ config });
      });

      worker.terminate();
      workerRef.current = null;
      downloadBlob(
        new Blob([model.buffer], { type: "model/stl" }),
        model.fileName,
      );
    } catch (exportError) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setError(exportError);
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }, [config]);

  return { exportStl, isExporting, error };
}
