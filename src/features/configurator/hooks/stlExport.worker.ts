import type { DrainConfig } from "../domain/config";
import { createStlModel } from "../domain/stl";

interface ExportRequest {
  config: DrainConfig;
}

type ExportResponse =
  | {
      ok: true;
      buffer: ArrayBuffer;
      fileName: string;
    }
  | {
      ok: false;
      message: string;
    };

const worker = self as unknown as Worker;

worker.onmessage = (event: MessageEvent<ExportRequest>) => {
  try {
    const model = createStlModel(event.data.config);
    const response: ExportResponse = {
      ok: true,
      buffer: model.buffer,
      fileName: model.fileName,
    };
    worker.postMessage(response, [model.buffer]);
  } catch (error) {
    const response: ExportResponse = {
      ok: false,
      message: error instanceof Error ? error.message : "STL export failed",
    };
    worker.postMessage(response);
  }
};
