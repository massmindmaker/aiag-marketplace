/**
 * Shared minimal HTML layout. Dark theme, amber #f59e0b accent.
 * Inline styles only — most clients strip <style>.
 */
export function wrap(opts: { title: string; bodyHtml: string; preheader?: string }): string {
  const preheader = opts.preheader ?? '';
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#111111;border:1px solid #262626;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #262626;">
                <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#fafafa;">
                  ai-aggregator<span style="color:#f59e0b;">.ru</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#e5e5e5;font-size:15px;line-height:1.6;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #262626;color:#737373;font-size:12px;line-height:1.5;">
                AI-Aggregator — каталог AI-моделей с единым API.<br/>
                Если письмо пришло по ошибке — просто проигнорируйте его.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background:#f59e0b;border-radius:8px;">
        <a href="${escapeAttr(href)}" style="display:inline-block;padding:12px 24px;color:#0a0a0a;font-weight:600;text-decoration:none;font-size:15px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(s: string): string {
  return escapeHtml(s);
}
