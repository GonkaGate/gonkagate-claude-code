import { CLAUDE_SETTINGS_SCHEMA_URL, GONKAGATE_BASE_URL } from "../constants/gateway.js";
import type { SupportedModel } from "../constants/models.js";
import type { ClaudeCodeSettings } from "../types/settings.js";
import { isPlainObject } from "./object-utils.js";

export const GONKAGATE_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL"
] as const;

function buildGonkaEnv(apiKey: string, selectedModel: SupportedModel): Record<string, string> {
  return {
    ANTHROPIC_BASE_URL: GONKAGATE_BASE_URL,
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_MODEL: selectedModel.modelId,
    ANTHROPIC_DEFAULT_OPUS_MODEL: selectedModel.modelId,
    ANTHROPIC_DEFAULT_SONNET_MODEL: selectedModel.modelId,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: selectedModel.modelId,
    CLAUDE_CODE_SUBAGENT_MODEL: selectedModel.modelId
  };
}

export function mergeSettingsWithGonkaEnv(
  settings: ClaudeCodeSettings,
  apiKey: string,
  selectedModel: SupportedModel
): ClaudeCodeSettings {
  const existingEnv = isPlainObject(settings.env) ? { ...settings.env } : {};
  delete existingEnv.ANTHROPIC_API_KEY;

  return {
    ...settings,
    $schema: settings.$schema ?? CLAUDE_SETTINGS_SCHEMA_URL,
    env: {
      ...existingEnv,
      ...buildGonkaEnv(apiKey, selectedModel)
    }
  };
}
