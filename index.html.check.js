
"use strict";
// Replace these with your real hosted checkout links (Gumroad / Lemon Squeezy / Stripe Payment Link).
// Keep the placeholder "YOUR_ACCOUNT" as long as the link is not configured.
const CHECKOUT = {
  pro: "https://YOUR_ACCOUNT.gumroad.com/l/trueodds-pro",
  source: "https://YOUR_ACCOUNT.gumroad.com/l/trueodds-source"
};

function buy(plan){
  const url = CHECKOUT[plan];
  if(!url || url.indexOf("YOUR_ACCOUNT") !== -1){
    showToast("Checkout not configured yet — paste your Gumroad or Lemon Squeezy link into CHECKOUT in the code.");
    return;
  }
  window.location.href = url;
}
let toastTimer = null;
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}
document.querySelectorAll("[data-plan]").forEach(b => {
  b.addEventListener("click", () => buy(b.getAttribute("data-plan")));
});

// Mobile nav toggle
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
if(menuToggle && mainNav){
  menuToggle.addEventListener("click", function(e){
    e.stopPropagation();
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  mainNav.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
  // Close the dropdown when clicking anywhere outside it
  document.addEventListener("click", function(){
    if(mainNav.classList.contains("open")){
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}
