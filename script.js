const API_URL = "http://127.0.0.1:5000"; // URL del backend Flask

let provinceData = [];
let comuniData = [];

// 🔹 Funzione per aprire una modale
const openModal = (modal) => {
    modal.classList.add('show');
};

// 🔹 Funzione per chiudere una modale
const closeModal = (modal) => {
    modal.classList.remove('show');
};

// 📌 Riferimenti agli elementi per il login
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');

// 📌 Riferimenti agli elementi per la registrazione
const registerBtn = document.getElementById('registerBtn');
const registerModal = document.getElementById('registerModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const closeRegisterBtn = document.getElementById('closeRegisterBtn');

// 📌 Riferimento al pulsante "Prenota"
const bookNowBtn = document.getElementById("bookNowBtn");

// 📌 Aggiungi evento click per aprire la nuova pagina
if (bookNowBtn) {
    bookNowBtn.addEventListener("click", () => {
        window.location.href = "prenotazione/prenotazione.html"; // Reindirizza alla pagina di prenotazione
    });
}

// 📌 Riferimenti per le Hero Sections
const heroRegister = document.getElementById('hero-register');
const heroBook = document.getElementById('hero-book');

// 🔹 Apertura della modale di registrazione
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        openModal(registerModal); // Chiama la funzione per aprire la modale
    });
}

// 🔹 Chiusura della modale di registrazione
if (closeRegisterModal) {
    closeRegisterModal.addEventListener('click', () => {
        closeModal(registerModal); // Chiama la funzione per chiudere la modale
    });
}
if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener('click', () => {
        closeModal(registerModal); // Chiama la funzione per chiudere la modale
    });
}

// 🔹 Chiude la modale cliccando fuori dal contenuto
window.addEventListener('click', (event) => {
    if (event.target === registerModal) {
        closeModal(registerModal); // Chiude la modale se si clicca fuori
    }
});

// 🔹 Funzione per aggiornare la Hero Section
function updateHeroSection() {
    const isLoggedIn = localStorage.getItem("userToken"); // Controlla se l'utente è loggato

    if (isLoggedIn) {
        // Mostra la Hero Section "Prenota"
        heroRegister.style.display = "none";
        heroBook.style.display = "flex";
        updateLoginButton(true); // Aggiorna il pulsante Login
    } else {
        // Mostra la Hero Section "Registrati"
        heroRegister.style.display = "flex";
        heroBook.style.display = "none";
        updateLoginButton(false); // Aggiorna il pulsante Login
    }
}

// 🔹 Funzione per aggiornare il pulsante Login/Logout
function updateLoginButton(isLoggedIn) {
    if (isLoggedIn) {
        loginBtn.textContent = "Logout";
        loginBtn.onclick = logoutUser;
    } else {
        loginBtn.textContent = "Login";
        loginBtn.onclick = () => openModal(loginModal);
    }
}

// 🔹 Event listener per chiudere la modale (pulsante "Chiudi")
if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
        closeModal(loginModal); // Chiude la modale
    });
}


// 🔹 Chiude la modale cliccando fuori dal contenuto
window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        closeModal(loginModal); // Chiude la modale se si clicca fuori
    }
});


// 🔹 Funzione per registrare un utente tramite API Flask
async function registerUser() {
    const userData = {
        nome: document.getElementById("registerNome").value,
        cognome: document.getElementById("registerCognome").value,
        data_nascita: document.getElementById("registerDataNascita").value,
        sesso_biologico: document.getElementById("registerSesso").value,
        nazione_nascita: document.getElementById("registerNazione").value,
        provincia_nascita: document.getElementById("registerProvincia").value,
        comune_nascita: document.getElementById("registerComune").value,
        codice_fiscale: document.getElementById("registerCF").value,
        email: document.getElementById("registerEmail").value,
        cellulare: document.getElementById("registerCellulare").value,
        password: document.getElementById("registerPassword").value,
        conferma_password: document.getElementById("registerConfirmPassword").value
    };

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registrazione completata con successo!");
            closeModal(registerModal);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
    }

}

