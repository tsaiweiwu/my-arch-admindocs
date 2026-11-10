// A heading inside an inactive content tab is hidden, so a link to it (table of contents, search
// result, cross-reference) has nothing to scroll to. Open its tab first, then scroll to it. Links
// to a tab itself are handled by the theme.
(function () {
  function openTabForHash() {
    var id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      return;
    }
    var target = id && document.getElementById(id);
    var panel = target && target.closest(".tabbed-block");
    if (!panel) return;

    var set = panel.closest(".tabbed-set");
    var panels = Array.prototype.slice.call(panel.parentElement.children);
    var input = set.querySelectorAll(":scope > input")[panels.indexOf(panel)];
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
