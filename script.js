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
    setup(root) {
      const buttons = root.querySelectorAll(".segmented button");
      const figures = root.querySelectorAll(".photo-grid figure");
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          buttons.forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          const filter = button.dataset.filter;
          figures.forEach((figure) => {
            figure.hidden = filter !== "all" && figure.dataset.kind !== filter;
          });
        });
      });
    },
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
      const button = root.querySelector("#addMemberButton");
      button.addEventListener("click", () => {
        button.textContent = "Member Added";
        setTimeout(() => {
          button.textContent = "Add Member";
        }, 1400);
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
