// main.js

// Load ArcGIS classes once
const [
  Graphic,
  SearchSource,
  reactiveUtils
] = await $arcgis.import([
  "@arcgis/core/Graphic.js",
  "@arcgis/core/widgets/Search/SearchSource.js",
  "@arcgis/core/core/reactiveUtils.js"
]);

// App modules
import { initMap } from "./mapSetup.js";
import { createParcelSearch } from "./searchParcels.js";
import {
  populateComboboxGroup,
  attachSelectAllLogic,
  attachSelectionListLogic
} from "./combobox.js";
import { attachParcelSelectionListener } from "./queryMap.js";

(async function () {

  /* --------------------------------------------------
   * Initialize map + view
   * -------------------------------------------------- */
  const mapEl = document.getElementById("map");
  const { map, view, parcelLayer } = await initMap(mapEl);

  /* --------------------------------------------------
   * Parcel search
   * -------------------------------------------------- */
  const searchEl = document.getElementById("search");
  createParcelSearch({
    searchEl,
    parcelLayer,
    view,
    SearchSourceClass: SearchSource,
    GraphicClass: Graphic
  });

  /* --------------------------------------------------
   * Populate combobox groups
   * -------------------------------------------------- */
  await populateComboboxGroup({
    map,
    layerTitle: "CID",
    fieldName: "Name",
    groupId: "cid-names",
    valuePrefix: "CID"
  });

  await populateComboboxGroup({
    map,
    layerTitle: "TDD",
    fieldName: "Name",
    groupId: "tdd-names",
    valuePrefix: "TDD"
  });

  await populateComboboxGroup({
    map,
    layerTitle: "TIF Projects",
    fieldName: "Name",
    groupId: "tifproj-names",
    valuePrefix: "TIF_PROJECT"
  });

  await populateComboboxGroup({
    map,
    layerTitle: "TIF Plan District",
    fieldName: "Name",
    groupId: "tifplan-names",
    valuePrefix: "TIF_PLAN"
  });

  /* --------------------------------------------------
   * Combobox behavior
   * -------------------------------------------------- */
  const combobox = document.getElementById("fieldBox");
  const selectionList = document.getElementById("selectionList");

  attachSelectAllLogic(combobox);
  attachSelectionListLogic(combobox, selectionList);

  // THIS replaces all old FeatureTable filtering logic
  attachParcelSelectionListener({
    combobox,
    parcelLayer,
    view
  });

  /* --------------------------------------------------
   * Optional: clear filters when layer visibility changes
   * -------------------------------------------------- */
  reactiveUtils.watch(
    () => parcelLayer.visible,
    (visible) => {
      if (!visible) {
        parcelLayer.definitionExpression = "1=1";
      }
    }
  );

  /* --------------------------------------------------
   * Functions dialog
   * -------------------------------------------------- */
  const functionsButton = document.getElementById("functionsButton");
  const functionsDialog = document.getElementById("functionsDialog");

  functionsButton.addEventListener("click", () => {
    functionsDialog.open = true;
  });

})();
