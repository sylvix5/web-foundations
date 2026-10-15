document.addEventListener("DOMContentLoaded", () => {
    const loadButton = document.getElementById("load-users");
    const filterInput = document.getElementById("filter-input");
    const statusEl = document.getElementById("status");
    const usersListEl = document.getElementById("users-list");

    let allUsers = []; // Stores the loaded users array

    // Function to render any array of users to the DOM
    function renderUsers(users) {
        usersListEl.innerHTML = ""; // Clear existing list

        if (users.length === 0) {
            statusEl.textContent = "No users match your filter.";
            return;
        }

        users.forEach(user => {
            const li = document.createElement("li");
            
            const nameEl = document.createElement("strong");
            nameEl.textContent = user.name;

            const detailsEl = document.createElement("p");
            // Displays name, email, city, and company name
            detailsEl.textContent = `Email: ${user.email} | City: ${user.address.city} | Company: ${user.company.name}`;

            li.appendChild(nameEl);
            li.appendChild(detailsEl);
            usersListEl.appendChild(li);
        });
    }

    // Async function to load users using fetch, try/catch/finally
    async function loadUsers() {
        loadButton.disabled = true;
        statusEl.textContent = "Loading users...";
        usersListEl.innerHTML = "";

        try {
            const response = await fetch("https://jsonplaceholder.typicode.com/users");
            
            // Check response.ok explicitly
            if (!response.ok) {
                throw new Error(`Failed to fetch users: HTTP status ${response.status}`);
            }

            allUsers = await response.json();
            statusEl.textContent = `Successfully loaded ${allUsers.length} users.`;
            renderUsers(allUsers);
        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
        } finally {
            loadButton.disabled = false;
        }
    }

    // Event listener for loading users
    loadButton.addEventListener("click", loadUsers);

    // Event listener for live filtering without making new network requests
    filterInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        const filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm)
        );

        renderUsers(filteredUsers);
    });
});