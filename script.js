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
      const form = root.querySelector("#familyMemberForm");
      const board = root.querySelector("#familyBoard");
      const note = root.querySelector("#familyNote");
      const savedMembers = JSON.parse(localStorage.getItem("happyCelebrationFamily") || "[]");

      function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }[char]));
      }

      function renderFamilyTree(members) {
        if (!members.length) {
          board.innerHTML = '<p class="empty-tree">Add family members to form the tree.</p>';
          return;
        }

        const groups = ["Grandparent", "Parent", "Child", "Family Member"].map((relation) => ({
          relation,
          members: members.filter((member) => member.relation === relation),
        })).filter((group) => group.members.length);

        board.innerHTML = groups.map((group) => `
          <div class="tree-level">
            <strong>${group.relation}</strong>
            <div class="tree-members">
              ${group.members.map((member) => `<span>${escapeHtml(member.name)}</span>`).join("")}
            </div>
          </div>
        `).join("");
      }

      renderFamilyTree(savedMembers);

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const members = JSON.parse(localStorage.getItem("happyCelebrationFamily") || "[]");
        members.push({
          name: data.memberName.trim(),
          relation: data.relation,
        });
        localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
        renderFamilyTree(members);
        note.textContent = `${data.memberName} added to family tree.`;
        form.reset();
      });
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
  panelTitle.textContent = panel.title;
  panelKicker.textContent = panel.kicker;
  panelContent.replaceChildren(template.content.cloneNode(true));
  panel.setup?.(panelContent);
  homeView.classList.remove("active");
  panelView.classList.add("active");
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
