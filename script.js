const API_URL = "http://127.0.0.1:5000"; // URL del backend Flask

let provinceData = [], comuniData = [];
let isLoggedIn = false; // Controllo se l'utente è loggato

// 🔹 Funzione per aprire e chiudere una modale
const openModal = (modal) => $(modal).addClass('show');
const closeModal = (modal) => $(modal).removeClass('show');

$(document).ready(function () {
    isLoggedIn = !!localStorage.getItem("userToken"); // ✅ Controlla se l'utente è loggato
    updateLoginButton(isLoggedIn);
});

// Modifica il comportamento del pulsante "Il mio profilo"
$("#profileBtn").click(() => {
    window.location.href = "profilo.html"; // Reindirizza alla nuova pagina profilo
});

// 📌 Eventi per apertura e chiusura delle modali
$(document).ready(async function () {
    isLoggedIn = localStorage.getItem("userToken"); // Verifica se l'utente è loggato tramite token

    // Modifica il comportamento del login e della registrazione
    $("#loginBtn").click(() => isLoggedIn ? logoutUser() : openModal("#loginModal"));
    $("#registerBtn").click(() => openModal("#registerModal"));
    $("#closeLoginModal, #closeLoginBtn").click(() => closeModal("#loginModal"));
    $("#closeRegisterModal, #closeRegisterBtn").click(() => closeModal("#registerModal"));

    $(window).click((e) => {
        if ($(e.target).is("#loginModal")) closeModal("#loginModal");
        if ($(e.target).is("#registerModal")) closeModal("#registerModal");
    });

    await loadProvinceAndComuni();
    updateHeroSection();
    populateEuropeanCountries();
    loadProfessionals();

    // Aggiungi validazione per il campo cellulare
    $("#registerCellulare").on("input", function () {
        this.value = this.value.replace(/\D/g, ''); // Permette solo numeri
    });

    // Genera automaticamente il codice fiscale
    $("#registerNome, #registerCognome, #registerDataNascita, #registerSesso, #registerComune").on("input change", function () {
        generateCodiceFiscale();
    });
});

// Verifica disponibilità del medico
$(".verifica-disponibilita").click(function (e) {
    e.preventDefault(); // Impedisce il comportamento predefinito
    
    if (!isLoggedIn) {
        // Mostra la modal di login
        openModal("#loginModal");
    } else {
        // Se loggato, reindirizza alla pagina del calendario
        const doctorId = $(this).data("doctorid");
        window.location.href = `/prenotazione/prenotazione.html?doctorid=${doctorId}`;
    }
});

// Funzione per registrare un nuovo utente
async function registerUser() {
    const userData = {
        nome: $("#registerNome").val(),
        cognome: $("#registerCognome").val(),
        data_nascita: $("#registerDataNascita").val(),
        sesso_biologico: $("#registerSesso").val(),
        nazione_nascita: $("#registerNazione").val(),
        provincia_nascita: $("#registerProvincia").val(),
        comune_nascita: $("#registerComune").val(),
        codice_fiscale: $("#registerCF").val(),
        email: $("#registerEmail").val(),
        cellulare: $("#registerCellulare").val(),
        password: $("#registerPassword").val(),
        conferma_password: $("#registerConfirmPassword").val()
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
            closeModal("#registerModal");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
    }
}

function updateHeroSection() {
    isLoggedIn = !!localStorage.getItem("userToken");

    $("#hero-register").toggle(!isLoggedIn);
    $("#hero-book").toggle(isLoggedIn);
    updateLoginButton(isLoggedIn);

    // Mostra/nasconde il tasto "Il mio profilo"
    if (isLoggedIn) {
        $("#profileBtn").show();
    } else {
        $("#profileBtn").hide();
    }
}


// Funzione per aggiornare i pulsanti Login/Logout e Il Mio Profilo
function updateLoginButton(isLoggedIn) {
    $("#loginBtn").text(isLoggedIn ? "Logout" : "Login")
        .off("click")
        .click(isLoggedIn ? logoutUser : () => openModal("#loginModal"));

    // Mostra/nasconde il pulsante "Il mio profilo"
    if (isLoggedIn) {
        $("#profileBtn").show();
    } else {
        $("#profileBtn").hide();
    }
}

