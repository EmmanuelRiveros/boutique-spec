/** Clave de comparación de un color: sin mayúsculas, acentos ni espacios sobrantes. */
export function toColorKey(color: string): string {
  return color
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
