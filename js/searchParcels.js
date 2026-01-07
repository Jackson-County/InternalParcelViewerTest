export function createParcelSearch({ searchEl, parcelLayer, view, SearchSourceClass, GraphicClass }) {
  const parcelSearchSource = new SearchSourceClass({
    placeholder: "Search Parcels by Name",
    getSuggestions: async (params) => {
      const res = await parcelLayer.queryFeatures({
        where: `UPPER(Name) LIKE UPPER('%${params.suggestTerm.replace(/'/g, "''")}%')`,
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
      const where = params.suggestResult?.key
        ? `OBJECTID = ${params.suggestResult.key}`
        : `UPPER(Name) LIKE UPPER('%${params.searchTerm.replace(/'/g, "''")}%')`;

      const res = await parcelLayer.queryFeatures({
        where,
        outFields: ["OBJECTID", "Name"],
        returnGeometry: true
      });

      return res.features.map(f => ({
        name: f.attributes.Name,
        feature: f
      }));
    }
  });

  searchEl.sources = [parcelSearchSource];

  searchEl.addEventListener("arcgisSearchComplete", async (evt) => {
    const result = evt.detail?.results?.[0]?.results?.[0];
    if (!result) return;

    const feature = result.feature;
    view.graphics.removeAll();
    view.graphics.add(new GraphicClass({
      geometry: feature.geometry,
      symbol: {
        type: "simple-fill",
        color: [0, 255, 255, 0.4],
        outline: { color: [0, 255, 255], width: 2 }
      }
    }));

    await view.goTo(feature.geometry.extent.expand(2));
  });
}
