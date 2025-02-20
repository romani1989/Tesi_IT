const API_URL = "http://127.0.0.1:5000";

let provinceData = [], comuniData = [];
let isLoggedIn = false; 


const openModal = (modal) => $(modal).addClass('show');
const closeModal = (modal) => $(modal).removeClass('show');

$(document).ready(function () {
    isLoggedIn = !!localStorage.getItem("userToken"); 
    updateLoginButton(isLoggedIn);
});


$("#profileBtn").click(() => {
    window.location.href = "/profilo/profilo.html";  
});


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
    
    await loadProvinceAndComuni();
    updateHeroSection();
    populateEuropeanCountries();
    loadProfessionals();
    
    
    $("#registerCellulare").on("input", function () {
        this.value = this.value.replace(/\D/g, ''); 
    });
    
    
    $("#registerNome, #registerCognome, #registerDataNascita, #registerSesso, #registerComune").on("input change", function () {
        ;
    });
});


$(".verifica-disponibilita").click(function (e) {
    e.preventDefault(); 
    
    if (!isLoggedIn) {
        
        openModal("#loginModal");
    } else {
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
        conferma_password: $("#registerConfirmPassword").val(),
        consenso_trattamento_dati: $("#registerConsenso").is(":checked")  // Restituisce true se selezionato, altrimenti false
    };
    
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Registrazione completata, Benvenuto su Healthy Hub!',
                text: 'Ora puoi accedere con le tue credenziali.',
                confirmButtonText: 'OK'
            }).then(() => {
                closeModal("#registerModal");
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Errore durante la registrazione',
                text: data.message || 'Si è verificato un errore, riprova più tardi.',
                confirmButtonText: 'Riprova'
            });
        }
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
        Swal.fire({
            icon: 'error',
            title: 'Errore di connessione',
            text: 'Non è stato possibile completare la registrazione. Verifica la connessione e riprova.',
            confirmButtonText: 'OK'
        });
    }
}

function updateHeroSection() {
    isLoggedIn = !!localStorage.getItem("userToken");
    
    $("#hero-register").toggle(!isLoggedIn);
    $("#hero-book").toggle(isLoggedIn);
    updateLoginButton(isLoggedIn);
    
    
    if (isLoggedIn) {
        $("#profileBtn").show();
    } else {
        $("#profileBtn").hide();
    }
}


function updateLoginButton(isLoggedIn) {
    $("#loginBtn").text(isLoggedIn ? "Logout" : "Login")
    .off("click")
    .click(isLoggedIn ? logoutUser : () => openModal("#loginModal"));
    
    
    if (isLoggedIn) {
        $("#profileBtn").show();
    } else {
        $("#profileBtn").hide();
    }
}


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
        console.log("Dati ricevuti dal backend:", data);
        
        if (response.ok) {
            localStorage.setItem("userToken", data.token);
            localStorage.setItem("userId", data.user_id);
            localStorage.setItem("userName", data.name);
            
            isLoggedIn = true;
            updateLoginButton(true);
            closeModal("#loginModal");
            
            Swal.fire({
                icon: 'success',
                title: 'Login effettuato con successo!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                location.reload(); // Ricarica la pagina dopo il messaggio di successo
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Errore di autenticazione',
                text: data.message || 'Si è verificato un errore durante il login. Per favore riprova.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
        Swal.fire({
            icon: 'error',
            title: 'Errore di connessione',
            text: 'Impossibile connettersi al server. Verifica la tua connessione e riprova.',
            confirmButtonText: 'OK'
        });
    }
}


function updateLoginButton(isLoggedIn) {
    if (isLoggedIn) {
        $("#loginBtn").text("Logout")
        .off("click")
        .click(logoutUser);
        
        $("#profileBtn").show(); 
    } else {
        $("#loginBtn").text("Login")
        .off("click")
        .click(() => openModal("#loginModal"));
        
        $("#profileBtn").hide(); 
    }
}



function logoutUser() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    
    isLoggedIn = false;
    updateLoginButton(false);
    
    location.reload(); 
}


