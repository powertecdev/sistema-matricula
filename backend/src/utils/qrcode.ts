import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

export function generateShortCode(uuid: string): string {
  return uuid.replace(/-/g, "").substring(0, 8).toUpperCase();
}

export async function generateBarcodeDataURL(data: string): Promise<string> {
  const shortCode = generateShortCode(data);
  const canvas = createCanvas(400, 150);
  JsBarcode(canvas, shortCode, {
    format: "CODE128",
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 16,
    margin: 10,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return canvas.toDataURL("image/png");
}