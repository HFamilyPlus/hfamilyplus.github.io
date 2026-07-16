(function () {
  "use strict";

  var IMAGE_FOLDER = "images/";
  // Published Google Sheet, as CSV. File > Share > Publish to web in the sheet.
  var MANIFEST_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfYmTvz3umGcVBGbRfzbL_xRuAOpK8KdM-TE2x8ZA0gwnd5jwrdoHTROcRRWQ-sf13mgS0clLlyZa6/pub?gid=764475134&single=true&output=csv";

  var gallery = document.getElementById("gallery");
  var images = []; // populated after fetch: [{src, tag}]

  // ---- Minimal CSV parser (handles quoted fields with commas, per the export format) ----
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }

    var header = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
    return rows
      .filter(function (r) { return r.length > 1 || (r[0] && r[0].trim()); })
      .map(function (r) {
        var obj = {};
        header.forEach(function (key, idx) { obj[key] = (r[idx] || "").trim(); });
        return obj;
      });
  }

  function buildGallery(products) {
    products.forEach(function (product, i) {
      var src = IMAGE_FOLDER + product.filename;
      var tag = "ID " + product.number;
      images.push({ src: src, tag: tag });

      var item = document.createElement("div");
      item.className = "gallery-item";
      item.setAttribute("data-index", i);

      var img = document.createElement("img");
      img.src = src;
      img.alt = product.alt || ("H Family Plus chair, item " + product.number);
      img.loading = "lazy";
      // If an image file is missing, quietly drop the tile instead of showing a broken icon
      img.onerror = function () {
        var tile = this.closest(".gallery-item");
        if (tile) tile.remove();
      };

      var scrim = document.createElement("span");
      scrim.className = "gallery-scrim";
      scrim.setAttribute("aria-hidden", "true");

      var frame = document.createElement("span");
      frame.className = "gallery-frame";
      frame.setAttribute("aria-hidden", "true");
      frame.innerHTML = "<span></span><span></span><span></span><span></span>";

      var tagEl = document.createElement("span");
      tagEl.className = "gallery-tag";
      tagEl.textContent = tag;

      var viewBtn = document.createElement("span");
      viewBtn.className = "gallery-view-btn";
      viewBtn.setAttribute("aria-hidden", "true");
      viewBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
        "</svg>";

      item.appendChild(img);
      item.appendChild(scrim);
      item.appendChild(frame);
      item.appendChild(tagEl);
      item.appendChild(viewBtn);
      gallery.appendChild(item);
    });
  }

  // ---- Lightbox ----
  var lightbox = document.getElementById("lightbox");
  var lbImage = document.getElementById("lb-image");
  var lbCaption = document.getElementById("lb-caption");
  var lbClose = document.getElementById("lb-close");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updateLightbox() {
    var data = images[currentIndex];
    if (!data) return;
    lbImage.src = data.src;
    lbImage.alt = data.tag;
    lbCaption.textContent = data.tag;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    updateLightbox();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightbox();
  }

  gallery.addEventListener("click", function (e) {
    var item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(parseInt(item.getAttribute("data-index"), 10));
  });

  lbClose.addEventListener("click", closeLightbox);
  lbNext.addEventListener("click", showNext);
  lbPrev.addEventListener("click", showPrev);

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  // ---- Mobile nav toggle & smart close ----
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  navToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (!mainNav.contains(e.target) && e.target !== navToggle) {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  // ---- Footer year ----
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---- Load the product manifest from the published Google Sheet, then build the gallery ----
  fetch(MANIFEST_URL, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("Could not load " + MANIFEST_URL);
      return res.text();
    })
    .then(function (csvText) {
      var rows = parseCSV(csvText);
      var products = rows
        .filter(function (r) { return r.filename; })
        .map(function (r) {
          return { number: r.number, filename: r.filename, alt: r.alt };
        });
      buildGallery(products);
    })
    .catch(function (err) {
      console.error(err);
      gallery.innerHTML =
        '<p style="padding:2rem;color:#7a6f63;">Collection is being updated — please check back shortly.</p>';
    });
})();
