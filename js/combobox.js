// combobox.js
export async function populateComboboxGroup({ map, layerTitle, fieldName, groupId, valuePrefix }) {
  const layer = map.allLayers.find(l => l.title === layerTitle);
  if (!layer) {
    console.warn(`Layer not found: ${layerTitle}`);
    return;
  }
  await layer.load();

  const query = layer.createQuery();
  query.outFields = [fieldName];
  query.returnDistinctValues = true;
  query.where = "1=1";

  const { features } = await layer.queryFeatures(query);
  const values = features.map(f => f.attributes[fieldName])
                         .filter(v => v != null)
                         .sort((a,b)=>a.localeCompare(b));

  const groupEl = document.getElementById(groupId);
  values.forEach(value => {
    const item = document.createElement("calcite-combobox-item");
    item.value = `${valuePrefix}:${value}`;
    item.textLabel = value;
    groupEl.appendChild(item);
  });
}

// Handles select-all toggle logic for combobox
export function attachSelectAllLogic(combobox) {
  let prevSelectedValues = new Set();

  combobox.addEventListener("calciteComboboxChange", (event) => {
    const currentSelectedValues = new Set(event.target.selectedItems.map(item => item.value));

    combobox.querySelectorAll("calcite-combobox-item[value^='select-all-']").forEach(selectAllItem => {
      const targetGroupId = selectAllItem.getAttribute("data-target-group");
      if (!targetGroupId) return;

      const group = combobox.querySelector(`#${targetGroupId}`);
      if (!group) return;

      const wasSelected = prevSelectedValues.has(selectAllItem.value);
      const isSelected = currentSelectedValues.has(selectAllItem.value);

      if (wasSelected !== isSelected) {
        group.querySelectorAll("calcite-combobox-item").forEach(groupItem => {
          groupItem.selected = isSelected;
        });
      }
    });

    prevSelectedValues = currentSelectedValues;
  });
}

// Displays selected items in a div list
export function attachSelectionListLogic(combobox, selectionList) {
  combobox.addEventListener("calciteComboboxChange", (event) => {
    const selectedItems = Array.from(event.target.selectedItems);
    selectionList.innerHTML = "";

    const groupedSelections = {};
    selectedItems.forEach(item => {
      if (item.value.startsWith("select-all-")) return;
      const parentGroup = item.closest("calcite-combobox-item-group");
      const groupKey = parentGroup?.label || parentGroup?.id || "Ungrouped";
      if (!groupedSelections[groupKey]) groupedSelections[groupKey] = [];
      groupedSelections[groupKey].push(item.value.split(":")[1]);
    });

    Object.entries(groupedSelections).forEach(([groupName, items]) => {
      const header = document.createElement("div");
      header.textContent = groupName;
      header.style.fontWeight = "bold";
      header.style.marginTop = "5px";
      selectionList.appendChild(header);

      items.forEach(text => {
        const listItem = document.createElement("div");
        listItem.textContent = text;
        listItem.style.marginLeft = "15px";
        selectionList.appendChild(listItem);
      });
    });
  });
}
