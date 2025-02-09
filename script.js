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
    window.location.href = "profilo.html"; 
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
        generateCodiceFiscale();
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
            fetch("province.json"), fetch("comuni.json")
        ]);
        
        if (!provinceResponse.ok || !comuniResponse.ok) throw new Error("Errore nel caricamento dati JSON");
        
        provinceData = await provinceResponse.json();
        comuniData = await comuniResponse.json();
    } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
    }
}


function populateProvince() {
    const provinceSelect = $("#registerProvincia").html('<option value="" disabled selected>Seleziona una provincia</option>');
    
    provinceData.forEach(province => {
        provinceSelect.append(`<option value="${province.id}">${province.nome} (${province.siglaProvincia})</option>`);
    });
    
    $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
}


function populateComuni(selectedProvinciaId) {
    const comuniSelect = $("#registerComune").html('<option value="" disabled selected>Seleziona un comune</option>');
    
    comuniData.filter(comune => comune.idProvincia == selectedProvinciaId).forEach(comune => {
        comuniSelect.append(`<option value="${comune.id}">${comune.nome}</option>`);
    });
}


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
        teamContainer.empty(); 
        
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

document.getElementById("registerProvincia").addEventListener("change", function () {
    populateComuni(this.value);
});