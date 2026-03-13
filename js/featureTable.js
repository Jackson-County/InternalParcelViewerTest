export async function createFeatureTable({ view, layer, containerId }) {

  const table = document.getElementById(containerId);

  await table.componentOnReady();

  table.view = view;
  table.layer = layer;

  table.tableTemplate = {
    columnTemplates: [
      { type: "field", fieldName: "Name", label: "Name" },
      { type: "field", fieldName: "CID", label: "CID" },
      { type: "field", fieldName: "TDD", label: "TDD" },
      { type: "field", fieldName: "TIFproject", label: "TIF Project" },
      { type: "field", fieldName: "TIFdistrict", label: "TIF Plan District" }
    ]
  };

  table.visibleElements = {
    menuItems: false,
    selectionColumn: true
  };

  table.editingEnabled = false;

  return table;
}
