import { posterDimensions } from "./posterUtils";
import type { CSSProperties } from "react";

export interface PosterData {
  shop: string;
  title: string;
  discount: string;
  service: string;
  validity: string;
  phone: string;
  link: string;
  logo: string;
  align: string;
  qr: boolean;
  template: string;
  background?: string;
  foreground?: string;
}
export function PosterPreview({
  data,
  format,
}: {
  data: PosterData;
  format: string;
}) {
  const [width, height] = posterDimensions(format);
  const style: CSSProperties = {
    textAlign: data.align as CSSProperties["textAlign"],
    aspectRatio: `${width}/${height}`,
    width: `min(100%, ${Math.round((550 * width) / height)}px)`,
  };
  if (data.background) style.background = data.background;
  if (data.foreground) style.color = data.foreground;
  return (
    <div
      className={`m-poster template-${data.template.toLowerCase()}`}
      style={style}
    >
      <div className="m-poster-inner">
        {data.logo && <img src={data.logo} alt="Shop logo" />}
        <span className="poster-kicker">{data.shop || "YOUR SALON"}</span>
        <div className="poster-line" />
        <p>A LITTLE SOMETHING FOR YOU</p>
        <h2>{data.title || "Your next favorite look"}</h2>
        <strong>{data.discount || "SPECIAL OFFER"}</strong>
        <p>{data.service || "YOUR FAVORITE SERVICES"}</p>
        <small>
          {data.validity && `VALID UNTIL ${data.validity}`}
          <br />
          {data.phone}
          <br />
          {data.link}
        </small>
        {data.qr && (
          <div className="m-qr">
            ▦<small>QR placeholder</small>
          </div>
        )}
      </div>
    </div>
  );
}
