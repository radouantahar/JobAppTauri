interface Window {
  __TAURI__: {
    invoke(cmd: string, args?: Record<string, unknown>): Promise<any>;
  };
} 