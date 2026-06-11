// generic.tsx — renders all BUILDINGS entries that have no custom special component
import { gps, BUILDINGS } from "./geo";
import { BuildingShell } from "./primitives";

const SKIP = new Set([
  "McPherson Library", "Mearns Centre (Library wing)",
  "Clearihue Bldg — North wing", "Clearihue Bldg — South wing", "Clearihue Bldg — West wing",
  "David Turpin Bldg", "Elliott Bldg", "Bob Wright Centre",
  "Engineering ECS", "Engineering EOW", "Engineering ELW",
  "CARSA", "CARSA Parkade",
  "McKinnon Bldg", "Ian Stewart Complex",
  "Jamie Cassels Centre", "Student Union Bldg",
  "First Peoples House", "Phoenix Theatre",
  "Čeqʷəŋín (Cheko'nien) House", "Sŋéqə (Sngequ) House",
]);

export function GenericBuildings() {
  return (
    <>
      {BUILDINGS.filter(b => !SKIP.has(b.name)).map((b, i) => {
        const [cx, cz] = gps(b.lat, b.lon);
        return (
          <BuildingShell
            key={i}
            cx={cx} cz={cz}
            fw={b.fw} fd={b.fd}
            floors={b.floors} flH={b.flH}
            color={b.color} roofColor={b.roofColor}
            winColor={b.winColor}
          />
        );
      })}
    </>
  );
}
