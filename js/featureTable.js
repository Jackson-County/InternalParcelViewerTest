export function createFeatureTable({ view, layer, containerId, FeatureTableClass }) {
  return new FeatureTableClass({
    view,
    layer,
    tableTemplate: {
      columnTemplates: [
        { type: "field", fieldName: "Name", label: "Name" },
        { type: "field", fieldName: "CID", label: "CID" },
        { type: "field", fieldName: "TDD", label: "TDD" },
        { type: "field", fieldName: "TIFproject", label: "TIF Project" },
        { type: "field", fieldName: "TIFdistrict", label: "TIF Plan District" }
      ]
    },
    container: containerId,
    visibleElements: {
    menuItems: false,
     selectionColumn: true
    },
    editingEnabled: false
  });
}
