import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineEventHandler, readBody } from "h3";
import type { EditParams, EditRecord } from "../../../src/lib/types";
import {
  type ComfyWorkflow,
  injectPrompt,
  injectSampler,
  injectSourceImage,
  setLoraStrengths,
} from "../../../src/lib/workflowUtils";
import { getComfyApi } from "../../../src/server/comfyClient";

const EDITS_PATH = join(process.cwd(), "data", "edits.json");
const LORA_CONFIG_PATH = join(process.cwd(), "data", "lora-config.json");
const WORKFLOWS_DIR = join(process.cwd(), "workflows");
const DEFAULT_EDIT_WORKFLOW = "qwen-edit.json";

const LORA_CLASSES = new Set(["LoraLoader", "LoraLoaderModelOnly"]);

/**
 * POST /api/edit
 *
 * Creates an edit record and queues the workflow(s) to ComfyUI.
 *
 * Body: { params: EditParams }
 * Returns: { editId: string, promptIds: string[] }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ params: EditParams }>(event);
  const params = body.params;

  if (!params || !params.sourceImage?.filename) {
    throw new Error("Missing params or sourceImage");
  }

  // 1. Create edit record
  const editsRaw = await readFile(EDITS_PATH, "utf-8").catch(() => "[]");
  const edits: EditRecord[] = JSON.parse(editsRaw);
  const edit: EditRecord = {
    id: crypto.randomUUID(),
    sourceImage: params.sourceImage,
    params,
    status: "editing",
    resultImages: [],
    createdAt: new Date().toISOString(),
  };
  edits.push(edit);
  await writeFile(EDITS_PATH, JSON.stringify(edits, null, 2), "utf-8");

  // 2. Build and queue workflow for each batch item
  const api = await getComfyApi();
  const promptIds: string[] = [];

  for (let i = 0; i < params.batchCount; i++) {
    const raw = await readFile(
      join(WORKFLOWS_DIR, DEFAULT_EDIT_WORKFLOW),
      "utf-8",
    );
    const workflow: ComfyWorkflow = JSON.parse(raw);
    delete workflow._comment;

    // Inject source image
    injectSourceImage(workflow, params.sourceImage.filename);

    // Inject prompt
    injectPrompt(workflow, params.prompt);

    // Compute seed
    const seed =
      params.seedMode === "fixed" && params.seed !== undefined
        ? params.seed
        : Math.floor(Math.random() * 2 ** 32);

    // Inject sampler settings
    injectSampler(workflow, { steps: params.steps, cfg: params.cfg, seed });

    // Apply LoRA on/off state when the client sent a selection
    if (params.activeLoraNodeIds !== undefined) {
      // Read per-LoRA configured strengths from lora-config.json
      const configRaw = await readFile(LORA_CONFIG_PATH, "utf-8").catch(
        () => "{}",
      );
      const loraConfig: Record<string, { strength: number }> =
        JSON.parse(configRaw);

      // Build nodeId → strength map by matching workflow lora_name to config keys
      const configuredStrengths: Record<string, number> = {};
      for (const [nodeId, node] of Object.entries(workflow)) {
        if (!LORA_CLASSES.has(node?.class_type)) continue;
        const loraName: string = node.inputs?.lora_name ?? "";
        if (loraConfig[loraName]?.strength !== undefined) {
          configuredStrengths[nodeId] = loraConfig[loraName].strength;
        }
      }

      setLoraStrengths(workflow, params.activeLoraNodeIds, configuredStrengths);
    }

    // Queue prompt to ComfyUI
    const result = await api.ext.queue.queuePrompt(null, workflow);
    promptIds.push(result.prompt_id);
  }

  return { editId: edit.id, promptIds };
});
