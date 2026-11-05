// Turns the two sections of the CryoSPARC page into Admin and Users tabs, using the markup the
// theme already styles and mounts. This runs before the theme's own script, which then treats
// them like any other tabs. Without JavaScript the sections simply follow each other.
(function () {
  var set = document.getElementById("cryosparc-tabs");
  if (!set || set.children.length !== 2) return;

  var tabs = [
    { id: "admin", label: "Admin" },
    { id: "users", label: "Users" },
  ];
  var panels = Array.prototype.slice.call(set.children);
  var labels = document.createElement("div");
  var content = document.createElement("div");
  labels.className = "tabbed-labels";
  content.className = "tabbed-content";
  set.className = "tabbed-set tabbed-alternate";
  set.setAttribute("data-tabs", "1:2");

  tabs.forEach(function (tab, index) {
    var input = document.createElement("input");
    input.type = "radio";
    input.name = "__tabbed_1";
    input.id = tab.id;
    if (index === 0) input.setAttribute("checked", "checked");
    set.appendChild(input);

    var label = document.createElement("label");
    label.htmlFor = tab.id;
    label.textContent = tab.label;
    labels.appendChild(label);

    panels[index].className = "tabbed-block";
    content.appendChild(panels[index]);
  });
  set.appendChild(labels);
  set.appendChild(content);

  // An inactive panel is hidden, so a link to a heading inside it (table of contents, search
  // result, cross-reference) has nothing to scroll to. Open its tab first, then scroll to it.
  // Links to a tab itself are handled by the theme.
  function openTabForHash() {
    var id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      return;
    }
    var target = id && document.getElementById(id);
    var panel = target && target.closest(".tabbed-block");
    if (!panel || !set.contains(panel)) return;

    var input = set.querySelectorAll(":scope > input")[panels.indexOf(panel)];
    if (!input.checked) input.click();
    target.scrollIntoView();
  }

  window.addEventListener("hashchange", openTabForHash);

  // Clicking a link to the current hash fires no hashchange, e.g. after switching tabs by hand.
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href^="#"]');
    if (link && link.getAttribute("href") === location.hash) openTabForHash();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", openTabForHash);
  } else {
    openTabForHash();
  }
})();
