export async function initMap(mapEl, layerTitle = "Parcels") {
  await mapEl.viewOnReady();
  const view = mapEl.view;
  const map = view.map;

  await view.when();
  await map.when();

  // Find the specified layer
  const parcelLayer = map.allLayers.find(l => l.title === layerTitle);
  if (!parcelLayer) throw new Error(`Layer not found: ${layerTitle}`);
  await parcelLayer.load();

  return { map, view, parcelLayer };
}