async function loadProvinceAndComuni() {
    try {
        const [provinceResponse, comuniResponse] = await Promise.all([
            fetch("/assets/json/province.json"), 
            fetch("/assets/json/comuni.json")
        ]);
        
        if (!provinceResponse.ok || !comuniResponse.ok) throw new Error("Errore nel caricamento dati JSON");
        
        provinceData = await provinceResponse.json();
        comuniData = await comuniResponse.json();
    } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
    }
}

async function populateEuropeanCountries() {
    try {
        const response = await fetch("/assets/json/european_countries.json");
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
        teamContainer.empty();
        
        data.forEach(professional => {
            let memberCard = `
            <div class="p-2 col-4">
                <div class="team-member">
                    <img src="../assets/images/${professional.immagine}" alt="${professional.nome}">
                    <h4>${professional.nome}</h4>
                    <span>${professional.specializzazione}</span>
                    <a class="verifica-disponibilita" data-doctorid="${professional.id}" href="#">Verifica disponibilità</a>
                </div>
            </div>
            `;
            teamContainer.append(memberCard);
        });
        
        $(".verifica-disponibilita").click(function (e) {
            e.preventDefault();
            if (!isLoggedIn) {
                openModal("#loginModal");
            } else {
                const doctorId = $(this).data("doctorid");
                window.location.href = "../prenotazione/prenotazione.html?doctorid=" + doctorId;
            }
        });
    }).fail(function () {
        console.error("Errore nel caricamento dei professionisti.");
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const bookNowBtn = document.getElementById("bookNowBtn"); 
    const teamSection = document.getElementById("team"); 
    
    if (bookNowBtn && teamSection) {
        bookNowBtn.addEventListener("click", function (event) {
            event.preventDefault(); 
            console.log("DEBUG: Scrolling alla sezione dei professionisti");
            
            teamSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadProvinceAndComuni();  
    populateProvince();
});

$("#registerProvincia").on("change", function () {
    const selectedProvinciaId = this.value;
    if (selectedProvinciaId) populateComuni(selectedProvinciaId);
});

document.getElementById("registerProvincia").addEventListener("change", function () {
    const selectedProvinciaId = this.value;
    if (selectedProvinciaId) populateComuni(selectedProvinciaId);
});

function populateProvince() {
    const provinceSelect = $("#registerProvincia").html('<option value="" disabled selected>Seleziona una provincia</option>');
    provinceData.forEach(province => {
        provinceSelect.append(`<option value="${province.id}">${province.nome} (${province.siglaProvincia})</option>`);
    });
}

function populateComuni(selectedProvinciaId) {
    const comuniSelect = $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
    comuniData.filter(comune => comune.idProvincia == selectedProvinciaId).forEach(comune => {
        comuniSelect.append(`<option value="${comune.id}">${comune.nome}</option>`);
    });
}

document.getElementById('generateCF').addEventListener('click', async function () {
    const nome = $("#registerNome").val();
    const cognome = $("#registerCognome").val();
    const data_nascita = $("#registerDataNascita").val();
    const sesso = $("#registerSesso").val();
    const comune = await getCodiceCatastale($("#registerComune").val());
    console.log("Codice Catastale:", comune);
    if (!nome || !cognome || !data_nascita || !sesso || !comune) {
        Swal.fire('Errore', 'Completa tutti i campi richiesti per generare il codice fiscale.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/genera_codice_fiscale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cognome, data_nascita, sesso, comune })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            $("#registerCF").val(data.codice_fiscale);
            Swal.fire('Successo', 'Codice fiscale generato correttamente!', 'success');
        } else {
            Swal.fire('Errore', data.message || 'Errore nella generazione del codice fiscale.', 'error');
        }
    } catch (error) {
        console.error("Errore nella generazione del codice fiscale:", error);
        Swal.fire('Errore', 'Errore di connessione. Riprova più tardi.', 'error');
    }
});


async function getCodiceCatastale(comuneId) {
    const comuniResponse = await fetch("/assets/json/comuni.json");  
    if (!comuniResponse.ok) throw new Error("Errore nel caricamento dei dati comuni");
    
    const comuniData = await comuniResponse.json();
    const comune = comuniData.find(com => Number(com.id) === Number(comuneId));
    
    return comune ? comune.CodCatastale : "XXXX";  // Restituisce il codice catastale o "XXXX" se non trovato
}


