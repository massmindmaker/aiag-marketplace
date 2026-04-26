/**
 * @aiag/upstream-adapters — public API surface.
 *
 * Gateway (Plan 04) imports from here; apps should NOT deep-import
 * into `src/adapters/*.ts` directly so we can refactor internals.
 */

// Base contracts + utilities
export * from './base';

// Registry + factory
export {
  UpstreamRegistry,
  createUpstreamAdapter,
  createDefaultRegistry,
  type UpstreamAdapterConfig,
} from './registry';

// Adapters (re-exported for direct use)
export { OpenRouterAdapter, type OpenRouterConfig } from './adapters/openrouter';
export { FalAdapter, type FalConfig } from './adapters/fal';
export { KieAdapter, type KieConfig } from './adapters/kie';
export { HuggingFaceAdapter, type HuggingFaceConfig } from './adapters/huggingface';
export { TogetherAdapter, type TogetherConfig } from './adapters/together';
export { YandexGPTAdapter, type YandexGPTConfig } from './adapters/yandexgpt';
export { YandexIamTokenManager, type YandexIamConfig } from './adapters/yandex-iam';
export { ReplicateAdapter, type ReplicateConfig } from './adapters/replicate';
export { MockAdapter, type MockAdapterConfig } from './adapters/mock';

// BYOK layer
export * from './byok';

// S3 upload helpers
export { MockS3Uploader, mirrorMediaToS3, type S3Uploader, type S3UploadInput, type S3UploadResult } from './s3-upload';
