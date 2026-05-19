export interface AssetBinding {
  fetch(input: Request | URL | string, init?: RequestInit): Promise<Response>;
}

export interface Env {
  ASSETS: AssetBinding;
  GIRK_ENVIRONMENT?: string;
}

export interface WorkerHandler<TEnv> {
  fetch(request: Request, env: TEnv): Promise<Response> | Response;
}
