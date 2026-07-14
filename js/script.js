(function () {
  "use strict";

  // ---- Config: how many product photos live in /images ----
  // Files are expected to be named images/image-001.jpeg ... image-070.jpeg
  var IMAGE_COUNT = 70;
  var IMAGE_FOLDER = "images/";

  function padNumber(n) {
    return String(n).padStart(3, "0");
  }

  // ---- Build the gallery ----
  var gallery = document.getElementById("gallery");
  var images = [];

  for (var i = 1; i <= IMAGE_COUNT; i++) {
    var num = padNumber(i);
    var src = IMAGE_FOLDER + "image-" + num + ".jpeg";
    images.push({ src: src, tag: "No. " + num });

    var item = document.createElement("div");
    item.className = "gallery-item";
    item.setAttribute("data-index", i - 1);

    var img = document.createElement("img");
    img.src = src;
    img.alt = "H Family Plus chair, item " + num;
    img.loading = "lazy";
    // If an image file is missing, quietly drop the tile instead of showing a broken icon
    img.onerror = function () {
      var tile = this.closest(".gallery-item");
      if (tile) tile.remove();
    };

    var tag = document.createElement("span");
    tag.className = "gallery-tag";
    tag.textContent = "No. " + num;

    item.appendChild(img);
    item.appendChild(tag);
    gallery.appendChild(item);
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
    lbImage.alt = "H Family Plus chair, item " + data.tag.replace("No. ", "");
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

  // ---- Mobile nav toggle ----
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---- Footer year ----
  document.getElementById("year").textContent = new Date().getFullYear();
})();
