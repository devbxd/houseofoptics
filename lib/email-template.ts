import { SITE_URL } from "./site";

const LOGO_URL = `${SITE_URL}/logo-black.png`;
const DARK = "#111111";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Converts plain text (e.g. an admin-typed broadcast message) into safe HTML paragraphs. */
export function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 16px;">${escapeHtml(para).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function renderEmail({
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f2f0ec;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0ec;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;">
            <tr>
              <td style="background:${DARK};padding:32px 24px;text-align:center;">
                <img src="${LOGO_URL}" alt="House of Optics" width="52" style="display:inline-block;border:0;" />
                <div style="margin-top:12px;color:#ffffff;font-size:13px;letter-spacing:4px;text-transform:uppercase;">
                  House of Optics
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 32px;">
                <h1 style="margin:0 0 18px;font-size:22px;font-weight:normal;color:${DARK};">${heading}</h1>
                <div style="font-size:15px;line-height:1.7;color:#333333;">${bodyHtml}</div>
                ${
                  ctaUrl
                    ? `<div style="margin-top:28px;">
                        <a href="${ctaUrl}" style="display:inline-block;background:${DARK};color:#ffffff;text-decoration:none;padding:13px 30px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                          ${ctaLabel ?? "Discover"}
                        </a>
                      </div>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 28px;border-top:1px solid #eeeeee;text-align:center;">
                <p style="margin:0;font-size:11px;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">
                  House of Optics
                </p>
                <p style="margin:8px 0 0;font-size:12px;color:#aaaaaa;">
                  <a href="${SITE_URL}" style="color:#aaaaaa;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