// 🔹 Funzione per caricare le nazioni europee
async function populateEuropeanCountries() {
    try {
        const response = await fetch("/european_countries.json"); // Percorso del file JSON
        if (!response.ok) {
            throw new Error("Impossibile caricare il file JSON");
        }
        const countries = await response.json(); // Legge e converte il file JSON in un array
        const countrySelect = document.getElementById("registerNazione");

        // Aggiunge ogni nazione come opzione nel menu a tendina
        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle nazioni:", error);
    }
}

// 🔹 Funzione per caricare le province e i comuni dai file JSON
async function loadProvinceAndComuni() {
    try {
        const [provinceResponse, comuniResponse] = await Promise.all([
            fetch("province.json"),
            fetch("comuni.json")
        ]);

        if (!provinceResponse.ok || !comuniResponse.ok) {
            throw new Error("Errore durante il caricamento dei dati JSON");
        }

        provinceData = await provinceResponse.json();
        comuniData = await comuniResponse.json();
    } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
    }
}

// 🔹 Popola il menu a tendina delle province italiane
function populateProvince() {
    const provinceSelect = document.getElementById("registerProvincia");
    provinceSelect.innerHTML = '<option value="" disabled selected>Seleziona una provincia</option>';

    // Aggiunge solo province italiane
    provinceData.forEach(province => {
        const option = document.createElement("option");
        option.value = province.id; // ID della provincia
        option.textContent = `${province.nome} (${province.siglaProvincia})`;
        provinceSelect.appendChild(option);
    });

    // Svuota il menu dei comuni
    document.getElementById("registerComune").innerHTML = '<option value="" disabled selected>Seleziona un comune</option>';
}




// 🔹 Popola il menu a tendina dei comuni in base alla provincia selezionata
function populateComuni(selectedProvinciaId) {
    const comuniSelect = document.getElementById("registerComune");
    comuniSelect.innerHTML = '<option value="" disabled selected>Seleziona un comune</option>';

    // Filtra i comuni per provincia
    const comuniFiltrati = comuniData.filter(comune => comune.idProvincia === parseInt(selectedProvinciaId));

    comuniFiltrati.forEach(comune => {
        const option = document.createElement("option");
        option.value = comune.id;
        option.textContent = comune.nome;
        comuniSelect.appendChild(option);
    });
}

// Event listener per il cambio di nazione
document.getElementById("registerNazione").addEventListener("change", function () {
    const selectedCountry = this.value;

    if (selectedCountry === "Italia") {
        populateProvince(); // Mostra le province italiane
    } else {
        // Svuota province e comuni
        document.getElementById("registerProvincia").innerHTML = '<option value="" disabled selected>Seleziona una provincia</option>';
        document.getElementById("registerComune").innerHTML = '<option value="" disabled selected>Seleziona un comune</option>';
    }
});

// Event listener per il cambio di provincia
document.getElementById("registerProvincia").addEventListener("change", function () {
    const selectedProvinciaId = this.value;
    populateComuni(selectedProvinciaId); // Mostra i comuni della provincia selezionata
});

// Carica i dati al caricamento della pagina
document.addEventListener("DOMContentLoaded", async () => {
    await loadProvinceAndComuni(); // Carica province e comuni
    updateHeroSection(); // Mostra la Hero Section corretta
    populateEuropeanCountries(); // Popola il menu delle nazioni
});

// 🔹 Funzione per il login tramite API Flask
async function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("userToken", data.token); // Salva il token JWT
            localStorage.setItem("userName", data.name); // Salva il nome dell'utente
            updateHeroSection(); // Aggiorna la sezione dopo il login
            closeModal(loginModal);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
    }
}

// 🔹 Funzione per il logout
function logoutUser() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    updateHeroSection(); // Aggiorna la sezione dopo il logout
}

// Chiama questa funzione al caricamento della pagina
document.addEventListener("DOMContentLoaded", async () => {
    await loadProvinceAndComuni(); // Carica i dati di province e comuni
    updateHeroSection(); // Aggiorna la Hero Section
    populateEuropeanCountries(); // Popola il menu delle nazioni
});