import process from "node:process";
import { password, select } from "@inquirer/prompts";
import type { SupportedModel, SupportedModelKey } from "../constants/models.js";
import type { InstallScope } from "../types/settings.js";

export type TrackedLocalSettingsAction = "untrack" | "user" | "cancel";

export async function promptForApiKey(): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Interactive setup requires a TTY so the API key can be entered securely.");
  }

  return password({
    message: "GonkaGate API key",
    mask: "*",
    validate: (value) => (value.trim().length > 0 ? true : "API key is required.")
  }).catch(rethrowPromptExit);
}

interface SelectChoice<Value> {
  value: Value;
  name: string;
  description?: string;
  short?: string;
}

interface SelectPromptConfig<Value> {
  message: string;
  choices: readonly SelectChoice<Value>[];
  default: Value;
  pageSize?: number;
  loop?: boolean;
  theme?: {
    indexMode?: "hidden" | "number";
  };
}

type SelectPrompt<Value> = (config: SelectPromptConfig<Value>) => Promise<Value>;

export function buildScopePromptConfig(defaultScope: InstallScope): SelectPromptConfig<InstallScope> {
  return {
    message: "Install scope",
    default: defaultScope,
    choices: [
      {
        value: "user",
        name: "User",
        short: "user",
        description: "Write ~/.claude/settings.json for your user account."
      },
      {
        value: "local",
        name: "Local",
        short: "local",
        description: "Write .claude/settings.local.json in the current repository."
      }
    ],
    loop: false,
    theme: {
      indexMode: "number"
    }
  };
}

export async function promptForScope(
  defaultScope: InstallScope,
  selectPrompt: SelectPrompt<InstallScope> = select as SelectPrompt<InstallScope>
): Promise<InstallScope> {
  return selectPrompt(buildScopePromptConfig(defaultScope)).catch(rethrowPromptExit);
}

export function buildTrackedLocalSettingsPromptConfig(
  relativeTargetPath: string
): SelectPromptConfig<TrackedLocalSettingsAction> {
  return {
    message: `${relativeTargetPath} is already tracked by git. How should setup continue?`,
    default: "untrack",
    choices: [
      {
        value: "untrack",
        name: "Stop tracking and continue",
        short: "untrack",
        description: `Run git rm --cached for ${relativeTargetPath}, keep the file locally, and add a local git exclude.`
      },
      {
        value: "user",
        name: "Switch to user scope",
        short: "user",
        description: "Write ~/.claude/settings.json instead and leave the repository alone."
      },
      {
        value: "cancel",
        name: "Cancel installation",
        short: "cancel",
        description: "Stop now without changing Claude Code settings."
      }
    ],
    loop: false,
    theme: {
      indexMode: "number"
    }
  };
}

export async function promptForTrackedLocalSettingsAction(
  relativeTargetPath: string,
  selectPrompt: SelectPrompt<TrackedLocalSettingsAction> = select as SelectPrompt<TrackedLocalSettingsAction>
): Promise<TrackedLocalSettingsAction> {
  return selectPrompt(buildTrackedLocalSettingsPromptConfig(relativeTargetPath)).catch(rethrowPromptExit);
}

export function buildModelPromptConfig(
  models: readonly SupportedModel[],
  defaultModelKey: SupportedModelKey
): SelectPromptConfig<SupportedModelKey> {
  if (models.length === 0) {
    throw new Error("No supported GonkaGate models are configured.");
  }

  const defaultModel = requireDefaultModel(models, defaultModelKey);

  return {
    message: "Choose a GonkaGate model",
    default: defaultModel.key,
    choices: models.map((model) => ({
      value: model.key,
      name: model.displayName,
      short: model.key,
      description: `${model.description ? `${model.description} ` : ""}Model ID: ${model.modelId}`
    })),
    pageSize: Math.min(models.length, 8),
    loop: false,
    theme: {
      indexMode: "number"
    }
  };
}

export async function promptForModel(
  models: readonly SupportedModel[],
  defaultModelKey: SupportedModelKey,
  selectPrompt: SelectPrompt<SupportedModelKey> = select as SelectPrompt<SupportedModelKey>
): Promise<SupportedModel> {
  const selectedModelKey = await selectPrompt(buildModelPromptConfig(models, defaultModelKey)).catch(rethrowPromptExit);
  return requireDefaultModel(models, selectedModelKey);
}

function requireDefaultModel(models: readonly SupportedModel[], defaultModelKey: SupportedModelKey): SupportedModel {
  const defaultModel = models.find((model) => model.key === defaultModelKey);

  if (!defaultModel) {
    throw new Error(`Default model "${defaultModelKey}" is not present in the supported model registry.`);
  }

  return defaultModel;
}

function rethrowPromptExit(error: unknown): never {
  if (error instanceof Error && (error.name === "ExitPromptError" || error.name === "AbortPromptError")) {
    throw new Error("Installation cancelled.");
  }

  throw error;
}
