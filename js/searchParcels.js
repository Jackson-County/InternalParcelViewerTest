// searchParcels.js
export async function createRegularParcelSearch({
  searchEl,
  regularParcelLayer,
  mapView,
  parcelsTable,
  SearchSourceClass,
  GraphicClass
}) {
  if (!regularParcelLayer) return;

  // ---- Create the search source
  const regularSearchSource = new SearchSourceClass({
    name: "Parcels",
    placeholder: "Search Parcel (Name)",

    getSuggestions: async (params) => {
      const term = (params.suggestTerm || "").replace(/'/g, "''");
      const res = await regularParcelLayer.queryFeatures({
        where: `UPPER(Name) LIKE UPPER('%${term}%')`,
        outFields: ["OBJECTID", "Name"],
        returnGeometry: false
      });

      return res.features.map(f => ({
        key: f.attributes.OBJECTID,
        text: f.attributes.Name,
        sourceIndex: params.sourceIndex
      }));
    },

    getResults: async (params) => {
      const oid = params?.suggestResult?.key;
      if (oid == null) return [];
      const res = await regularParcelLayer.queryFeatures({
        where: `OBJECTID = ${oid}`,
        outFields: ["*"],
        returnGeometry: true
      });

      return res.features.map(f => ({
        name: f.attributes.Name,
        feature: f
      }));
    }
  });

  searchEl.sources = [regularSearchSource];

  // ---- Event listener for search completion
  searchEl.addEventListener("arcgisSearchComplete", async (evt) => {
    const result = evt.detail?.results?.[0]?.results?.[0];
    if (!result) return;

    const feature = result.feature;
    if (!feature) return;

   // Zoom to feature
    await mapView.goTo({ target: feature.geometry.extent.expand(2) });

    // Highlight on map
    const layerView = await mapView.whenLayerView(regularParcelLayer);
    layerView.highlight(feature);

    // Filter table using definitionExpression
    if (parcelsTable) {
      await parcelsTable.componentOnReady();

      // Use the Name field as the filter
      parcelsTable.definitionExpression = `Name = '${feature.attributes.Name.replace(/'/g, "''")}'`;
    }
  });
}