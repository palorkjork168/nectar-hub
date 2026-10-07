/**
 * Escape HTML to prevent injection in email templates
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Base responsive HTML email layout for Sakol Universe
 */
function renderEmailLayout({
  title,
  recipientName = "Valued Member",
  introText,
  detailsHtml = "",
  actionUrl = null,
  actionText = "Open in Sakol Universe",
  footerText = "This is an automated transactional notification from Sakol Universe.",
}) {
  const safeName = escapeHtml(recipientName);
  const safeTitle = escapeHtml(title);
  const safeIntro = introText ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${introText}</p>` : "";

  const actionBlock = actionUrl
    ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${escapeHtml(actionUrl)}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; letter-spacing: 0.2px;">
        ${escapeHtml(actionText)}
      </a>
    </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
              <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Sakol Universe</span>
              <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 4px;">Global Workforce & Talent Ecosystem</span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #0f172a;">${safeTitle}</h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">Hello ${safeName},</p>
              ${safeIntro}
              ${detailsHtml}
              ${actionBlock}
            </td>
          </tr>

          <!-- Footer Divider & Content -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">${escapeHtml(footerText)}</p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} Sakol Universe. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  renderEmailLayout,
  escapeHtml,
};
