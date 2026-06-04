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

      try {
        // Tab elements
        const editorTabBtn = root.querySelector("#editorTabBtn");
        const previewTabBtn = root.querySelector("#previewTabBtn");
        const familyEditorView = root.querySelector("#familyEditorView");
        const familyPreviewView = root.querySelector("#familyPreviewView");
        const addMemberBtn = root.querySelector("#addMemberBtn");
        const membersListList = root.querySelector("#membersListList");

        // Canvas & Zoom controls
        const treeCanvas = root.querySelector("#treeCanvas");
        const treeCanvasWrapper = root.querySelector("#treeCanvasWrapper");
        const clearTreeBtn = root.querySelector("#clearTreeBtn");
        const zoomLabel = root.querySelector("#zoomLabel");
        const zoomInBtn = root.querySelector("#zoomInBtn");
        const zoomOutBtn = root.querySelector("#zoomOutBtn");
        const zoomFitBtn = root.querySelector("#zoomFitBtn");

        // Modal elements
        const treeModal = root.querySelector("#treeModal");
        const modalTitle = root.querySelector("#modalTitle");
        const modalForm = root.querySelector("#modalForm");
        const modalActionType = root.querySelector("#modalActionType");
        const modalTargetId = root.querySelector("#modalTargetId");
        const modalName = root.querySelector("#modalName");
        
        const modalMaleBtn = root.querySelector("#modalMaleBtn");
        const modalFemaleBtn = root.querySelector("#modalFemaleBtn");
        const modalRelationsSection = root.querySelector("#modalRelationsSection");
        const modalAddSpouseBtn = root.querySelector("#modalAddSpouseBtn");
        const modalAddChildBtn = root.querySelector("#modalAddChildBtn");
        
        const modalSubmitBtn = root.querySelector("#modalSubmitBtn");
        const modalCancelBtn = root.querySelector("#modalCancelBtn");
        const modalDeleteBtn = root.querySelector("#modalDeleteBtn");

        let members = [];
        try {
          const raw = localStorage.getItem("happyCelebrationFamily");
          members = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(members)) {
            members = [];
          }
        } catch (e) {
          members = [];
        }

        // Migration logic for old fields
        let migrated = false;
        members = members.map(m => {
          if (!m || typeof m !== "object") return null;
          let needsUpdate = false;
          const updated = { ...m };
          if (!updated.id) {
            updated.id = "mem_" + Math.random().toString(36).substr(2, 9);
            needsUpdate = true;
          }
          if (!updated.gender) {
            const lowerRelation = (updated.relation || "").toLowerCase();
            if (lowerRelation.includes("grandma") || lowerRelation.includes("mother") || lowerRelation.includes("daughter") || lowerRelation.includes("wife") || lowerRelation.includes("aunt") || lowerRelation.includes("female")) {
              updated.gender = "Female";
            } else {
              updated.gender = "Male";
            }
            needsUpdate = true;
          }
          if (updated.spouseId === undefined) {
            updated.spouseId = "";
            needsUpdate = true;
          }
          if (updated.parentId === undefined) {
            updated.parentId = "";
            needsUpdate = true;
          }
          if (needsUpdate) {
            migrated = true;
          }
          return updated;
        }).filter(Boolean);

        if (migrated) {
          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
        }

        // Tab Switching Event Listeners
        editorTabBtn.addEventListener("click", () => {
          editorTabBtn.classList.add("active");
          previewTabBtn.classList.remove("active");
          familyEditorView.style.display = "flex";
          familyPreviewView.style.display = "none";
          renderMemberList();
        });

        previewTabBtn.addEventListener("click", () => {
          previewTabBtn.classList.add("active");
          editorTabBtn.classList.remove("active");
          familyEditorView.style.display = "none";
          familyPreviewView.style.display = "block";
          renderTree();
          
          // Apply Auto-Fit zoom calculation on preview load
          setTimeout(fitToScreen, 50);
        });

        // Zoom functionality
        let zoomLevel = 1.0;
        
        function applyZoom() {
          treeCanvas.style.transform = `scale(${zoomLevel})`;
          treeCanvas.style.transformOrigin = "top center";
          zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
        }

        zoomInBtn.addEventListener("click", () => {
          zoomLevel = Math.min(2.0, zoomLevel + 0.1);
          applyZoom();
        });

        zoomOutBtn.addEventListener("click", () => {
          zoomLevel = Math.max(0.3, zoomLevel - 0.1);
          applyZoom();
        });

        function fitToScreen() {
          if (!members.length) {
            zoomLevel = 1.0;
            applyZoom();
            return;
          }
          
          // Reset transform temporarily to measure natural width
          treeCanvas.style.transform = "none";
          const wrapperWidth = treeCanvasWrapper.clientWidth;
          const canvasWidth = treeCanvas.scrollWidth || treeCanvas.offsetWidth;
          
          if (canvasWidth > wrapperWidth && wrapperWidth > 0) {
            // Apply scale ratio with small margin padding
            zoomLevel = Math.max(0.3, Math.min(1.0, (wrapperWidth - 24) / canvasWidth));
          } else {
            zoomLevel = 1.0;
          }
          applyZoom();
        }

        zoomFitBtn.addEventListener("click", fitToScreen);

        // Editor Add Member button click
        addMemberBtn.addEventListener("click", () => {
          openModal("add-root");
        });

        // Functions for Modal Management
        function openModal(actionType, targetId = "") {
          modalActionType.value = actionType;
          modalTargetId.value = targetId;
          
          modalName.value = "";
          
          if (actionType === "add-root") {
            modalTitle.textContent = "Add Root Member";
            setGenderSelection("Male");
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "edit") {
            const member = members.find(m => m.id === targetId);
            if (member) {
              modalTitle.textContent = `Edit ${member.name}`;
              modalName.value = member.name;
              setGenderSelection(member.gender);
              
              modalRelationsSection.style.display = "flex";
              if (member.spouseId) {
                modalAddSpouseBtn.style.display = "none";
              } else {
                modalAddSpouseBtn.style.display = "block";
              }
              
              // Only allow adding children if not at the lowest generation level
              if (member.relation === "Child") {
                modalAddChildBtn.style.display = "none";
              } else {
                modalAddChildBtn.style.display = "block";
              }
              
              modalDeleteBtn.style.display = "block";
            }
          } else if (actionType === "add-spouse") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Spouse to ${member ? member.name : ''}`;
            const spouseGender = member && member.gender === "Male" ? "Female" : "Male";
            setGenderSelection(spouseGender);
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-child") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Child to ${member ? member.name : ''}`;
            setGenderSelection("Male");
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          }
          
          treeModal.style.display = "flex";
        }

        function closeModal() {
          treeModal.style.display = "none";
          modalForm.reset();
        }

        function setGenderSelection(gender) {
          const maleRadio = modalForm.querySelector('input[value="Male"]');
          const femaleRadio = modalForm.querySelector('input[value="Female"]');
          if (gender === "Male") {
            maleRadio.checked = true;
            modalMaleBtn.classList.add("active");
            modalFemaleBtn.classList.remove("active");
          } else {
            femaleRadio.checked = true;
            modalFemaleBtn.classList.add("active");
            modalMaleBtn.classList.remove("active");
          }
        }

        modalMaleBtn.addEventListener("click", () => {
          setGenderSelection("Male");
        });
        modalFemaleBtn.addEventListener("click", () => {
          setGenderSelection("Female");
        });

        modalAddSpouseBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          openModal("add-spouse", targetId);
        });

        modalAddChildBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          openModal("add-child", targetId);
        });

        modalCancelBtn.addEventListener("click", closeModal);

        function deleteMember(targetId) {
          members = members.filter(m => m.id !== targetId);
          members.forEach(m => {
            if (m.spouseId === targetId) m.spouseId = "";
            if (m.parentId === targetId) m.parentId = "";
          });
          
          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
          renderMemberList();
          renderTree();
        }

        modalDeleteBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          const targetMember = members.find(m => m.id === targetId);
          if (targetMember && confirm(`Are you sure you want to delete ${targetMember.name}?`)) {
            deleteMember(targetId);
            closeModal();
          }
        });

        clearTreeBtn.addEventListener("click", () => {
          if (confirm("Are you sure you want to clear the entire family tree?")) {
            members = [];
            localStorage.removeItem("happyCelebrationFamily");
            renderMemberList();
            renderTree();
          }
        });

        // Form submit handler
        modalForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const action = modalActionType.value;
          const targetId = modalTargetId.value;
          const name = modalName.value.trim();
          const gender = modalForm.querySelector('input[name="modalGender"]:checked').value;

          if (!name) return;

          if (action === "add-root") {
            const rootMember = {
              id: "mem_" + Math.random().toString(36).substr(2, 9),
              name,
              gender,
              relation: "Grandparent",
              spouseId: "",
              parentId: ""
            };
            members.push(rootMember);
          } else if (action === "edit") {
            const member = members.find(m => m.id === targetId);
            if (member) {
              member.name = name;
              member.gender = gender;
            }
          } else if (action === "add-spouse") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
              const spouseMember = {
                id: spouseId,
                name,
                gender,
                relation: targetMember.relation,
                spouseId: targetMember.id,
                parentId: targetMember.parentId
              };
              targetMember.spouseId = spouseId;
              members.push(spouseMember);
            }
          } else if (action === "add-child") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const childId = "mem_" + Math.random().toString(36).substr(2, 9);
              const childRelation = targetMember.relation === "Grandparent" ? "Parent" : "Child";
              const childMember = {
                id: childId,
                name,
                gender,
                relation: childRelation,
                spouseId: "",
                parentId: targetMember.id
              };
              members.push(childMember);
            }
          }

          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
          closeModal();
          renderMemberList();
          renderTree();
        });

        // Event delegation on treeCanvas to catch circular node clicks
        treeCanvas.addEventListener("click", (e) => {
          const card = e.target.closest(".tree-node-card");
          if (card) {
            const memberId = card.dataset.id;
            openModal("edit", memberId);
            return;
          }
          
          const addFirstBtn = e.target.closest("#addFirstMemberBtn");
          if (addFirstBtn) {
            openModal("add-root");
          }
        });

        // Render member rows list inside the Editor tab
        function renderMemberList() {
          if (!members.length) {
            membersListList.innerHTML = `
              <div class="empty-tree-container" style="padding: 32px 16px;">
                <p class="empty-tree-message">Your family tree is empty. Add the first member to begin!</p>
              </div>
            `;
            return;
          }
          
          membersListList.innerHTML = members.map(m => {
            const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const genderClass = m.gender.toLowerCase();
            return `
              <div class="member-row-card">
                <div class="member-row-info">
                  <div class="member-row-avatar ${genderClass}">${initials}</div>
                  <div class="member-row-details">
                    <span class="member-row-name">${escapeHtml(m.name)}</span>
                    <span class="member-row-relation">${escapeHtml(m.relation)} (${m.gender === 'Male' ? 'M' : 'F'})</span>
                  </div>
                </div>
                <div class="member-row-actions">
                  <button type="button" class="secondary-action edit-row-btn" data-id="${m.id}">Edit</button>
                  <button type="button" class="danger-action delete-row-btn" data-id="${m.id}">Delete</button>
                </div>
              </div>
            `;
          }).join("");
          
          // Bind click listeners
          membersListList.querySelectorAll(".edit-row-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              openModal("edit", btn.dataset.id);
            });
          });
          
          membersListList.querySelectorAll(".delete-row-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              const targetId = btn.dataset.id;
              const targetMember = members.find(m => m.id === targetId);
              if (targetMember && confirm(`Are you sure you want to delete ${targetMember.name}?`)) {
                deleteMember(targetId);
              }
            });
          });
        }

        // Tree structure builder
        function buildTree(membersList) {
          const nodeMap = {};
          const treeNodes = [];
          const processedIds = new Set();
          
          // Group spouses into Couples, and separate Singles
          membersList.forEach(m => {
            if (processedIds.has(m.id)) return;
            
            if (m.spouseId) {
              const spouse = membersList.find(s => s.id === m.spouseId);
              if (spouse) {
                const coupleNode = {
                  type: "couple",
                  id: m.id,
                  member1: m,
                  member2: spouse,
                  children: []
                };
                nodeMap[m.id] = coupleNode;
                nodeMap[spouse.id] = coupleNode;
                treeNodes.push(coupleNode);
                processedIds.add(m.id);
                processedIds.add(spouse.id);
                return;
              }
            }
            
            const singleNode = {
              type: "single",
              id: m.id,
              member: m,
              children: []
            };
            nodeMap[m.id] = singleNode;
            treeNodes.push(singleNode);
            processedIds.add(m.id);
          });
          
          // Build tree connections
          const roots = [];
          treeNodes.forEach(node => {
            let pId = "";
            if (node.type === "couple") {
              pId = node.member1.parentId || node.member2.parentId || "";
            } else {
              pId = node.member.parentId || "";
            }
            
            if (pId && nodeMap[pId]) {
              if (!nodeMap[pId].children.includes(node)) {
                nodeMap[pId].children.push(node);
              }
            } else {
              roots.push(node);
            }
          });
          
          // Sort roots and child collections
          const order = { "Grandparent": 1, "Parent": 2, "Child": 3 };
          const sortNodes = (a, b) => {
            const aRel = a.type === "couple" ? a.member1.relation : a.member.relation;
            const bRel = b.type === "couple" ? b.member1.relation : b.member.relation;
            const relationDiff = (order[aRel] || 4) - (order[bRel] || 4);
            if (relationDiff !== 0) return relationDiff;
            
            const aName = a.type === "couple" ? a.member1.name : a.member.name;
            const bName = b.type === "couple" ? b.member1.name : b.member.name;
            return aName.localeCompare(bName);
          };
          
          roots.sort(sortNodes);
          treeNodes.forEach(n => {
            n.children.sort(sortNodes);
          });
          
          return roots;
        }

        function renderCardHTML(m) {
          const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const genderClass = m.gender.toLowerCase();
          return `
            <div class="tree-node-card circular ${genderClass}" data-id="${m.id}">
              <div class="node-avatar">${initials}</div>
              <div class="node-details">
                <span class="node-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>
                <span class="node-relation">${escapeHtml(m.relation)}</span>
              </div>
            </div>
          `;
        }

        function renderNodeHTML(node) {
          const hasChildren = node.children && node.children.length > 0;
          let headerHTML = "";
          
          if (node.type === "couple") {
            headerHTML = `
              <div class="tree-couple">
                ${renderCardHTML(node.member1)}
                <div class="spouse-bridge"></div>
                ${renderCardHTML(node.member2)}
              </div>
            `;
          } else {
            headerHTML = renderCardHTML(node.member);
          }
          
          return `
            <div class="tree-branch ${hasChildren ? "has-children" : ""}">
              ${headerHTML}
              ${hasChildren ? `
                <div class="tree-children-container">
                  ${node.children.map(child => renderNodeHTML(child)).join("")}
                </div>
              ` : ""}
            </div>
          `;
        }

        function renderTree() {
          if (!members.length) {
            treeCanvas.innerHTML = `
              <div class="empty-tree-container">
                <p class="empty-tree-message">Your family tree is empty. Add the first member to begin!</p>
                <button type="button" class="primary-action" id="addFirstMemberBtn">Add First Member</button>
              </div>
            `;
            return;
          }
          
          const roots = buildTree(members);
          treeCanvas.innerHTML = roots.map(rootNode => renderNodeHTML(rootNode)).join("");
        }

        // Initial render
        renderMemberList();
        renderTree();

      } catch (err) {
        console.error("Family panel error:", err);
        root.innerHTML = `
          <div style="padding: 16px; margin: 16px; border: 1px solid rgba(255, 74, 90, 0.4); border-radius: 12px; background: rgba(255, 74, 90, 0.1); color: #ff9aa2; font-size: 13px; line-height: 1.5;">
            <h4 style="margin: 0 0 8px; font-size: 15px; color: #ff4a5a;">Family Panel Setup Failed</h4>
            <p style="margin: 0 0 12px;">An error occurred while loading your family tree configuration.</p>
            <pre style="margin: 0 0 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 11px; color: #ffebec;">${escapeHtml(err.message)}\n\n${escapeHtml(err.stack)}</pre>
            <button id="resetStorageBtn" style="padding: 8px 16px; background: #ff4a5a; color: #fff; border: 0; border-radius: 999px; font-weight: 700; cursor: pointer; transition: background 0.2s;">Reset State & Reload</button>
          </div>
        `;
        setTimeout(() => {
          const resetBtn = root.querySelector("#resetStorageBtn");
          if (resetBtn) {
            resetBtn.addEventListener("click", () => {
              localStorage.removeItem("happyCelebrationFamily");
              window.location.reload();
            });
          }
        }, 50);
      }
    }
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
