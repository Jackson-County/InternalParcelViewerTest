// queryTable.js
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

export function attachQueryTableListener(combobox, featureTable) {
  combobox.addEventListener("calciteComboboxChange", () => {
    const whereClause = buildComboboxWhereClause(combobox);
    featureTable.viewModel.definitionExpression = whereClause;
  });
}
