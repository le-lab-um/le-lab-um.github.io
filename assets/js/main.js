document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  fetch("assets/data.json")
    .then((response) => response.json())
    .then(async (data) => {
      const peopleContainers = document.querySelectorAll("[data-people-grid]");
      const projectContainer = document.querySelector("[data-projects-grid]");

      if (peopleContainers.length) {
        const projectMap = Object.fromEntries(
          (data.projetos || []).map((project) => [project.id, project.titulo || project.id])
        );

        const getGithubName = async (githubId) => {
          try {
            const response = await fetch(`https://api.github.com/users/${encodeURIComponent(githubId)}`);
            if (!response.ok) return githubId;

            const profile = await response.json();
            return profile.name?.trim() || profile.login || githubId;
          } catch {
            return githubId;
          }
        };

        const buildPerson = async (person, fallbackRole = "TBD") => {
          const localName = person.name?.trim();

          return {
            name: localName || await getGithubName(person.githubId),
            github: person.githubId,
            role: person.cargo || `Project: ${projectMap[person.projeto] || person.projeto || fallbackRole}`,
            position: person.position,
            image: ""
          };
        };

        const coordinators = await Promise.all((data.coordinators || [])
          .filter((person) => person.githubId)
          .map((person) => buildPerson(person, "Coordinator")));

        const rstudents = await Promise.all((data.rstudents || [])
          .filter((person) => person.githubId)
          .map((person) => buildPerson(person, "TBD")));

        const targetContainers = {
          coordinators: peopleContainers[0] || null,
          rstudents: peopleContainers[peopleContainers.length - 1] || null
        };

        [
          { key: "coordinators", list: coordinators },
          { key: "rstudents", list: rstudents }
        ].forEach(({ key, list }) => {
          const container = targetContainers[key];
          if (!container) return;

          list.forEach((person) => {
            const card = document.createElement("article");
            card.className = "card person-card";

            const imageSrc = person.image || `https://github.com/${person.github}.png`;
            const initials = person.name
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();

            const githubUrl = `https://github.com/${person.github}`;

            const body = document.createElement("div");
            body.className = "person-body";

            const heading = document.createElement("h3");
            heading.textContent = person.name;

            const photo = document.createElement("img");
            photo.className = "person-photo";
            photo.src = imageSrc;
            photo.alt = person.name;
            photo.onerror = () => {
              photo.onerror = null;
              photo.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1f4e79&color=fff&size=200`;
            };

            const role = document.createElement("p");
            role.textContent = person.role;

            const position = document.createElement("p");
            position.textContent = person.position;

            const link = document.createElement("a");
            link.className = "person-link";
            link.href = githubUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = `GitHub: @${person.github}`;

            body.append(heading, photo);
            if (person.position) body.append(position);
            body.append(role, link);
            card.append(body);

            container.appendChild(card);
          });
        });
      }

      if (projectContainer) {
        const projects = data.projetos || [];

        projects.forEach((project) => {
          const card = document.createElement("article");
          card.className = "card project-card";
          card.style.cursor = "pointer";

          const statusText = project.status || "In progress";
          const resultText = project.resultado || "TBD";
          const githubUrl = project.github || "#";

          card.innerHTML = `
            <span class="tag">${resultText}</span>
            <h3>${project.titulo || "Project"}</h3>
            <p>${project.descricao || "No project description available yet."}</p>
            <p class="project-meta">Status: <strong>${statusText}</strong></p>
          `;

          card.addEventListener("click", () => {
            if (githubUrl && githubUrl !== "#") {
              window.open(githubUrl, "_blank", "noopener,noreferrer");
            }
          });

          projectContainer.appendChild(card);
        });
      }
    })
    .catch((error) => {
      console.error("Failed to load people data:", error);
    });
});
