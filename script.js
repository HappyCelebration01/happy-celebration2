const panels = {
  book: {
    title: "Book Event",
    kicker: "Reservation",
    template: "bookTemplate",
    setup(root) {
      const form = root.querySelector("#bookingForm");
      const note = root.querySelector("#bookingNote");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        localStorage.setItem("happyCelebrationBooking", JSON.stringify(data));
        note.textContent = "Booking request saved. We will contact you shortly.";
      });
    },
  },
  gallery: {
    title: "Gallery",
    kicker: "Memories",
    template: "galleryTemplate",
  },
  about: {
    title: "About Us",
    kicker: "Our Story",
    template: "aboutTemplate",
  },
  family: {
    title: "Family Tree",
    kicker: "Generations",
    template: "familyTemplate",
    setup(root) {
      const form = root.querySelector("#familyRootForm");
      const board = root.querySelector("#familyBoard");
      const note = root.querySelector("#familyNote");
      const clearButton = root.querySelector("#clearFamilyButton");
      const storageKey = "happyCelebrationSimpleFamily";

      function escapeHtml(value) {
        if (!value) return "";
        return value.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }[char]));
      }

      function loadFamilies() {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
          return Array.isArray(saved) ? saved : [];
        } catch (error) {
          return [];
        }
      }

      function saveFamilies(families) {
        localStorage.setItem(storageKey, JSON.stringify(families));
      }

      function createId() {
        return `family_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }

      function renderFamilies() {
        const families = loadFamilies();
        clearButton.hidden = families.length === 0;

        if (!families.length) {
          board.innerHTML = '<p class="empty-tree">Add a name to start the family tree.</p>';
          return;
        }

        board.innerHTML = families.map((family) => {
          const children = family.children || [];
          const spouseSection = family.spouse ? `
            <div class="family-person spouse-person">
              <span class="person-label">Spouse</span>
              <strong>${escapeHtml(family.spouse)}</strong>
            </div>
          ` : `
            <form class="inline-family-form spouse-form" data-action="add-spouse" data-id="${family.id}">
              <label>
                <span>Spouse Name</span>
                <input name="spouseName" type="text" placeholder="Enter spouse name" required autocomplete="off">
              </label>
              <button class="secondary-action" type="submit">Add Spouse</button>
            </form>
          `;

          const childrenSection = family.spouse ? `
            <div class="children-section">
              <h4>Children</h4>
              ${children.length ? `
                <div class="children-list">
                  ${children.map((child) => `<span>${escapeHtml(child)}</span>`).join("")}
                </div>
              ` : '<p class="empty-children">No children added yet.</p>'}
              <form class="inline-family-form child-form" data-action="add-child" data-id="${family.id}">
                <label>
                  <span>Child Name</span>
                  <input name="childName" type="text" placeholder="Enter child name" required autocomplete="off">
                </label>
                <button class="secondary-action" type="submit">Add Child</button>
              </form>
            </div>
          ` : '<p class="family-step-note">Add spouse name to continue with children.</p>';

          return `
            <section class="simple-family-card" data-id="${family.id}">
              <div class="couple-row">
                <div class="family-person main-person">
                  <span class="person-label">Name</span>
                  <strong>${escapeHtml(family.name)}</strong>
                </div>
                ${spouseSection}
              </div>
              ${childrenSection}
            </section>
          `;
        }).join("");
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const name = data.rootName.trim();
        if (!name) return;

        const families = loadFamilies();
        families.push({
          id: createId(),
          name,
          spouse: "",
          children: [],
        });
        saveFamilies(families);
        note.textContent = `${name} added. Add spouse name below.`;
        form.reset();
        renderFamilies();
      });

      board.addEventListener("submit", (event) => {
        const inlineForm = event.target.closest(".inline-family-form");
        if (!inlineForm) return;
        event.preventDefault();

        const families = loadFamilies();
        const family = families.find((item) => item.id === inlineForm.dataset.id);
        if (!family) return;

        const data = Object.fromEntries(new FormData(inlineForm));
        if (inlineForm.dataset.action === "add-spouse") {
          const spouseName = data.spouseName.trim();
          if (!spouseName) return;
          family.spouse = spouseName;
          note.textContent = `Couple completed. You can add children now.`;
        }

        if (inlineForm.dataset.action === "add-child") {
          const childName = data.childName.trim();
          if (!childName) return;
          family.children = family.children || [];
          family.children.push(childName);
          note.textContent = `${childName} added as child.`;
        }

        saveFamilies(families);
        renderFamilies();
      });

      clearButton.addEventListener("click", () => {
        if (!confirm("Clear the family tree?")) return;
        localStorage.removeItem(storageKey);
        note.textContent = "Family tree cleared.";
        renderFamilies();
      });

      renderFamilies();
    },
  },
  register: {
    title: "Register",
    kicker: "Guest Entry",
    template: "registerTemplate",
    setup(root) {
      const form = root.querySelector("#registerForm");
      const note = root.querySelector("#registerNote");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        localStorage.setItem("happyCelebrationRegistration", JSON.stringify(data));
        note.textContent = `${data.fullName} is registered.`;
        form.reset();
      });
    },
  },
  contact: {
    title: "Contact Us",
    kicker: "Support",
    template: "contactTemplate",
  },
};

const homeView = document.querySelector("#homeView");
const panelView = document.querySelector("#panelView");
const panelTitle = document.querySelector("#panelTitle");
const panelKicker = document.querySelector("#panelKicker");
const panelContent = document.querySelector("#panelContent");
const backButton = document.querySelector("#backButton");

function openPanel(name) {
  const panel = panels[name];
  if (!panel) return;

  const template = document.querySelector(`#${panel.template}`);
  if (!template) return;

  panelTitle.textContent = panel.title;
  panelKicker.textContent = panel.kicker;
  panelContent.replaceChildren(template.content.cloneNode(true));
  homeView.classList.remove("active");
  panelView.classList.add("active");

  try {
    panel.setup?.(panelContent);
  } catch (error) {
    console.error(`${panel.title} panel setup failed:`, error);
  }
}

function closePanel() {
  panelView.classList.remove("active");
  homeView.classList.add("active");
}

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

backButton.addEventListener("click", closePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panelView.classList.contains("active")) {
    closePanel();
  }
});
