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

function hasActiveSelection(combobox) {
  return Array.from(combobox.selectedItems).some(
    item => !item.value.startsWith("select-all-")
  );
}

export function attachQueryTableListener(combobox, featureTable, parcelLayer) {
  combobox.addEventListener("calciteComboboxChange", async () => {

    if (!hasActiveSelection(combobox)) {
      featureTable.highlightIds.removeAll();
      featureTable._allSelectedObjectIds = [];
      featureTable.definitionExpression = "1=1";
      return;
    }

    const whereClause = buildComboboxWhereClause(combobox);
    featureTable.definitionExpression = whereClause;

    try {

      const query = parcelLayer.createQuery();
      query.where = whereClause;
      query.returnGeometry = false;

      const allObjectIds = await parcelLayer.queryObjectIds(query);

      featureTable.highlightIds.removeAll();

      const visibleIds = allObjectIds.slice(0, parcelLayer.maxRecordCount);
      featureTable.highlightIds.addMany(visibleIds);

      featureTable._allSelectedObjectIds = allObjectIds;

    } catch (err) {
      console.error("Failed to select features:", err);
    }
  });
}
