export function terrainHeight(x: number, z: number) {
  const centralPlateau = 1.2 * Math.exp(-(x * x + z * z) / 90000);
  const engineeringRise = 0.75 * Math.exp(-((x - 205) ** 2 + (z + 55) ** 2) / 36000);
  const libraryRise = 0.55 * Math.exp(-((x + 160) ** 2 + (z + 95) ** 2) / 42000);
  const carsaLow = -1.1 * Math.exp(-((x - 170) ** 2 + (z - 185) ** 2) / 42000);
  const mysticVale = -2.8 * Math.exp(-((x - 30) ** 2) / 90000) * Math.exp(-((z - 355) ** 2) / 9000);
  const bowkerCreek = -0.9 * Math.exp(-((x + 310) ** 2) / 8000) * Math.exp(-((z - 20) ** 2) / 85000);
  const campusMask = 1 - 0.58 * Math.exp(-(x * x + z * z) / 64000);
  const roll =
    0.55 * Math.sin(x / 78) * Math.cos(z / 92) +
    0.34 * Math.sin((x + z) / 58) +
    0.22 * Math.cos((x - z) / 33);
  const fineNoise =
    0.26 * Math.sin(x / 17 + Math.sin(z / 44) * 1.8) * Math.cos(z / 21) +
    0.18 * Math.sin((x * 0.73 - z * 1.17) / 26) +
    0.09 * Math.sin(x / 8.5 + z / 11.5) * Math.cos((x - z) / 14);
  return -1.58 + centralPlateau + engineeringRise + libraryRise + carsaLow + mysticVale + bowkerCreek + roll + fineNoise * campusMask;
}
