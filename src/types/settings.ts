export type InstallScope = "user" | "local";

export interface ClaudeCodeSettings {
  $schema?: string;
  env?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SettingsTarget {
  scope: InstallScope;
  path: string;
}
