document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("mobile-open");
      nav.style.display = open ? "flex" : "";
      nav.style.flexDirection = open ? "column" : "";
      nav.style.position = open ? "absolute" : "";
      nav.style.top = open ? "76px" : "";
      nav.style.left = open ? "0" : "";
      nav.style.right = open ? "0" : "";
      nav.style.padding = open ? "20px 4%" : "";
      nav.style.background = open ? "#fff" : "";
      nav.style.borderBottom = open ? "1px solid #dce5ef" : "";
    });
  }
});
