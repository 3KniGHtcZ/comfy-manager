import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import type { WorkflowLoraInfo } from "~/lib/editLoras";
import type { GenerationParams, Persona } from "~/lib/types";
import {
  type ComfyWorkflow,
  injectLoraModel,
  injectLoraStackerSlots,
  injectPrompt,
  injectResolution,
  injectSampler,
} from "~/lib/workflowUtils";

const DEFAULT_WORKFLOW = "image-generation.json";
const EDIT_WORKFLOW = "qwen-edit.json";
const WORKFLOWS_DIR = join(process.cwd(), "workflows");

const LORA_CLASSES = new Set(["LoraLoader", "LoraLoaderModelOnly"]);

/**
 * Read the edit workflow and return all LoRA nodes with their real filenames,
 * display labels (basename without extension), and default strength values.
 */
const LORA_CONFIG_PATH = join(process.cwd(), "data", "lora-config.json");

type LoraConfigEntry = {
  strength?: number;
  name?: string;
  image?: string;
};

export const getEditLoras = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorkflowLoraInfo[]> => {
    const raw = await readFile(join(WORKFLOWS_DIR, EDIT_WORKFLOW), "utf-8");
    // biome-ignore lint/suspicious/noExplicitAny: dynamic workflow schema
    const workflow = JSON.parse(raw) as Record<string, any>;

    // Load optional per-LoRA config (name, image, strength)
    const configRaw = await readFile(LORA_CONFIG_PATH, "utf-8").catch(
      () => "{}",
    );
    const loraConfig: Record<string, LoraConfigEntry> = JSON.parse(configRaw);

    const result: WorkflowLoraInfo[] = [];
    for (const [nodeId, node] of Object.entries(workflow)) {
      if (!LORA_CLASSES.has(node?.class_type)) continue;
      const loraName: string = node.inputs?.lora_name ?? "";
      const defaultStrength: number = node.inputs?.strength_model ?? 1;
      // Strip directory prefix and file extension for the fallback label
      const basename =
        loraName.replace(/\\/g, "/").split("/").pop() ?? loraName;
      const label = basename.replace(/\.[^.]+$/, "");

      const cfg = loraConfig[loraName];
      result.push({
        nodeId,
        loraName,
        label,
        defaultStrength: cfg?.strength ?? defaultStrength,
        name: cfg?.name || undefined,
        image: cfg?.image || undefined,
      });
    }
    return result;
  },
);

/**
 * Build a fully-configured ComfyUI API-format workflow object from generation
 * parameters and a persona definition.
 */
export const buildPrompt = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { params: GenerationParams; persona: Persona }) => data,
  )
  .handler(async ({ data }) => {
    const { params, persona } = data;

    // Load the workflow file — use persona's custom file or fall back to default
    const workflowFile = persona.workflowFile ?? DEFAULT_WORKFLOW;
    const raw = await readFile(join(WORKFLOWS_DIR, workflowFile), "utf-8");
    const workflow: ComfyWorkflow = JSON.parse(raw);

    // Remove metadata keys like _comment
    delete workflow._comment;

    // Inject prompt
    injectPrompt(workflow, params.prompt);

    // Compute seed: random or fixed
    const seed =
      params.seedMode === "fixed" && params.seed !== undefined
        ? params.seed
        : Math.floor(Math.random() * 2 ** 32);

    // Inject sampler settings
    injectSampler(workflow, {
      steps: params.steps,
      cfg: params.cfg,
      seed,
    });

    // Inject resolution (only applies to EmptyLatentImage-based workflows)
    injectResolution(workflow, params.aspectRatio, params.resolution);

    // Inject LoRA from persona — skip when a custom workflow already embeds it
    if (persona.loraName && !persona.workflowFile) {
      injectLoraModel(workflow, persona.loraName, persona.loraStrength ?? 1.0);
    }

    // Inject configurable LoRA Stacker slots (Ela workflow)
    if (params.loraSlots) {
      injectLoraStackerSlots(workflow, params.loraSlots);
    }

    return workflow;
  });
