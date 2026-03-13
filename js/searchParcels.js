export async function createRegularParcelSearch({
  searchEl,
  regularParcelLayer,
  mapView,
  parcelsTable,
  SearchSourceClass,
  GraphicClass
}) {
  if (!regularParcelLayer) return;

  const selectedObjectIds = new Set(); // Track selected parcels by OBJECTID
  let highlightHandle = null;

  // ---- Shared logic to update highlight & table
  async function updateSelection() {
    const layerView = await mapView.whenLayerView(regularParcelLayer);

    // Remove previous highlight
    if (highlightHandle) highlightHandle.remove();

    if (selectedObjectIds.size > 0) {
      const objectIds = Array.from(selectedObjectIds);
      highlightHandle = layerView.highlight(objectIds);
    }

    // Update feature table filter
    if (parcelsTable) {
      await parcelsTable.componentOnReady();
      if (selectedObjectIds.size === 0) {
        parcelsTable.definitionExpression = "1=1"; // show all
      } else {
        const whereClause = await buildNameWhereClause();
        parcelsTable.definitionExpression = whereClause;
      }
    }
  }

  // Build Name-based where clause
  async function buildNameWhereClause() {
    const allFeatures = await regularParcelLayer.queryFeatures({
      objectIds: Array.from(selectedObjectIds),
      outFields: ["Name"],
      returnGeometry: false
    });
    const names = allFeatures.features.map(f => f.attributes.Name.replace(/'/g, "''"));
    return names.length ? `Name IN ('${names.join("','")}')` : "1=1";
  }

  // ---- Search source
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

  // ---- Search selection (single-select)
  searchEl.addEventListener("arcgisSearchComplete", async (evt) => {
    const result = evt.detail?.results?.[0]?.results?.[0];
    if (!result || !result.feature) return;

    const feature = result.feature;

    // Replace selection
    selectedObjectIds.clear();
    selectedObjectIds.add(feature.attributes.OBJECTID);

    await updateSelection();
    await mapView.goTo({ target: feature.geometry.extent.expand(2) });
  });

  // ---- Map click selection (multi-select toggle)
  mapView.on("click", async (evt) => {
    try {
      const hit = await mapView.hitTest(evt);
      const parcelResult = hit.results.find(r => r.graphic && r.graphic.layer === regularParcelLayer);
      if (!parcelResult) return;

      const feature = parcelResult.graphic;
      const oid = feature.attributes.OBJECTID;

      if (selectedObjectIds.has(oid)) {
        selectedObjectIds.delete(oid);
      } else {
        selectedObjectIds.add(oid);
      }

      await updateSelection();
    } catch (err) {
      console.error("Error handling parcel click:", err);
    }
  });

  // ---- Feature table clear selection button handler
  parcelsTable.addEventListener("selection-change", async () => {
    if (parcelsTable.selectionManager?.count === 0) {
      // Clear internal selection and map highlights
      selectedObjectIds.clear();
      if (highlightHandle) highlightHandle.remove();
      await updateSelection();
    }
  });
}