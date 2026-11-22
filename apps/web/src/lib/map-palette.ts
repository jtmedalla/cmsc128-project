/**
 * MIGO's colors for OpenFreeMap's Liberty base map, per theme. Liberty's warm
 * yellows and oranges compete with the severity pins, so the ground, roads and
 * buildings use the app's cool neutrals (index.css) and the pins stay the only
 * strong color. Water, greenery and hospitals keep a muted tint so they still read.
 *
 * Each rule matches layer IDs; the first match wins. Every rule sets the same
 * properties in both themes, so switching themes just applies the other column.
 */

import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

type Theme = 'light' | 'dark';
type Paint = Record<string, string>;
type Rule = { match: RegExp; light: Paint; dark: Paint };

const RULES: Rule[] = [
  {
    match: /^background$/,
    light: { 'background-color': '#f4f5f8' },
    dark: { 'background-color': '#0e1322' },
  },
  // Greenery, kept muted so it doesn't read as a severity color.
  {
    match: /^park$/,
    light: { 'fill-color': '#e1ebdc', 'fill-outline-color': '#c9dabe' },
    dark: { 'fill-color': '#15241f', 'fill-outline-color': '#1d3129' },
  },
  {
    match: /^park_outline$/,
    light: { 'line-color': '#c9dabe' },
    dark: { 'line-color': '#1d3129' },
  },
  {
    match: /^(landcover_(wood|grass|wetland)|landuse_(pitch|track|cemetery))$/,
    light: { 'fill-color': '#dde8d6' },
    dark: { 'fill-color': '#14221d' },
  },
  // Hospitals stay tinted: responders look for them.
  {
    match: /^landuse_hospital$/,
    light: { 'fill-color': '#f5e1e4' },
    dark: { 'fill-color': '#2a1b26' },
  },
  {
    match: /^(landuse_(residential|school)|landcover_(sand|ice)|aeroway_fill)$/,
    light: { 'fill-color': '#eceef3' },
    dark: { 'fill-color': '#121829' },
  },
  {
    match: /^aeroway_(runway|taxiway)$/,
    light: { 'line-color': '#e3e6ed' },
    dark: { 'line-color': '#1c2338' },
  },
  {
    match: /^water$/,
    light: { 'fill-color': '#bfd3ea' },
    dark: { 'fill-color': '#132544' },
  },
  {
    match: /^waterway_(river|tunnel|other)$/,
    light: { 'line-color': '#a9c3e2' },
    dark: { 'line-color': '#1a3154' },
  },
  // Roads: casings first, then major roads a step darker than minor ones.
  {
    match: /_casing$/,
    light: { 'line-color': '#d5dae4' },
    dark: { 'line-color': '#0b0f1c' },
  },
  {
    match: /_(link|secondary_tertiary|trunk_primary|motorway|motorway_link)$/,
    light: { 'line-color': '#ffffff' },
    dark: { 'line-color': '#3b4666' },
  },
  {
    match: /_(minor|service_track|street|path_pedestrian)$/,
    light: { 'line-color': '#ffffff' },
    dark: { 'line-color': '#262e45' },
  },
  {
    match: /_rail(_hatching)?$/,
    light: { 'line-color': '#c3c9d6' },
    dark: { 'line-color': '#2f3852' },
  },
  {
    match: /^building$/,
    light: { 'fill-color': '#e3e6ed', 'fill-outline-color': '#d5dae4' },
    dark: { 'fill-color': '#1c2338', 'fill-outline-color': '#262e45' },
  },
  {
    match: /^building-3d$/,
    light: { 'fill-extrusion-color': '#e3e6ed' },
    dark: { 'fill-extrusion-color': '#232b43' },
  },
  {
    match: /^boundary_/,
    light: { 'line-color': '#9eabc9' },
    dark: { 'line-color': '#4d6190' },
  },
  // Labels: places in the foreground color, the rest muted.
  {
    match: /^label_/,
    light: { 'text-color': '#111729', 'text-halo-color': '#ffffff' },
    dark: { 'text-color': '#f4f5f8', 'text-halo-color': '#0e1322' },
  },
  {
    match: /^(water_name_|waterway_line_label)/,
    light: { 'text-color': '#4d6190', 'text-halo-color': '#ffffff' },
    dark: { 'text-color': '#7083ab', 'text-halo-color': '#0e1322' },
  },
  {
    match: /^(poi_|airport|highway-name-)/,
    light: { 'text-color': '#5a6378', 'text-halo-color': '#ffffff' },
    dark: { 'text-color': '#9aa3b8', 'text-halo-color': '#0e1322' },
  },
];

/** Paint properties a layer type takes: `fill-*` for fill, `text-*` for symbol, and so on. */
function prefixOf(type: string) {
  return type === 'symbol' ? 'text-' : `${type}-`;
}

/**
 * The paint to set on one base map layer in `theme`, or null to leave it as
 * styled. Properties that don't fit the layer's type are dropped, since
 * MapLibre throws on them.
 */
export function basemapPaint(
  layer: { id: string; type: string },
  theme: Theme,
): Paint | null {
  const paint = RULES.find((rule) => rule.match.test(layer.id))?.[theme];
  if (!paint) return null;
  const prefix = prefixOf(layer.type);
  return Object.fromEntries(
    Object.entries(paint).filter(
      ([property]) =>
        property.startsWith(prefix) &&
        // `fill-*` would otherwise match fill-extrusion properties.
        (layer.type !== 'fill' || !property.startsWith('fill-extrusion-')),
    ),
  );
}

/** A copy of `style` with every layer's paint recolored for `theme`. */
export function paintStyle(
  style: StyleSpecification,
  theme: Theme,
): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const paint = basemapPaint(layer, theme);
      return paint
        ? ({
            ...layer,
            paint: { ...layer.paint, ...paint },
          } as LayerSpecification)
        : layer;
    }),
  };
}
