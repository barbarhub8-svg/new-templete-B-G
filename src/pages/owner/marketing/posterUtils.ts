import type { PosterData } from "./PosterCreator";

export function posterDimensions(format: string): [number, number] {
  switch (format) {
    case "Instagram Story":
    case "WhatsApp Status":
      return [1080, 1920];
    case "Facebook Post":
      return [1200, 628];
    case "LinkedIn Post":
      return [1200, 627];
    case "X Post":
      return [1200, 675];
    default:
      return [1080, 1080];
  }
}

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[char] || char,
  );
/** Downloads an SVG mockup with the same format and owner-entered fields as the preview. */
export function downloadPoster(data: PosterData, format: string) {
  const [width, height] = posterDimensions(format);
  const background =
    data.background ||
    (data.template === "Minimal"
      ? "#ded4c5"
      : data.template === "Celebration"
        ? "#634353"
        : "#554638");
  const foreground =
    data.foreground || (data.template === "Minimal" ? "#332a22" : "#eadac0");
  const anchor =
    data.align === "left" ? "start" : data.align === "right" ? "end" : "middle";
  const x =
    data.align === "left"
      ? width * 0.12
      : data.align === "right"
        ? width * 0.88
        : width / 2;
  const text = (value: string, y: number, size: number, color = foreground) =>
    `<text x="${x}" y="${height * y}" text-anchor="${anchor}" fill="${color}" font-family="Georgia,serif" font-size="${size}">${escapeXml(value)}</text>`;
  const logo = data.logo.startsWith("data:image/")
    ? `<image href="${escapeXml(data.logo)}" x="${width / 2 - 40}" y="${height * 0.12}" width="80" height="80" preserveAspectRatio="xMidYMid meet"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${escapeXml(background)}"/><rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="${escapeXml(foreground)}" opacity=".6"/>${logo}${text(data.shop, 0.29, 30)}${text(data.title, 0.43, 54)}${text(data.discount, 0.55, 65)}${text(data.service, 0.65, 28)}${text(data.validity ? `VALID UNTIL ${data.validity}` : "", 0.73, 23)}${text(data.phone, 0.79, 22)}${text(data.link, 0.84, 20)}${data.qr ? text("▦  QR placeholder", 0.9, 22) : ""}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const anchorElement = document.createElement("a");
  anchorElement.href = url;
  anchorElement.download = `nexora-${format.toLowerCase().replace(/\s+/g, "-")}-mockup.svg`;
  anchorElement.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
