export const groupFieldMap = {
  "CID": "CID",
  "TDD": "TDD",
  "TIF Projects": "TIFproject",
  "TIF Plan District": "TIFdistrict"
};


export function buildComboboxWhereClause(combobox) {
  const selectedItems = Array.from(combobox.selectedItems);
  const groupedSelections = {};

  selectedItems.forEach(item => {
    if (item.value.startsWith("select-all-")) return;
    const parentGroup = item.closest("calcite-combobox-item-group");
    const groupKey = parentGroup?.label || parentGroup?.id || "Ungrouped";
    if (!groupedSelections[groupKey]) groupedSelections[groupKey] = [];
    groupedSelections[groupKey].push(item.value.split(":")[1]);
  });

  const clauses = [];
  Object.entries(groupedSelections).forEach(([groupName, values]) => {
    const field = groupFieldMap[groupName];
    if (!field || values.length === 0) return;
    const formattedValues = values.map(v => `'${v.replace(/'/g,"''")}'`).join(", ");
    clauses.push(`${field} IN (${formattedValues})`);
  });

  return clauses.length ? clauses.join(" OR ") : "1=1";
}

export function attachParcelSelectionListener({
  combobox,
  parcelLayer,
  view
}) {
  let highlightHandle = null;

  combobox.addEventListener("calciteComboboxChange", async () => {
    const whereClause = buildComboboxWhereClause(combobox);

    // 1️⃣ Apply attribute filter to the Parcels layer
    parcelLayer.definitionExpression = whereClause;

    // Clear previous highlight
    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }

    // If nothing selected, bail early
    if (whereClause === "1=1") {
      return;
    }

    try {
      // 2️⃣ Query matching parcels (OBJECTIDs only)
      const query = parcelLayer.createQuery();
      query.where = whereClause;
      query.returnGeometry = false;

      const objectIds = await parcelLayer.queryObjectIds(query);

      if (!objectIds || objectIds.length === 0) return;

      // 3️⃣ Highlight on the map (fast, GPU-based)
      const layerView = await view.whenLayerView(parcelLayer);
      highlightHandle = layerView.highlight(objectIds);

      // Optional: zoom to selection if reasonable
      if (objectIds.length < 2000) {
        const extentQuery = parcelLayer.createQuery();
        extentQuery.where = whereClause;
        extentQuery.returnGeometry = true;
        extentQuery.outFields = [];

        const result = await parcelLayer.queryExtent(extentQuery);
        if (result?.extent) {
          view.goTo(result.extent.expand(1.2), { animate: true });
        }
      }

    } catch (err) {
      console.error("Parcel selection failed:", err);
    }
  });
}