export type MapRegion = "world" | "europe" | "us" | "asia";

export interface MapPin {
  id: string;
  name: string;
  x: number;
  y: number;
  clickPrompt: string;
}

export interface MapWidget {
  widget: "map";
  version: "1.0";
  title: string;
  caption?: string;
  region: MapRegion;
  pins: MapPin[];
  routeIds?: string[];
}
