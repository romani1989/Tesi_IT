const API_URL = "http://127.0.0.1:5000"; // URL del backend Flask

let provinceData = [], comuniData = [];

// 🔹 Funzione per aprire e chiudere una modale
const openModal = (modal) => $(modal).addClass('show');
const closeModal = (modal) => $(modal).removeClass('show');
let isLoggedIn=false;
// 📌 Eventi per apertura e chiusura delle modali
$(document).ready(async function () {
    isLoggedIn = localStorage.getItem("userToken");

    $("#loginBtn").click(() => isLoggedIn ? logoutUser() : openModal("#loginModal"));
    $("#registerBtn").click(() => openModal("#registerModal"));
    $("#closeLoginModal, #closeLoginBtn").click(() => closeModal("#loginModal"));
    $("#closeRegisterModal, #closeRegisterBtn").click(() => closeModal("#registerModal"));
    
    $(window).click((e) => {
        if ($(e.target).is("#loginModal")) closeModal("#loginModal");
        if ($(e.target).is("#registerModal")) closeModal("#registerModal");
    });

    $("#bookNowBtn").click(() => window.location.href = "prenotazione/prenotazione.html");
    
    await loadProvinceAndComuni();
    updateHeroSection();
    populateEuropeanCountries();
    loadProfessionals();
});

$(".verifica-disponibilita").click(function (e) {
    console.log(isLoggedIn);
    
    e.preventDefault();
    if (!isLoggedIn) {
        // Mostra la modal di login correttamente
        openModal("#loginModal")
    } else {
        // Se loggato, reindirizza alla pagina del calendario
        const doctorId = $(this).data("doctorid");
        window.location.href = `/prenotazione/prenotazione.html?doctorid=${doctorId}`;
    }
});

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
}

// 🔹 Aggiorna il pulsante Login/Logout
function updateLoginButton(isLoggedIn) {
    $("#loginBtn").text(isLoggedIn ? "Logout" : "Login").off("click").click(isLoggedIn ? logoutUser : () => openModal("#loginModal"));
}

// 🔹 Funzione per il login tramite API Flask
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
        
        if (response.ok) {
            localStorage.setItem("userToken", data.token);
            localStorage.setItem("userName", data.name);
            updateHeroSection();
            closeModal("#loginModal");
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
    updateHeroSection();
}

// 🔹 Funzione per caricare province e comuni
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

// 🔹 Popola il menu delle province italiane
function populateProvince() {
    const provinceSelect = $("#registerProvincia").html('<option value="" disabled selected>Seleziona una provincia</option>');
    
    provinceData.forEach(province => {
        provinceSelect.append(`<option value="${province.id}">${province.nome} (${province.siglaProvincia})</option>`);
    });
    
    $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
}

// 🔹 Popola il menu dei comuni in base alla provincia selezionata
function populateComuni(selectedProvinciaId) {
    const comuniSelect = $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
    
    comuniData.filter(comune => comune.idProvincia == selectedProvinciaId).forEach(comune => {
        comuniSelect.append(`<option value="${comune.id}">${comune.nome}</option>`);
    });
}

// 🔹 Eventi per selezione nazione e provincia
$("#registerNazione").change(function () {
    $("#registerProvincia, #registerComune").html('<option value="" disabled selected>Seleziona</option>');
    if ($(this).val() === "Italia") populateProvince();
});

$("#registerProvincia").change(function () {
    populateComuni($(this).val());
});

// 🔹 Carica le nazioni europee
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
    }).fail(function () {
        console.error("Errore nel caricamento dei professionisti.");
    });
}