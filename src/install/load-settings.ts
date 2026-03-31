import { access, constants, readFile } from "node:fs/promises";
import type { ClaudeCodeSettings } from "../types/settings.js";
import { isPlainObject } from "./object-utils.js";

export interface LoadSettingsResult {
  exists: boolean;
  settings: ClaudeCodeSettings;
}

export async function loadSettings(filePath: string): Promise<LoadSettingsResult> {
  try {
    await access(filePath, constants.F_OK);
  } catch {
    return {
      exists: false,
      settings: {}
    };
  }

  const raw = await readFile(filePath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse JSON in ${filePath}. Fix or restore that file before rerunning the installer.`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`Expected ${filePath} to contain a JSON object.`);
  }

  if ("env" in parsed && parsed.env !== undefined && !isPlainObject(parsed.env)) {
    throw new Error(`Expected "env" in ${filePath} to be a JSON object when present.`);
  }

  return {
    exists: true,
    settings: parsed
  };
}
