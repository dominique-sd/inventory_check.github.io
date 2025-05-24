document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("json-file-input");
  const loadFileBtn = document.getElementById("load-file-btn");
  const loadStatus = document.getElementById("load-status");

  const initialSectionsWrapper = document.getElementById(
    "initial-sections-wrapper",
  );
  const fileInputSection = document.getElementById("file-input-section");
  const confirmLoadSection = document.getElementById("confirm-load-section");
  const confirmNewInventorySection = document.getElementById(
    "confirm-new-inventory-section",
  );
  const confirmSavedChecklistSection = document.getElementById(
    "confirm-saved-checklist-section",
  );
  const utilizzoFilters = document.getElementById("utilizzo-filters");
  const confirmLoadNewBtn = document.getElementById("confirm-load-new-btn");
  const confirmLoadSavedBtn = document.getElementById("confirm-load-saved-btn");

  const savedOriginalFiltersSpan = document.getElementById(
    "saved-original-filters",
  );
  const savedTotalItemsSpan = document.getElementById("saved-total-items");
  const savedCheckedItemsSpan = document.getElementById("saved-checked-items");
  const savedRemainingItemsSpan = document.getElementById(
    "saved-remaining-items",
  );

  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sidebarMenu = document.getElementById("sidebar-menu");
  const sidebarTotalElementsSpan = document.getElementById(
    "sidebar-total-elements",
  );
  const sidebarFilteredElementsSpan = document.getElementById(
    "sidebar-filtered-elements",
  );
  const sidebarCheckedElementsSpan = document.getElementById(
    "sidebar-checked-elements",
  );
  const sidebarRemainingElementsSpan = document.getElementById(
    "sidebar-remaining-elements",
  );
  const sidebarInventoryUtilizzoCounters = document.getElementById(
    "sidebar-inventory-utilizzo-counters",
  );
  const sidebarCategoryFiltersContainer = document.getElementById(
    "sidebar-category-filters",
  );
  const sidebarControlsContainer = document.getElementById("sidebar-controls");

  const filterCheckboxes = document.querySelectorAll(
    'input[name="utilizzo-filter"]',
  );

  const mainContent = document.getElementById("main-content");
  const checklistContainerWrapper = document.getElementById(
    "checklist-container-wrapper",
  );
  const checklistContainer = document.getElementById("checklist-container");
  const allItemsCheckedMessage = document.getElementById(
    "all-items-checked-message",
  );

  const expandAllBtn = document.getElementById("expand-all-btn");
  const collapseAllBtn = document.getElementById("collapse-all-btn");
  const showCheckedBtn = document.getElementById("show-checked-btn");
  const exportChecklistBtn = document.getElementById("export-checklist-btn");

  const checkedItemsOverlay = document.getElementById("checked-items-overlay");
  const checkedItemsList = document.getElementById("checked-items-list");
  const clearAllCheckedBtn = document.getElementById("clear-all-checked-btn");

  let fullInventoryData = null;
  let currentChecklistState = {};
  let tempLoadedData = null;
  let hasUnsavedChanges = false;
  let currentActiveCategoryFilter = null;

  const CATEGORY_ORDER = [
    "Corpi macchina",
    "Obiettivi e filtri",
    "Batterie e alimentazione",
    "Accessori e supporti",
    "Storage",
    "Audio",
    "Monitor",
    "Luci",
    "Borse",
    "Altro",
  ];

  const UTILIZZO_COLORS = {
    Attivo: "#007c35",
    "In uso": "#756209",
    Archiviato: "#6a1616",
    Default: "#bdc3c7",
  };
  const CATEGORY_COLORS = {
    "Corpi macchina": "#337ea980",
    "Obiettivi e filtri": "#a85bf257",
    "Batterie e alimentazione": "#b8654373",
    "Accessori e supporti": "#e97e2373",
    Storage: "#2d996480",
    Audio: "#fab14380",
    Monitor: "#ffffff21",
    Luci: "#dc4c9166",
    Borse: "#de555373",
    Altro: "#ffffff18",
    Default: "#95a5a6",
  };

  sidebarControlsContainer.appendChild(expandAllBtn);
  expandAllBtn.innerHTML = `<img src="icons/expand.svg" alt="Espandi" class="btn-icon"/>`;
  expandAllBtn.addEventListener("click", () => toggleAll(true));

  sidebarControlsContainer.appendChild(collapseAllBtn);
  collapseAllBtn.innerHTML = `<img src="icons/collapse.svg" alt="Comprimi" class="btn-icon"/>`;
  collapseAllBtn.addEventListener("click", () => toggleAll(false));

  sidebarControlsContainer.appendChild(showCheckedBtn);
  showCheckedBtn.innerHTML = `<img src="icons/check.svg" alt="Spuntati" class="btn-icon"/>`;

  sidebarControlsContainer.appendChild(exportChecklistBtn);
  exportChecklistBtn.innerHTML = `<img src="icons/export.svg" alt="Esporta" class="btn-icon"/>`;

  hamburgerBtn.addEventListener("click", () => {
    sidebarMenu.classList.toggle("open");
    adjustMainContentMargin();
  });

  function adjustMainContentMargin() {
    const targetMarginLeft = sidebarMenu.classList.contains("open")
      ? "300px"
      : "70px";
    if (
      initialSectionsWrapper &&
      !initialSectionsWrapper.classList.contains("hidden")
    ) {
      initialSectionsWrapper.style.marginLeft = targetMarginLeft;
    }
    if (mainContent && !mainContent.classList.contains("hidden")) {
      mainContent.style.marginLeft = targetMarginLeft;
    }
  }
  adjustMainContentMargin();

  function getFormattedTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
  }

  function createTagElement(text, type, isCountHighlight = false) {
    const tag = document.createElement("span");
    tag.classList.add("item-tag");
    let backgroundColor = CATEGORY_COLORS.Default;
    if (isCountHighlight) {
      tag.classList.add("count-highlight-tag");
      backgroundColor = "#000000";
    } else {
      tag.classList.add(`tag-${type.toLowerCase()}`);
      if (type.toLowerCase() === "category")
        backgroundColor = CATEGORY_COLORS[text] || CATEGORY_COLORS.Default;
      else if (type.toLowerCase() === "utilizzo")
        backgroundColor = UTILIZZO_COLORS[text] || UTILIZZO_COLORS.Default;
    }
    tag.style.backgroundColor = backgroundColor;
    tag.textContent = text;
    tag.style.color = "white";
    return tag;
  }

  function formatItemText(item) {
    let baseText = item.nome;
    const hasTotals = item.totali !== null && item.in_uso !== null;
    let countText = null;

    if (hasTotals) {
      if (item.totali === item.in_uso) {
        baseText = `${item.id}`;
        countText = `${item.totali}`;
      } else {
        baseText =
          item.in_uso === 1 && item.nome_singolare
            ? item.nome_singolare
            : item.id;
        countText = `${item.in_uso}/${item.totali}`;
      }
    } else {
      baseText = item.id;
    }

    const nameAndCountContainer = document.createElement("div");
    nameAndCountContainer.classList.add("name-count-container");

    const itemNameSpan = document.createElement("span");
    itemNameSpan.classList.add("item-name-text");
    itemNameSpan.textContent = baseText;
    nameAndCountContainer.appendChild(itemNameSpan);

    if (countText) {
      nameAndCountContainer.appendChild(createTagElement(countText, "", true));
    }

    const otherTagsContainer = document.createElement("div");
    otherTagsContainer.classList.add("tags-container");

    if (item.categoria) {
      otherTagsContainer.appendChild(
        createTagElement(item.categoria, "category"),
      );
    }
    if (item.utilizzo) {
      otherTagsContainer.appendChild(
        createTagElement(item.utilizzo, "utilizzo"),
      );
    }

    return nameAndCountContainer.outerHTML + otherTagsContainer.outerHTML;
  }

  function sanitizeForDomId(text) {
    if (typeof text !== "string") text = String(text);
    let sanitized = text.replace(/\s+/g, "-");
    let finalSanitized = "";
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (/[a-zA-Z0-9_-]/.test(char)) finalSanitized += char;
      else
        finalSanitized += "_" + char.charCodeAt(0).toString(16).toUpperCase();
    }
    finalSanitized = finalSanitized
      .replace(/-{2,}/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");
    if (!finalSanitized) {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        hash = (hash << 5) - hash + charCode;
        hash |= 0;
      }
      return (
        "id-" +
        Math.abs(hash).toString(36) +
        "_" +
        Math.random().toString(36).substr(2, 3)
      );
    }
    return finalSanitized;
  }

  function generateUniqueId(item, parentSanitizedUniqueId = null) {
    const currentItemSanitizedPart = sanitizeForDomId(item.id);
    return parentSanitizedUniqueId
      ? `${parentSanitizedUniqueId}__${currentItemSanitizedPart}`
      : currentItemSanitizedPart;
  }

  function countAllItemsRecursive(items) {
    return items.reduce(
      (sum, item) =>
        sum + 1 + (item.children ? countAllItemsRecursive(item.children) : 0),
      0,
    );
  }

  function countActuallyFilteredItemsRecursive(
    items,
    selectedUtilizzi,
    activeCategory = null,
  ) {
    let totalFiltered = 0;
    function recursiveCount(itemList) {
      if (!itemList) return;
      itemList.forEach((subItem) => {
        const passesUtilizzo =
          selectedUtilizzi && selectedUtilizzi.length > 0
            ? selectedUtilizzi.includes(subItem.utilizzo)
            : true;
        const passesCategory =
          !activeCategory || subItem.categoria === activeCategory;
        if (passesUtilizzo && passesCategory) {
          totalFiltered++;
        }
        if (subItem.children) {
          recursiveCount(subItem.children);
        }
      });
    }
    recursiveCount(items);
    return totalFiltered;
  }

  function updateCounters() {
    let activeCategoryIsEmpty = false;
    if (!fullInventoryData || !fullInventoryData.inventario) {
      sidebarTotalElementsSpan.textContent = "0";
      sidebarFilteredElementsSpan.textContent = "0";
      sidebarCheckedElementsSpan.textContent = "0";
      sidebarRemainingElementsSpan.textContent = "0";
      activeCategoryIsEmpty = renderCategoryFilters();
      checkIfAllItemsChecked();
      return activeCategoryIsEmpty;
    }
    const totalInvCount = countAllItemsRecursive(fullInventoryData.inventario);
    sidebarTotalElementsSpan.textContent = totalInvCount;

    let currentSelectedUtilizzi =
      currentChecklistState.original_filters ||
      Array.from(filterCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);

    let actualFilteredCount = countActuallyFilteredItemsRecursive(
      fullInventoryData.inventario,
      currentSelectedUtilizzi,
      currentActiveCategoryFilter,
    );
    sidebarFilteredElementsSpan.textContent = actualFilteredCount;

    let visibleCheckedItemsCount = 0;
    Object.values(currentChecklistState).forEach((entry) => {
      if (entry.checked && entry.itemData && !entry.isExceptionallyShown) {
        const itemUtilizzo = entry.itemData.utilizzo;
        const itemCategory = entry.itemData.categoria;

        const passesEffectiveUtilizzo = currentChecklistState.original_filters
          ? currentChecklistState.original_filters.length === 0 ||
            currentChecklistState.original_filters.includes(itemUtilizzo)
          : currentSelectedUtilizzi.length === 0 ||
            currentSelectedUtilizzi.includes(itemUtilizzo);

        const passesCategoryFilter =
          !currentActiveCategoryFilter ||
          itemCategory === currentActiveCategoryFilter;

        if (passesEffectiveUtilizzo && passesCategoryFilter) {
          visibleCheckedItemsCount++;
        }
      }
    });
    sidebarCheckedElementsSpan.textContent = visibleCheckedItemsCount;

    const remainingCount = Math.max(
      0,
      actualFilteredCount - visibleCheckedItemsCount,
    );
    sidebarRemainingElementsSpan.textContent = remainingCount;

    activeCategoryIsEmpty = renderCategoryFilters();
    checkIfAllItemsChecked();
    return activeCategoryIsEmpty;
  }

  function checkIfAllItemsChecked() {
    if (
      !sidebarFilteredElementsSpan ||
      !sidebarRemainingElementsSpan ||
      !checklistContainer ||
      !allItemsCheckedMessage
    )
      return;

    const filteredCount = parseInt(
      sidebarFilteredElementsSpan.textContent || "0",
    );
    const remainingCount = parseInt(
      sidebarRemainingElementsSpan.textContent || "0",
    );

    if (mainContent.classList.contains("hidden")) {
      // If checklist area is not even shown, don't show the message
      checklistContainer.classList.remove("hidden");
      allItemsCheckedMessage.classList.add("hidden");
      return;
    }

    if (filteredCount > 0 && remainingCount === 0) {
      checklistContainer.classList.add("hidden");
      allItemsCheckedMessage.classList.remove("hidden");
    } else {
      checklistContainer.classList.remove("hidden");
      allItemsCheckedMessage.classList.add("hidden");
    }
  }

  function updateUtilizzoCounters(inventory) {
    sidebarInventoryUtilizzoCounters.innerHTML = "";
    if (!inventory || !inventory.length) {
      sidebarInventoryUtilizzoCounters.classList.add("hidden");
      return;
    }
    const counts = { Attivo: 0, "In uso": 0, Archiviato: 0, Sconosciuto: 0 };
    function countRecursive(items) {
      items.forEach((item) => {
        counts[item.utilizzo || "Sconosciuto"] =
          (counts[item.utilizzo || "Sconosciuto"] || 0) + 1;
        if (item.children) countRecursive(item.children);
      });
    }
    countRecursive(inventory);

    const utilizziOrdinati = ["Attivo", "In uso", "Archiviato", "Sconosciuto"];
    let tagsHtml = "";
    utilizziOrdinati.forEach((utilizzo) => {
      if (counts[utilizzo] > 0) {
        tagsHtml += `<span class="utilizzo-count-tag" style="background-color:${UTILIZZO_COLORS[utilizzo] || UTILIZZO_COLORS.Default}; color:white;">${utilizzo} (${counts[utilizzo]})</span>`;
      }
    });
    if (tagsHtml) {
      sidebarInventoryUtilizzoCounters.innerHTML =
        "Utilizzo Inventario: " + tagsHtml;
      sidebarInventoryUtilizzoCounters.classList.remove("hidden");
    } else {
      sidebarInventoryUtilizzoCounters.classList.add("hidden");
    }
  }

  function itemOrDescendantPassesFilter(
    item,
    selectedUtilizzi,
    activeCategory = null,
  ) {
    const passesUtilizzo =
      !selectedUtilizzi ||
      selectedUtilizzi.length === 0 ||
      selectedUtilizzi.includes(item.utilizzo);
    const passesCategory = !activeCategory || item.categoria === activeCategory;

    if (passesUtilizzo && passesCategory) return true;

    if (item.children && item.children.length > 0) {
      return item.children.some((child) =>
        itemOrDescendantPassesFilter(child, selectedUtilizzi, activeCategory),
      );
    }
    return false;
  }

  function hasVisibleChildren(item, selectedUtilizzi, activeCategory = null) {
    if (!item.children || item.children.length === 0) return false;
    return item.children.some((child) =>
      itemOrDescendantPassesFilter(child, selectedUtilizzi, activeCategory),
    );
  }

  function createChecklistItem(
    item,
    uniqueId,
    parentUniqueId,
    selectedUtilizziForRendering,
    activeCategoryForRendering,
    isCurrentItemExceptionallyShown, // CHANGED: Renamed parameter for clarity
  ) {
    const li = document.createElement("li");
    li.classList.add("item");

    const isPotentialParent = item.children && item.children.length > 0;

    if (isCurrentItemExceptionallyShown) {
      // CHANGED: Using renamed parameter
      li.classList.add("item-exceptionally-shown");
    }

    li.dataset.itemId = uniqueId;
    li.dataset.parentId = parentUniqueId;

    if (!currentChecklistState[uniqueId]) {
      currentChecklistState[uniqueId] = {
        checked: false,
        timestamp: null,
        parentId: parentUniqueId,
        itemData: { ...item },
        isExceptionallyShown: isCurrentItemExceptionallyShown, // CHANGED: Using renamed parameter
      };
    } else {
      currentChecklistState[uniqueId].itemData = { ...item };
      currentChecklistState[uniqueId].parentId = parentUniqueId;
      currentChecklistState[uniqueId].isExceptionallyShown =
        isCurrentItemExceptionallyShown; // CHANGED: Using renamed parameter
    }

    const itemRowDiv = document.createElement("div");
    itemRowDiv.classList.add("item-row");
    const itemControlsDiv = document.createElement("div");
    itemControlsDiv.classList.add("item-controls");

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("toggle-btn", "collapsed");
    toggleBtn.innerHTML = "▾";
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleChildren(uniqueId);
    });
    itemControlsDiv.appendChild(toggleBtn);

    const spacer = document.createElement("span");
    spacer.classList.add("toggle-spacer");
    itemControlsDiv.appendChild(spacer);

    if (isPotentialParent) {
      li.classList.add("parent");
    } else {
      toggleBtn.style.display = "none";
      spacer.style.display = "";
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `checkbox-${uniqueId}`;
    checkbox.checked = currentChecklistState[uniqueId].checked;
    checkbox.disabled = isCurrentItemExceptionallyShown; // CHANGED: Using renamed parameter

    if (!isCurrentItemExceptionallyShown) {
      // CHANGED: Using renamed parameter
      checkbox.addEventListener("change", () => {
        hasUnsavedChanges = true;
        handleItemCheck(uniqueId, checkbox.checked);
      });
    }
    itemControlsDiv.appendChild(checkbox);
    itemRowDiv.appendChild(itemControlsDiv);

    const itemTextDiv = document.createElement("div");
    itemTextDiv.classList.add("item-text");
    itemTextDiv.innerHTML = formatItemText(item);
    itemRowDiv.appendChild(itemTextDiv);
    li.appendChild(itemRowDiv);

    if (item.children && item.children.length > 0) {
      const childrenUl = document.createElement("ul");
      childrenUl.classList.add("children-list", "collapsed");
      li.appendChild(childrenUl);
      // CHANGED: Sort children by 'ordine' property
      const sortedChildren = item.children.sort(
        (a, b) => (a.ordine || 0) - (b.ordine || 0),
      );
      sortedChildren.forEach((child) => {
        const childUniqueId = generateUniqueId(child, uniqueId);
        const childPassesUtilizzo =
          !selectedUtilizziForRendering ||
          selectedUtilizziForRendering.length === 0 ||
          selectedUtilizziForRendering.includes(child.utilizzo);
        const childPassesCategory =
          !activeCategoryForRendering ||
          child.categoria === activeCategoryForRendering;
        const childPassesAllCurrentFilters =
          childPassesUtilizzo && childPassesCategory;
        const childOrDescendantPassesAll = itemOrDescendantPassesFilter(
          child,
          selectedUtilizziForRendering,
          activeCategoryForRendering,
        );

        if (childOrDescendantPassesAll) {
          const childIsExceptionallyShownItself =
            !childPassesAllCurrentFilters && childOrDescendantPassesAll;
          const childListItem = createChecklistItem(
            child,
            childUniqueId,
            uniqueId,
            selectedUtilizziForRendering,
            activeCategoryForRendering,
            childIsExceptionallyShownItself,
          );
          childrenUl.appendChild(childListItem);
        }
      });
    }
    applyVisualState(uniqueId, li);
    return li;
  }

  function renderChecklist() {
    checklistContainer.innerHTML = "";
    allItemsCheckedMessage.classList.add("hidden");

    if (!fullInventoryData || !fullInventoryData.inventario) {
      loadStatus.textContent = "Nessun dato da mostrare.";
      checkIfAllItemsChecked();
      return;
    }
    // CHANGED: Sort root inventory items by 'ordine' property
    const sortedInventory = [...fullInventoryData.inventario].sort(
      (a, b) => (a.ordine || 0) - (b.ordine || 0),
    );
    let selectedUtilizziForRendering =
      currentChecklistState.original_filters ||
      Array.from(filterCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
    utilizzoFilters.classList.toggle(
      "hidden",
      !!currentChecklistState.original_filters,
    );

    if (currentChecklistState.original_filters) {
    } else {
      updateUtilizzoCounters(fullInventoryData.inventario);
    }

    sortedInventory.forEach((item) => {
      const itemPassesUtilizzo =
        !selectedUtilizziForRendering ||
        selectedUtilizziForRendering.length === 0 ||
        selectedUtilizziForRendering.includes(item.utilizzo);
      const itemPassesCategory =
        !currentActiveCategoryFilter ||
        item.categoria === currentActiveCategoryFilter;
      const itemPassesAllCurrentFilters =
        itemPassesUtilizzo && itemPassesCategory;
      const descendantPassesAllCurrentFilters = itemOrDescendantPassesFilter(
        item,
        selectedUtilizziForRendering,
        currentActiveCategoryFilter,
      );

      if (descendantPassesAllCurrentFilters) {
        const isExceptionallyShownItself =
          !itemPassesAllCurrentFilters && descendantPassesAllCurrentFilters;
        const itemId = generateUniqueId(item, null);
        const listItem = createChecklistItem(
          item,
          itemId,
          null,
          selectedUtilizziForRendering,
          currentActiveCategoryFilter,
          isExceptionallyShownItself,
        );
        checklistContainer.appendChild(listItem);
      }
    });
    updateAllParentStates();
    updateCounters();
  }

  function updateItemVisualType(uniqueId) {
    const listItem = document.querySelector(`[data-item-id="${uniqueId}"]`);
    if (!listItem) return;

    const itemState = currentChecklistState[uniqueId];
    if (!itemState || !itemState.itemData) return;

    const toggleBtnEl = listItem.querySelector(".toggle-btn");
    const spacerEl = listItem.querySelector(".toggle-spacer");
    const childrenUl = listItem.querySelector(".children-list");

    let shouldBeVisualParent = false;
    if (
      itemState.itemData.children &&
      itemState.itemData.children.length > 0 &&
      childrenUl
    ) {
      let hasVisibleRenderedChildInDOM = false;
      for (const childLi of childrenUl.children) {
        if (!childLi.classList.contains("hidden")) {
          hasVisibleRenderedChildInDOM = true;
          break;
        }
      }
      if (hasVisibleRenderedChildInDOM) {
        shouldBeVisualParent = true;
        childrenUl.style.display = "";
      } else {
        childrenUl.style.display = "none";
      }
    } else if (childrenUl) {
      childrenUl.style.display = "none";
    }

    if (itemState.isExceptionallyShown) {
      let hasAnyVisibleDescendant = false;
      if (childrenUl && childrenUl.style.display !== "none") {
        for (const childLi of childrenUl.children) {
          if (!childLi.classList.contains("hidden")) {
            hasAnyVisibleDescendant = true;
            break;
          }
        }
      }
      if (!hasAnyVisibleDescendant) {
        listItem.classList.add("hidden");
        shouldBeVisualParent = false;
      } else {
        listItem.classList.remove("hidden");
      }
    }

    if (shouldBeVisualParent) {
      listItem.classList.add("parent");
      if (toggleBtnEl) toggleBtnEl.style.display = "";
      if (spacerEl) spacerEl.style.display = "none";
    } else {
      listItem.classList.remove("parent");
      if (toggleBtnEl) toggleBtnEl.style.display = "none";
      if (spacerEl) spacerEl.style.display = "";
    }
  }

  function applyVisualState(uniqueId, listItemElement = null) {
    const listItem =
      listItemElement || document.querySelector(`[data-item-id="${uniqueId}"]`);
    if (!listItem) return;
    const itemState = currentChecklistState[uniqueId];
    if (!itemState) return;
    const checkbox = listItem.querySelector(`#checkbox-${uniqueId}`);
    if (checkbox) {
      checkbox.checked = itemState.checked;
      checkbox.disabled = itemState.isExceptionallyShown;
    }

    listItem.classList.remove("hidden", "strikethrough");

    // Ensure item-exceptionally-shown class is correctly applied or removed
    if (itemState.isExceptionallyShown) {
      listItem.classList.add("item-exceptionally-shown");
    } else {
      listItem.classList.remove("item-exceptionally-shown");
    }

    if (itemState.checked && !itemState.isExceptionallyShown) {
      if (
        itemState.itemData.children &&
        itemState.itemData.children.length > 0
      ) {
        const childrenUl = listItem.querySelector(".children-list");
        let allChildrenEffectivelyChecked = true;
        if (
          childrenUl &&
          childrenUl.style.display !== "none" &&
          childrenUl.children.length > 0
        ) {
          const visibleChildrenInUl = Array.from(childrenUl.children).filter(
            (childLi) => !childLi.classList.contains("hidden"),
          );
          if (visibleChildrenInUl.length > 0) {
            allChildrenEffectivelyChecked = visibleChildrenInUl.every(
              (childLi) => {
                const childState =
                  currentChecklistState[childLi.dataset.itemId];
                return (
                  childState &&
                  (childState.checked || childLi.classList.contains("hidden"))
                );
              },
            );
          }
        } else {
          // If childrenUl is not displayed or has no children, consider all (relevant) children checked
          // This part might need refinement if parent checked state should depend on ALL children regardless of current display
          // For now, this logic hides a checked parent if its displayed children are all checked.
        }

        if (allChildrenEffectivelyChecked) listItem.classList.add("hidden");
        else listItem.classList.add("strikethrough");
      } else {
        listItem.classList.add("hidden");
      }
    }
    updateItemVisualType(uniqueId);
  }

  function handleItemCheck(uniqueId, isChecked) {
    const itemState = currentChecklistState[uniqueId];
    if (!itemState || itemState.isExceptionallyShown) return;
    itemState.checked = isChecked;
    itemState.timestamp = isChecked ? getFormattedTimestamp() : null;

    applyVisualState(uniqueId);

    if (isChecked) {
      const listItem = document.querySelector(`[data-item-id="${uniqueId}"]`);
      if (listItem && listItem.classList.contains("parent")) {
        const childrenUl = listItem.querySelector(".children-list");
        const toggleBtn = listItem.querySelector(".toggle-btn");
        if (childrenUl && childrenUl.classList.contains("collapsed")) {
          if (toggleBtn && toggleBtn.style.display !== "none") {
            childrenUl.classList.remove("collapsed");
            toggleBtn.classList.remove("collapsed");
          }
        }
      }
    }

    if (itemState.parentId) updateParentState(itemState.parentId);
    updateCheckedItemsOverlay();

    const activeCategoryIsEmpty = updateCounters();

    if (currentActiveCategoryFilter && activeCategoryIsEmpty) {
      currentActiveCategoryFilter = null;
      renderChecklist();
      document
        .querySelectorAll("#sidebar-category-filters .category-filter-item")
        .forEach((el) => el.classList.remove("active"));
      const allCatFilterEl = document.querySelector(
        '#sidebar-category-filters .category-filter-item[data-category-name="null"]',
      );
      if (allCatFilterEl) allCatFilterEl.classList.add("active");
      else {
        const firstFilter = document.querySelector(
          "#sidebar-category-filters .category-filter-item",
        );
        if (
          firstFilter &&
          firstFilter.textContent.includes("Tutte le categorie")
        )
          firstFilter.classList.add("active");
      }
      sidebarMenu.classList.add("open");
      adjustMainContentMargin();
    }
  }

  function updateParentState(parentUniqueId) {
    if (!parentUniqueId) return;
    const parentListItem = document.querySelector(
      `[data-item-id="${parentUniqueId}"]`,
    );
    applyVisualState(parentUniqueId, parentListItem);
    const parentState = currentChecklistState[parentUniqueId];
    if (parentState && parentState.parentId)
      updateParentState(parentState.parentId);
  }

  function updateAllParentStates() {
    const allItems = Array.from(document.querySelectorAll(".item")).reverse();
    allItems.forEach((itemLi) => {
      applyVisualState(itemLi.dataset.itemId, itemLi);
    });
  }

  function updateCheckedItemsOverlay() {
    checkedItemsList.innerHTML = "";
    const checkedItems = [];
    for (const uniqueId in currentChecklistState) {
      const itemState = currentChecklistState[uniqueId];
      if (
        itemState.checked &&
        itemState.itemData &&
        !itemState.isExceptionallyShown
      ) {
        checkedItems.push({ ...itemState, uniqueId });
      }
    }
    checkedItems.sort(
      (a, b) =>
        new Date(b.timestamp?.replace(/\./g, ":") || 0) -
        new Date(a.timestamp?.replace(/\./g, ":") || 0),
    );

    if (checkedItems.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Nessun elemento spuntato.";
      p.style.textAlign = "center";
      p.style.padding = "20px";
      checkedItemsList.appendChild(p);
      return;
    }

    checkedItems.forEach((itemStateWithId) => {
      const li = document.createElement("li");
      let displayName =
        itemStateWithId.itemData.nome || itemStateWithId.itemData.id;
      let countPrefix = "";
      const itemData = itemStateWithId.itemData;

      if (
        itemData.totali !== null &&
        typeof itemData.totali !== "undefined" &&
        itemData.in_uso !== null &&
        typeof itemData.in_uso !== "undefined"
      ) {
        if (itemData.totali === itemData.in_uso) {
          countPrefix = `${itemData.totali} `;
        } else {
          countPrefix = `${itemData.in_uso}/${itemData.totali} `;
        }
      }

      let baseDisplayName = displayName;
      displayName = `${countPrefix}${displayName}`;

      if (
        itemStateWithId.parentId &&
        currentChecklistState[itemStateWithId.parentId]
      ) {
        const parentData =
          currentChecklistState[itemStateWithId.parentId].itemData;
        const parentName = parentData.nome || parentData.id;
        displayName = `${countPrefix}${baseDisplayName} (${parentName})`;
      }

      li.innerHTML = `<span class="item-name-timestamp"><span class="item-name" title="${displayName}">${displayName}</span><span class="timestamp">${itemStateWithId.timestamp || "N/A"}</span></span>`;
      const restoreBtn = document.createElement("button");
      restoreBtn.classList.add("restore-btn");
      restoreBtn.textContent = "X";
      restoreBtn.title = "Ripristina elemento";
      restoreBtn.addEventListener("click", () => {
        hasUnsavedChanges = true;
        restoreItem(itemStateWithId.uniqueId);
      });
      li.appendChild(restoreBtn);
      checkedItemsList.appendChild(li);
    });
  }

  function restoreItem(uniqueIdToRestore) {
    const itemState = currentChecklistState[uniqueIdToRestore];
    if (!itemState || itemState.isExceptionallyShown) return; // Should not happen if UI prevents checking exceptionally shown
    itemState.checked = false;
    itemState.timestamp = null;

    const listItem = document.querySelector(
      `[data-item-id="${uniqueIdToRestore}"]`,
    );
    // listItem might not exist if it was part of a category that got filtered out *after* being checked
    // However, applyVisualState handles null listItem gracefully.

    applyVisualState(uniqueIdToRestore, listItem);
    if (itemState.parentId) updateParentState(itemState.parentId);

    // CHANGED: Add call to updateAllParentStates to ensure full visual refresh
    updateAllParentStates();

    updateCheckedItemsOverlay();
    const activeCatIsEmpty = updateCounters();

    if (currentActiveCategoryFilter && activeCatIsEmpty) {
      currentActiveCategoryFilter = null;
      // Full render will be triggered by updateCounters if category becomes empty
      // This will ensure the list is correctly rebuilt if needed.
      // No need to call renderChecklist() directly here if updateCounters already handles it.
      // The following block in updateCounters (which calls renderCategoryFilters) handles this.
      // The user mentioned: "Cliccando su una qualsiasi categoria, riappare tale padre spuntato invece,
      // come se quando clicco sulla categoria avviene un “refresh” della checklist"
      // This implies a full render (via category click -> renderChecklist) fixes it.
      // updateAllParentStates() should provide a similar level of visual refresh for item states.
      // If a full re-render (rebuild of DOM elements) is *still* needed, that's a deeper issue.
      // For now, let's trust updateAllParentStates() to fix visual states of existing DOM elements.
      // If items need to be added/removed from DOM based on this change, then renderChecklist() would be required.
      // The current logic in updateCounters -> renderCategoryFilters -> renderChecklist (if cat empty)
      // might cover cases where the category filter itself needs to change.
      // If the restored item makes its parent (which might not have matched category filter)
      // appear as item-exceptionally-shown, applyVisualState should handle that.
      // The critical part is ensuring parent LI is made visible if it was hidden.

      // This logic to reset category filter is already in handleItemCheck and clearAllCheckedItems
      // It's fine to have it here too, driven by updateCounters.
      // If the category is empty after restore, it will reset.
      document
        .querySelectorAll("#sidebar-category-filters .category-filter-item")
        .forEach((el) => el.classList.remove("active"));
      const allCatFilterEl = document.querySelector(
        '#sidebar-category-filters .category-filter-item[data-category-name="null"]',
      );
      if (allCatFilterEl) allCatFilterEl.classList.add("active");
      else {
        const firstFilter = document.querySelector(
          "#sidebar-category-filters .category-filter-item",
        );
        if (
          firstFilter &&
          firstFilter.textContent.includes("Tutte le categorie")
        )
          firstFilter.classList.add("active");
      }
      sidebarMenu.classList.add("open");
      adjustMainContentMargin();
      // A full renderChecklist() is implicitly called if activeCategoryIsEmpty and currentActiveCategoryFilter are true
      // by the logic within updateCounters() -> renderCategoryFilters()
    }
  }

  function clearAllCheckedItems() {
    let itemsWereRestored = false;
    const idsToRestore = [];
    for (const uniqueId in currentChecklistState) {
      if (
        currentChecklistState[uniqueId].checked &&
        !currentChecklistState[uniqueId].isExceptionallyShown
      ) {
        idsToRestore.push(uniqueId);
      }
    }
    idsToRestore.forEach((id) => {
      restoreItem(id); // restoreItem now calls updateAllParentStates
      itemsWereRestored = true;
    });

    if (itemsWereRestored) {
      hasUnsavedChanges = true;
      const activeCatIsEmpty = updateCounters(); // This will call renderCategoryFilters
      // If category becomes empty, renderChecklist will be called within that flow.
      if (currentActiveCategoryFilter && activeCatIsEmpty) {
        currentActiveCategoryFilter = null; // This state is now managed by updateCounters path
        // renderChecklist(); // Not needed here, updateCounters handles it.
        document
          .querySelectorAll("#sidebar-category-filters .category-filter-item")
          .forEach((el) => el.classList.remove("active"));
        const allCatFilterEl = document.querySelector(
          '#sidebar-category-filters .category-filter-item[data-category-name="null"]',
        );
        if (allCatFilterEl) allCatFilterEl.classList.add("active");
        else {
          const firstFilter = document.querySelector(
            "#sidebar-category-filters .category-filter-item",
          );
          if (
            firstFilter &&
            firstFilter.textContent.includes("Tutte le categorie")
          )
            firstFilter.classList.add("active");
        }
        sidebarMenu.classList.add("open");
        adjustMainContentMargin();
      }
    }
  }

  function toggleAll(shouldExpand) {
    console.log(
      `--- DEBUG: toggleAll called with shouldExpand: ${shouldExpand} ---`,
    );
    const allListItems = document.querySelectorAll(
      ".checklist .item[data-item-id]",
    );
    console.log(
      `Found ${allListItems.length} items with data-item-id to iterate for toggleAll.`,
    );

    allListItems.forEach((itemLi) => {
      const uniqueId = itemLi.dataset.itemId;
      const childrenUl = itemLi.querySelector(".children-list");
      const toggleBtn = itemLi.querySelector(".toggle-btn");

      if (childrenUl && toggleBtn && toggleBtn.style.display !== "none") {
        // Only toggle items that are not themselves exceptionally shown parents
        // whose children list might be managed differently or empty due to filtering.
        // The original logic didn't have this `item-exceptionally-shown` check,
        // but it seems safer not to force-toggle parents that are only shown for context.
        // However, the user's request is generic "Espandi/Comprimi tutto".
        // Let's keep the original behavior unless it causes issues.
        // if (!itemLi.classList.contains("item-exceptionally-shown")) {
        console.log(
          `Action: Toggling visual parent ${uniqueId} to collapsed: ${!shouldExpand}`,
        );
        childrenUl.classList.toggle("collapsed", !shouldExpand);
        toggleBtn.classList.toggle("collapsed", !shouldExpand);
        // }
      }
    });
    console.log("--- DEBUG: toggleAll finished ---");
  }

  function toggleChildren(uniqueId) {
    const listItem = document.querySelector(`[data-item-id="${uniqueId}"]`);
    const toggleBtn = listItem.querySelector(".toggle-btn");
    if (!listItem || !toggleBtn || toggleBtn.style.display === "none") return;

    const childrenUl = listItem.querySelector(".children-list");
    if (childrenUl) {
      childrenUl.classList.toggle("collapsed");
      toggleBtn.classList.toggle("collapsed");
    }
  }

  checkedItemsOverlay.addEventListener("click", (event) => {
    if (event.target === checkedItemsOverlay) {
      checkedItemsOverlay.classList.add("hidden");
      document.body.classList.remove("body-blur");
    }
  });

  loadFileBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      loadStatus.textContent = "Seleziona un file JSON.";
      return;
    }
    loadStatus.textContent = `Lettura file "${file.name}"...`;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        tempLoadedData = JSON.parse(event.target.result);
        if (
          !tempLoadedData ||
          (!tempLoadedData.inventario && !tempLoadedData.currentChecklistState)
        )
          throw new Error("Struttura dati non valida.");

        if (initialSectionsWrapper)
          initialSectionsWrapper.classList.remove("hidden");
        fileInputSection.classList.add("hidden");
        confirmLoadSection.classList.remove("hidden");
        mainContent.classList.add("hidden");
        loadStatus.textContent = "";
        adjustMainContentMargin();

        if (
          Array.isArray(tempLoadedData.inventario) &&
          !tempLoadedData.currentChecklistState
        ) {
          confirmNewInventorySection.classList.remove("hidden");
          confirmSavedChecklistSection.classList.add("hidden");
        } else if (
          tempLoadedData.inventario &&
          tempLoadedData.currentChecklistState
        ) {
          confirmNewInventorySection.classList.add("hidden");
          confirmSavedChecklistSection.classList.remove("hidden");
          const originalFilters =
            tempLoadedData.currentChecklistState.original_filters || [];
          savedOriginalFiltersSpan.textContent =
            originalFilters.length > 0 ? originalFilters.join(", ") : "Tutti";
          savedTotalItemsSpan.textContent = countAllItemsRecursive(
            tempLoadedData.inventario,
          );
          const state = tempLoadedData.currentChecklistState;
          let checkedCount = 0;
          let relevantItemsInState = countActuallyFilteredItemsRecursive(
            tempLoadedData.inventario,
            originalFilters,
            null,
          );
          for (const key in state) {
            if (
              state[key]?.checked &&
              state[key]?.itemData &&
              !state[key]?.isExceptionallyShown
            ) {
              if (
                originalFilters.length === 0 ||
                originalFilters.includes(state[key].itemData.utilizzo)
              )
                checkedCount++;
            }
          }
          savedCheckedItemsSpan.textContent = checkedCount;
          savedRemainingItemsSpan.textContent = Math.max(
            0,
            relevantItemsInState - checkedCount,
          );
        } else {
          throw new Error(
            "Formato JSON non riconosciuto o struttura interna mancante.",
          );
        }
      } catch (e) {
        loadStatus.textContent = `Errore lettura/parsing: ${e.message}`;
        if (initialSectionsWrapper)
          initialSectionsWrapper.classList.remove("hidden");
        fileInputSection.classList.remove("hidden");
        confirmLoadSection.classList.add("hidden");
        confirmNewInventorySection.classList.add("hidden");
        confirmSavedChecklistSection.classList.add("hidden");
        mainContent.classList.add("hidden");
        tempLoadedData = null;
        adjustMainContentMargin();
      }
    };
    reader.onerror = () => {
      loadStatus.textContent = "Errore lettura file.";
      tempLoadedData = null;
      if (initialSectionsWrapper)
        initialSectionsWrapper.classList.remove("hidden");
      fileInputSection.classList.remove("hidden");
      confirmLoadSection.classList.add("hidden");
      confirmNewInventorySection.classList.add("hidden");
      confirmSavedChecklistSection.classList.add("hidden");
      mainContent.classList.add("hidden");
      adjustMainContentMargin();
    };
    reader.readAsText(file);
  });

  confirmLoadNewBtn.addEventListener("click", () => {
    const selectedUtilizzi = Array.from(filterCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    if (selectedUtilizzi.length === 0) {
      alert("Seleziona almeno un filtro di utilizzo.");
      return;
    }
    if (!tempLoadedData) {
      loadStatus.textContent = "Dati non pronti.";
      return;
    }
    fullInventoryData = tempLoadedData;
    currentChecklistState = {
      checklist_timestamp: getFormattedTimestamp(),
      original_filters: selectedUtilizzi,
    };
    currentActiveCategoryFilter = null;

    if (initialSectionsWrapper) initialSectionsWrapper.classList.add("hidden");
    mainContent.classList.remove("hidden");

    sidebarMenu.classList.add("open");
    adjustMainContentMargin();
    renderChecklist();
    updateCheckedItemsOverlay();
    loadStatus.textContent = `Inventario caricato.`;
    tempLoadedData = null;
    hasUnsavedChanges = false;
  });

  confirmLoadSavedBtn.addEventListener("click", () => {
    if (!tempLoadedData) {
      loadStatus.textContent = "Dati non pronti.";
      return;
    }
    fullInventoryData = tempLoadedData;
    currentChecklistState = tempLoadedData.currentChecklistState;
    currentChecklistState.checklist_timestamp =
      currentChecklistState.checklist_timestamp || getFormattedTimestamp();
    currentActiveCategoryFilter = null;
    // Ensure isExceptionallyShown is reset on load as it's a runtime visual state
    for (const key in currentChecklistState) {
      if (
        currentChecklistState[key] &&
        typeof currentChecklistState[key] === "object"
      ) {
        delete currentChecklistState[key].isExceptionallyShown;
      }
    }
    if (initialSectionsWrapper) initialSectionsWrapper.classList.add("hidden");
    mainContent.classList.remove("hidden");

    sidebarMenu.classList.add("open");
    adjustMainContentMargin();
    renderChecklist();
    updateCheckedItemsOverlay();
    loadStatus.textContent = `Checklist salvata caricata.`;
    tempLoadedData = null;
    hasUnsavedChanges = false;
  });

  showCheckedBtn.addEventListener("click", () => {
    checkedItemsOverlay.classList.remove("hidden");
    document.body.classList.add("body-blur");
    updateCheckedItemsOverlay();
  });
  clearAllCheckedBtn.addEventListener("click", clearAllCheckedItems);

  exportChecklistBtn.addEventListener("click", () => {
    if (!fullInventoryData) {
      alert("Carica un inventario prima.");
      return;
    }
    const stateToExport = JSON.parse(JSON.stringify(currentChecklistState));
    stateToExport.checklist_timestamp = getFormattedTimestamp();
    if (!stateToExport.original_filters) {
      stateToExport.original_filters = Array.from(filterCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
    }
    // Remove runtime visual state 'isExceptionallyShown' before export
    for (const key in stateToExport) {
      if (stateToExport[key] && typeof stateToExport[key] === "object") {
        delete stateToExport[key].isExceptionallyShown;
      }
    }
    const exportData = {
      csv_ultima_modifica: fullInventoryData.csv_ultima_modifica,
      inventario: fullInventoryData.inventario, // This will include 'ordine' if present in fullInventoryData
      currentChecklistState: stateToExport,
    };
    const filename = `checklist_${getFormattedTimestamp().replace(/[ .:"]/g, "_")}.json`;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", filename);
    dl.click();
    dl.remove();
    hasUnsavedChanges = false;
    loadStatus.textContent = `Checklist esportata: ${filename}`;
  });

  window.addEventListener("beforeunload", (event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue =
        "Hai modifiche non salvate. Sei sicuro di voler uscire?";
      return event.returnValue;
    }
  });

  function collectCategoriesRecursive(items, collected = new Set()) {
    items.forEach((item) => {
      if (item.categoria && item.categoria.trim() !== "") {
        collected.add(item.categoria);
      } else {
        collected.add("Altro");
      }
      if (item.children) {
        collectCategoriesRecursive(item.children, collected);
      }
    });
    return collected;
  }

  function renderCategoryFilters() {
    if (!fullInventoryData || !fullInventoryData.inventario) {
      sidebarCategoryFiltersContainer.innerHTML = "";
      return false;
    }
    sidebarCategoryFiltersContainer.innerHTML = "";
    let activeCategoryIsEmpty = false;

    let currentSelectedUtilizzi =
      currentChecklistState.original_filters ||
      Array.from(filterCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
    const categoryCounts = {};
    const allInventoryCategories = collectCategoriesRecursive(
      fullInventoryData.inventario,
    );

    allInventoryCategories.forEach((cat) => (categoryCounts[cat] = 0));
    categoryCounts["Altro"] = categoryCounts["Altro"] || 0; // Ensure Altro exists

    let totalAllCategoriesRemaining = 0;

    // Iterate over all items in the current checklist state that could potentially be visible
    Object.keys(currentChecklistState).forEach((uniqueId) => {
      const stateEntry = currentChecklistState[uniqueId];
      if (
        stateEntry &&
        stateEntry.itemData && // Ensure itemData exists
        !stateEntry.checked && // Item is not checked
        !stateEntry.isExceptionallyShown // Item itself is not just a placeholder parent
      ) {
        const item = stateEntry.itemData;
        const itemCategory =
          item.categoria && item.categoria.trim() !== ""
            ? item.categoria
            : "Altro";

        const passesUtilizzo =
          currentSelectedUtilizzi.length === 0 ||
          currentSelectedUtilizzi.includes(item.utilizzo);

        if (passesUtilizzo) {
          totalAllCategoriesRemaining++;
          if (categoryCounts.hasOwnProperty(itemCategory)) {
            categoryCounts[itemCategory]++;
          } else {
            // This case should ideally not happen if allInventoryCategories is comprehensive
            // but as a fallback:
            categoryCounts[itemCategory] = 1;
          }
        }
      }
    });

    const allItemsFilter = document.createElement("div");
    allItemsFilter.classList.add("category-filter-item");
    allItemsFilter.dataset.categoryName = "null";
    if (currentActiveCategoryFilter === null) {
      allItemsFilter.classList.add("active");
    }
    const allNameSpan = document.createElement("span");
    allNameSpan.classList.add("category-name");
    allNameSpan.textContent = "Tutte le categorie";
    allNameSpan.style.backgroundColor = CATEGORY_COLORS.Default;
    allItemsFilter.appendChild(allNameSpan);

    const allCountSpan = document.createElement("span");
    allCountSpan.classList.add("category-item-count");
    allCountSpan.textContent = totalAllCategoriesRemaining;
    allItemsFilter.appendChild(allCountSpan);

    allItemsFilter.addEventListener("click", () => {
      currentActiveCategoryFilter = null;
      renderChecklist();
    });
    sidebarCategoryFiltersContainer.appendChild(allItemsFilter);

    const sortedUniqueCategories = [];
    CATEGORY_ORDER.forEach((catName) => {
      if (allInventoryCategories.has(catName) && catName !== "Altro") {
        sortedUniqueCategories.push(catName);
      }
    });
    allInventoryCategories.forEach((catName) => {
      if (
        catName !== "Altro" &&
        !CATEGORY_ORDER.includes(catName) &&
        !sortedUniqueCategories.includes(catName)
      ) {
        sortedUniqueCategories.push(catName);
      }
    });
    if (allInventoryCategories.has("Altro")) {
      sortedUniqueCategories.push("Altro");
    }

    sortedUniqueCategories.forEach((category) => {
      const remainingInCategory = categoryCounts[category] || 0;
      if (
        currentActiveCategoryFilter === category &&
        remainingInCategory === 0
      ) {
        activeCategoryIsEmpty = true;
      }

      if (remainingInCategory > 0) {
        const filterItem = document.createElement("div");
        filterItem.classList.add("category-filter-item");
        filterItem.dataset.categoryName = category;
        if (currentActiveCategoryFilter === category) {
          filterItem.classList.add("active");
        }

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("category-name");
        nameSpan.textContent = category;
        nameSpan.style.backgroundColor =
          CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
        nameSpan.style.color = "white";
        filterItem.appendChild(nameSpan);

        const countSpan = document.createElement("span");
        countSpan.classList.add("category-item-count");
        countSpan.textContent = remainingInCategory;
        filterItem.appendChild(countSpan);

        filterItem.addEventListener("click", () => {
          currentActiveCategoryFilter = category;
          renderChecklist();
        });
        sidebarCategoryFiltersContainer.appendChild(filterItem);
      }
    });

    // If the currently active category filter results in an empty list,
    // and it's not the "All categories" filter, reset to "All categories".
    if (currentActiveCategoryFilter && activeCategoryIsEmpty) {
      const currentCategoryFilterElement = document.querySelector(
        `#sidebar-category-filters .category-filter-item[data-category-name="${currentActiveCategoryFilter}"]`,
      );
      // If the active category has 0 remaining items (and it's not "All Categories"),
      // or if the element for the active category filter is no longer rendered (because it has 0 items)
      if (
        (categoryCounts[currentActiveCategoryFilter] || 0) === 0 ||
        !currentCategoryFilterElement
      ) {
        currentActiveCategoryFilter = null; // Reset to all
        // Re-render the whole checklist because the active filter changed.
        // The updateCounters() which calls this will return true for activeCategoryIsEmpty,
        // then the calling function (e.g. handleItemCheck) will call renderChecklist().
      }
    }
    return activeCategoryIsEmpty;
  }
});
