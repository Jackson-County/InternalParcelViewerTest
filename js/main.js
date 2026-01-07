// Load ArcGIS classes once here
const [
  Graphic,
  FeatureLayer,
  FeatureTable,
  FeatureTableVM,
  SearchSource,
  FeatureFilter,
  reactiveUtils
] = await $arcgis.import([
  "@arcgis/core/Graphic.js",
  "@arcgis/core/layers/FeatureLayer.js",
  "@arcgis/core/widgets/FeatureTable.js",
  "@arcgis/core/widgets/FeatureTable/FeatureTableViewModel.js",
  "@arcgis/core/widgets/Search/SearchSource.js",
  "@arcgis/core/layers/support/FeatureFilter.js",
  "@arcgis/core/core/reactiveUtils.js"
]);

import { initMap } from "./mapSetup.js";
import { createFeatureTable } from "./featureTable.js";
import { createParcelSearch } from "./searchParcels.js";
import { populateComboboxGroup, attachSelectAllLogic, attachSelectionListLogic } from "./combobox.js";
import { attachQueryTableListener } from "./queryTable.js";

(async function() {
  const mapEl = document.getElementById("map");
  const { map, view, parcelLayer } = await initMap(mapEl);

  // Pass ArcGIS classes into your modules
  const featureTable = createFeatureTable({
    view,
    layer: parcelLayer,
    containerId: "parcelsTable",
    FeatureTableClass: FeatureTable
  });

  const searchEl = document.getElementById("search");
  createParcelSearch({
    searchEl,
    parcelLayer,
    view,
    SearchSourceClass: SearchSource,
    GraphicClass: Graphic
  });

  // Combobox logic
  await populateComboboxGroup({ map, layerTitle: "CID", fieldName: "Name", groupId: "cid-names", valuePrefix: "CID" });
  await populateComboboxGroup({ map, layerTitle: "TDD", fieldName: "Name", groupId: "tdd-names", valuePrefix: "TDD" });
  await populateComboboxGroup({ map, layerTitle: "TIF Projects", fieldName: "Name", groupId: "tifproj-names", valuePrefix: "TIF_PROJECT" });
  await populateComboboxGroup({ map, layerTitle: "TIF Plan District", fieldName: "Name", groupId: "tifplan-names", valuePrefix: "TIF_PLAN" });

  const combobox = document.getElementById("fieldBox");
  const selectionList = document.getElementById("selectionList");
  attachSelectAllLogic(combobox);
  attachSelectionListLogic(combobox, selectionList);
  attachQueryTableListener(combobox, featureTable);

  const functionsButton = document.getElementById("functionsButton");
  const functionsDialog = document.getElementById("functionsDialog");
  functionsButton.addEventListener("click", () => { functionsDialog.open = true; });
})();
