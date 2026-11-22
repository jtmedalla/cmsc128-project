import { describe, expect, it } from 'vitest';
import { basemapPaint } from './map-palette';

describe('basemapPaint', () => {
  it('recolors a layer for the theme', () => {
    expect(basemapPaint({ id: 'water', type: 'fill' }, 'dark')).toEqual({
      'fill-color': '#132544',
    });
  });

  it('drops properties the layer type does not take', () => {
    expect(
      basemapPaint({ id: 'waterway_line_label', type: 'symbol' }, 'light'),
    ).toEqual({ 'text-color': '#4d6190', 'text-halo-color': '#ffffff' });
    expect(basemapPaint({ id: 'building', type: 'line' }, 'light')).toEqual({});
  });

  it('leaves unknown layers as styled', () => {
    expect(
      basemapPaint({ id: 'road_one_way_arrow', type: 'symbol' }, 'light'),
    ).toBeNull();
  });
});
