// docs/sse/javascripts/page-tabs.js. Turns <div class="page-tabs"> sets (written by /update-md) into Material content tabs, one tab
// per child <div data-tab-label="..." data-tab-id="...">, using the markup the theme already
// styles and mounts. Each page loads it with a <script> at the end of its content, so it runs
// before the theme's own script, which then treats them like any other tabs. Without JavaScript
// the panels simply follow each other, each under its own "## <Label> guide" heading.
(function () {
  var sets = Array.prototype.slice.call(document.querySelectorAll("div.page-tabs"));

  sets.forEach(function (set, setIndex) {
    if (set.dataset.pageTabsDone) return;
    set.dataset.pageTabsDone = "1";
    var panels = Array.prototype.slice.call(set.children).filter(function (el) {
      return el.tagName === "DIV" && el.hasAttribute("data-tab-label");
    });
    if (panels.length < 2) return;

    var labels = document.createElement("div");
    var content = document.createElement("div");
    labels.className = "tabbed-labels";
    content.className = "tabbed-content";
    set.className = "tabbed-set tabbed-alternate";
    set.setAttribute("data-tabs", setIndex + 1 + ":" + panels.length);

    panels.forEach(function (panel, index) {
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "__page_tabs_" + (setIndex + 1);
      input.id = panel.getAttribute("data-tab-id") || "page-tab-" + (setIndex + 1) + "-" + (index + 1);
      if (index === 0) input.setAttribute("checked", "checked");
      set.appendChild(input);

      var label = document.createElement("label");
      label.htmlFor = input.id;
      label.textContent = panel.getAttribute("data-tab-label");
      labels.appendChild(label);

      panel.className = "tabbed-block";
      content.appendChild(panel);
    });
    set.appendChild(labels);
    set.appendChild(content);
  });

  // An inactive panel is hidden, so a link to a heading inside it (table of contents, search
  // result, cross-reference) has nothing to scroll to. Open its tab first, then scroll to it.
  // Links to a tab itself (#<data-tab-id>) are handled by the theme.
  function openTabForHash() {
    var id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      return;
    }
    var target = id && document.getElementById(id);
    var panel = target && target.closest(".tabbed-block");
    var set = panel && panel.closest(".tabbed-set");
    if (!set || !set.querySelector(":scope > .tabbed-content")) return;

    var blocks = Array.prototype.slice.call(set.querySelectorAll(":scope > .tabbed-content > .tabbed-block"));
    var input = set.querySelectorAll(":scope > input")[blocks.indexOf(panel)];
    if (input && !input.checked) input.click();
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
