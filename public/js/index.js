document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const navList = document.getElementById("navList");

  let painelItem = null;

  toggle.addEventListener("click", () => {
    navList.classList.toggle("show");

    // Se for mobile e o item ainda não foi adicionado
    if (window.innerWidth <= 768 && !painelItem) {
      painelItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = "/login";
      link.textContent = "Painel do Jogador";

      painelItem.appendChild(link);
      navList.appendChild(painelItem);
    }
  });

  // ✅ Remover o item se redimensionar para desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && painelItem) {
      painelItem.remove();
      painelItem = null;
    }
  });
});
