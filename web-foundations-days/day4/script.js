const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

function updateCounts() {
    const text = noteText.value;
    const characterLength = text.length;
    
    // Calculate words (splitting by whitespace and filtering out empty strings)
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

    // Update text content
    charCount.textContent = `${characterLength} / 200 characters`;
    wordCount.textContent = `${words} words`;

    // Manage character limit warning and over classes
    charCount.classList.remove("warning", "over");
    if (characterLength > 200) {
        charCount.classList.add("over");
    } else if (characterLength > 180) {
        charCount.classList.add("warning");
    }
}

// Event Listeners for input changes
noteText.addEventListener("input", () => {
    updateCounts();
    localStorage.setItem("noteDraft", noteText.value);
});

// Clear button functionality
clearBtn.addEventListener("click", () => {
    noteText.value = "";
    localStorage.removeItem("noteDraft");
    updateCounts();
});

// Escape key functionality inside textarea
noteText.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        noteText.value = "";
        localStorage.removeItem("noteDraft");
        updateCounts();
    }
});

// Theme toggle functionality
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Page Load Initialization
window.addEventListener("DOMContentLoaded", () => {
    // Restore saved draft
    const savedDraft = localStorage.getItem("noteDraft");
    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    // Restore saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        themeToggle.textContent = "Dark mode";
    }

    // Initialize counts on load
    updateCounts();
});