/**
 * Kie.ai upstream — wraps Kie's async media APIs (image/video/audio) for the
 * gateway's UpstreamAdapter contract.
 *
 * Kie is async-first: POST /api/v1/<family>/generate returns { data: { taskId } },
 * GET /api/v1/<family>/status/<taskId> returns the eventual result. We expose:
 *   - imageGeneration / videoGeneration / audioSpeech: submit + return MediaJob
 *   - pollJob: status fetch
 *   - chat: throws (Kie does not serve chat)
 *
 * Routes synchronously poll up to KIE_SYNC_POLL_MS (default 60s) before
 * returning the queued job to the caller. Beyond that, callers can poll
 * /v1/jobs/{id} (future endpoint) — for now they re-call the upstream poll URL.
 *
 * Reads system key from process.env.KIE_API_KEY. BYOK header overrides.
 */
import type {
  UpstreamAdapter,
  ChatRequest,
  ChatResponse,
  ImageRequest,
  VideoRequest,
  AudioSpeechRequest,
  AudioTranscriptionRequest,
  MediaJob,
} from './interface';
import { logger } from '../lib/logger';

const KIE_BASE = process.env.KIE_BASE_URL || 'https://api.kie.ai';

function selectKey(byok?: string): string | undefined {
  return byok || process.env.KIE_API_KEY;
}

function inferFamily(modelId: string): 'image' | 'video' | 'suno' {
  const id = modelId.toLowerCase();
  if (id.includes('suno') || id.includes('audio') || id.includes('music')) return 'suno';
  if (
    id.includes('veo') ||
    id.includes('sora') ||
    id.includes('kling') ||
    id.includes('hailuo') ||
    id.includes('runway') ||
    id.includes('seedance') ||
    id.includes('hunyuan') ||
    id.includes('wan') ||
    id.includes('video')
  ) {
    return 'video';
  }
  return 'image';
}

async function submit(
  family: 'image' | 'video' | 'suno',
  body: Record<string, unknown>,
  byokKey?: string,
): Promise<MediaJob> {
  const apiKey = selectKey(byokKey);
  if (!apiKey) throw new Error('KIE_API_KEY not configured');
  const url = `${KIE_BASE}/api/v1/${family}/generate`;
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    logger.warn({ family, status: res.status, body: text.slice(0, 500) }, 'kie_submit_error');
    throw new Error(`Kie ${family} submit ${res.status}: ${text.slice(0, 200)}`);
  }
  let data: { data?: { taskId?: string }; code?: number; msg?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Kie ${family} returned non-JSON: ${text.slice(0, 200)}`);
  }
  const taskId = data?.data?.taskId;
  if (!taskId) {
    throw new Error(`Kie ${family} returned no taskId: ${text.slice(0, 200)}`);
  }
  logger.info({ family, taskId, ms: Date.now() - start }, 'kie_submit_ok');
  return {
    status: 'queued',
    job_id: taskId,
    poll_url: `${KIE_BASE}/api/v1/${family}/status/${taskId}`,
  };
}

async function pollOnce(
  family: 'image' | 'video' | 'suno',
  jobId: string,
  byokKey?: string,
): Promise<MediaJob> {
  const apiKey = selectKey(byokKey);
  if (!apiKey) throw new Error('KIE_API_KEY not configured');
  const url = `${KIE_BASE}/api/v1/${family}/status/${jobId}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kie ${family} status ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    code?: number;
    data?: {
      status?: string;
      output?: unknown;
      output_url?: string;
      url?: string;
      error?: string;
      fail_reason?: string;
    };
  };
  const s = body?.data?.status;
  if (s === 'completed' || s === 'success') {
    return {
      status: 'completed',
      job_id: jobId,
      output: body.data?.output ?? body.data?.output_url ?? body.data?.url,
    };
  }
  if (s === 'failed') {
    return {
      status: 'failed',
      job_id: jobId,
      error: body.data?.fail_reason ?? body.data?.error ?? 'kie job failed',
    };
  }
  return { status: s === 'processing' ? 'processing' : 'queued', job_id: jobId };
}

export const kieUpstream: UpstreamAdapter = {
  async chat(_req: ChatRequest): Promise<ChatResponse> {
    throw new Error('Kie does not support chat completions');
  },

  async imageGeneration(req: ImageRequest): Promise<MediaJob> {
    return submit(
      inferFamily(req.modelId) === 'image' ? 'image' : 'image',
      {
        model: req.modelId,
        prompt: req.prompt,
        negative_prompt: req.negative_prompt,
        size: req.size,
        n: req.n ?? 1,
        image_url: req.reference_image_url,
      },
      req.byokKey,
    );
  },

  async videoGeneration(req: VideoRequest): Promise<MediaJob> {
    return submit(
      'video',
      {
        model: req.modelId,
        prompt: req.prompt,
        duration: req.duration_s,
        aspect_ratio: req.aspect_ratio,
        image_url: req.image_url,
      },
      req.byokKey,
    );
  },

  async audioSpeech(req: AudioSpeechRequest): Promise<MediaJob> {
    return submit(
      'suno',
      {
        model: req.modelId,
        prompt: req.input,
        voice: req.voice,
        format: req.format,
      },
      req.byokKey,
    );
  },

  async audioTranscription(_req: AudioTranscriptionRequest): Promise<MediaJob> {
    throw new Error('Kie does not provide STT; use a Whisper-capable upstream');
  },

  async pollJob(jobId: string, family: 'image' | 'video' | 'suno'): Promise<MediaJob> {
    return pollOnce(family, jobId);
  },
};

/**
 * Helper for routes: submit + poll until done or timeout.
 * Returns the final MediaJob (completed/failed) or the queued handle if timeout.
 */
export async function submitAndPoll(
  family: 'image' | 'video' | 'suno',
  body: Record<string, unknown>,
  opts: { byokKey?: string; timeoutMs?: number; intervalMs?: number } = {},
): Promise<MediaJob> {
  const timeoutMs = opts.timeoutMs ?? Number(process.env.KIE_SYNC_POLL_MS || 60_000);
  const intervalMs = opts.intervalMs ?? 3_000;
  const handle = await submit(family, body, opts.byokKey);
  const deadline = Date.now() + timeoutMs;
  let last = handle;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    last = await pollOnce(family, handle.job_id, opts.byokKey);
    if (last.status === 'completed' || last.status === 'failed') return last;
  }
  return { ...handle, status: 'queued' };
}
