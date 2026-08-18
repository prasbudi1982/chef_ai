document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const recipeForm = document.getElementById("recipeForm");
  const btnSubmit = document.getElementById("btnSubmit");
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");
  const recipeCard = document.getElementById("recipeCard");

  const recipeTitle = document.getElementById("recipeTitle");
  const recipeDescription = document.getElementById("recipeDescription");
  const badgeDifficulty = document.getElementById("badgeDifficulty");
  const badgeTime = document.getElementById("badgeTime");
  const badgeServings = document.getElementById("badgeServings");
  const ingredientsList = document.getElementById("ingredientsList");
  const stepsList = document.getElementById("stepsList");
  const tipsList = document.getElementById("tipsList");

  recipeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = document.getElementById("query").value.trim();
    const difficulty = document.getElementById("difficulty").value;
    const maxTime = document.getElementById("maxTime").value;
    const servings = document.getElementById("servings").value;

    if (!query) return;

    recipeCard.classList.add("hidden");
    errorState.classList.add("hidden");
    loadingState.classList.remove("hidden");
    btnSubmit.disabled = true;
    btnSubmit.classList.add("opacity-75", "cursor-not-allowed");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, difficulty, maxTime, servings })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memproses resep dari AI.");
      }

      renderRecipe(result.data);

    } catch (err) {
      errorMessage.textContent = err.message || "Terjadi masalah jaringan atau server.";
      errorState.classList.remove("hidden");
    } finally {
      loadingState.classList.add("hidden");
      btnSubmit.disabled = false;
      btnSubmit.classList.remove("opacity-75", "cursor-not-allowed");
    }
  });

  function renderRecipe(data) {
    recipeTitle.textContent = data.title;
    recipeDescription.textContent = data.description;
    badgeDifficulty.textContent = `Kesulitan: ${data.difficulty}`;
    badgeTime.innerHTML = `<i data-lucide="clock" class="w-3.5 h-3.5"></i> ${data.prepTime}`;
    badgeServings.innerHTML = `<i data-lucide="users" class="w-3.5 h-3.5"></i> ${data.servings}`;

    ingredientsList.innerHTML = data.ingredients
      .map(item => `
        <li class="flex items-start space-x-2.5">
          <span class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
          <span>${item}</span>
        </li>
      `).join('');

    stepsList.innerHTML = data.steps
      .map((step, idx) => `
        <li class="flex items-start space-x-3 text-sm text-slate-700 leading-relaxed">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
            ${idx + 1}
          </span>
          <p class="pt-0.5">${step}</p>
        </li>
      `).join('');

    tipsList.innerHTML = data.tips
      .map(tip => `
        <li class="flex items-start space-x-2">
          <span class="text-emerald-500 font-bold">•</span>
          <span>${tip}</span>
        </li>
      `).join('');

    lucide.createIcons();

    recipeCard.classList.remove("hidden");
    recipeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
