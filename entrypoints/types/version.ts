export interface VersionData {
  version: string;
  usage: number;
  major: number;
  minor: number;
  patch: number;
}

export interface VersionGroup {
  major: Record<string, VersionData[]>;
  minor: Record<string, VersionData[]>;
  patch: Record<string, VersionData[]>;
}

export interface TabData {
  label: string;
  key: 'major' | 'minor' | 'patch';
  data: Record<string, VersionData[]>;
}