// Funzione per il login tramite API Flask
async function loginUser() {
    const email = $("#loginEmail").val();
    const password = $("#loginPassword").val();

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log("Dati ricevuti dal backend:", data); // Debug

        if (response.ok) {
            localStorage.setItem("userToken", data.token);
            localStorage.setItem("userId", data.user_id); // Salva l'ID utente
            localStorage.setItem("userName", data.name); // Salva il nome utente

            isLoggedIn = true;
            updateLoginButton(true); // ✅ Aggiorna i pulsanti
            closeModal("#loginModal"); // ✅ Chiude la modale

            // ✅ Ricarica la pagina per aggiornare l'interfaccia
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
    }
}


function updateLoginButton(isLoggedIn) {
    if (isLoggedIn) {
        $("#loginBtn").text("Logout")
            .off("click")
            .click(logoutUser);

        $("#profileBtn").show(); // ✅ Mostra il pulsante "Il mio profilo"
    } else {
        $("#loginBtn").text("Login")
            .off("click")
            .click(() => openModal("#loginModal"));

        $("#profileBtn").hide(); // ✅ Nasconde "Il mio profilo"
    }
}


// Funzione per il logout
function logoutUser() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    isLoggedIn = false;
    updateLoginButton(false);

    location.reload(); // ✅ Ricarica la pagina dopo il logout
}

// Funzione per caricare province e comuni
async function loadProvinceAndComuni() {
    try {
        const [provinceResponse, comuniResponse] = await Promise.all([
            fetch("province.json"), fetch("comuni.json")
        ]);

        if (!provinceResponse.ok || !comuniResponse.ok) throw new Error("Errore nel caricamento dati JSON");

        provinceData = await provinceResponse.json();
        comuniData = await comuniResponse.json();
    } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
    }
}

// Funzione per popolare il menu delle province italiane
function populateProvince() {
    const provinceSelect = $("#registerProvincia").html('<option value="" disabled selected>Seleziona una provincia</option>');

    provinceData.forEach(province => {
        provinceSelect.append(`<option value="${province.id}">${province.nome} (${province.siglaProvincia})</option>`);
    });

    $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
}

// Funzione per popolare il menu dei comuni in base alla provincia selezionata
function populateComuni(selectedProvinciaId) {
    const comuniSelect = $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');

    comuniData.filter(comune => comune.idProvincia == selectedProvinciaId).forEach(comune => {
        comuniSelect.append(`<option value="${comune.id}">${comune.nome}</option>`);
    });
}

// Funzione per caricare le nazioni europee
async function populateEuropeanCountries() {
    try {
        const response = await fetch("/european_countries.json");
        if (!response.ok) throw new Error("Impossibile caricare il file JSON");

        const countries = await response.json();
        const countrySelect = $("#registerNazione").html('<option value="" disabled selected>Seleziona una nazione</option>');

        countries.forEach(country => {
            countrySelect.append(`<option value="${country}">${country}</option>`);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle nazioni:", error);
    }
}

// Funzione per caricare i professionisti
function loadProfessionals() {
    $.get(`${API_URL}/api/professionals`, function (data) {
        let teamContainer = $(".team-members");
        teamContainer.empty(); // Pulisce il contenitore prima di aggiungere i nuovi dati

        data.forEach(professional => {
            let memberCard = `
                <div class="team-member">
                    <img src="images/${professional.immagine}" alt="${professional.nome}">
                    <h4>${professional.nome}</h4>
                    <span>${professional.specializzazione}</span>
                    <a class="verifica-disponibilita" data-doctorid="${professional.id}" href="#">Verifica disponibilità</a>
                </div>
            `;
            teamContainer.append(memberCard);
        });

        // Associa l'evento click alla nuova lista di elementi
        $(".verifica-disponibilita").click(function (e) {
            e.preventDefault();
            if (!isLoggedIn) {
                openModal("#loginModal");
            } else {
                const doctorId = $(this).data("doctorid");
                window.location.href = `/prenotazione/prenotazione.html?doctorid=${doctorId}`;
            }
        });
    }).fail(function () {
        console.error("Errore nel caricamento dei professionisti.");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const bookNowBtn = document.getElementById("bookNowBtn"); // Pulsante Prenota
    const teamSection = document.getElementById("team"); // Sezione Team

    if (bookNowBtn && teamSection) {
        bookNowBtn.addEventListener("click", function (event) {
            event.preventDefault(); // Impedisce il comportamento predefinito
            console.log("DEBUG: Scrolling alla sezione dei professionisti");
            
            teamSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadProvinceAndComuni();  // <-- Assicurati che venga chiamata qui
    populateProvince();
});

document.getElementById("registerProvincia").addEventListener("change", function () {
    populateComuni(this.value);
});