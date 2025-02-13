const API_URL = "http://127.0.0.1:5000";
const userId = localStorage.getItem("userId");
let provinceData = [], comuniData = [], countries=[];

// Controllo userId e reindirizzamento se non loggato
if (!userId) {
    Swal.fire({
        icon: 'error',
        title: 'Accesso non autorizzato',
        text: 'Devi essere loggato per accedere al profilo.',
        confirmButtonText: 'OK'
    }).then(() => {
        window.location.href = "../homepage/index.html";
    });
}

// Caricamento province e comuni
async function loadProvinceAndComuni() {
    try {
        const [provinceResponse, comuniResponse, nationResponse] = await Promise.all([
            fetch("../assets/json/province.json"),
            fetch("../assets/json/comuni.json"),
            fetch("../assets/json/european_countries.json")  
        ]);
        if (!provinceResponse.ok || !comuniResponse.ok) {
            throw new Error("Errore nel caricamento dei dati JSON");
        }
        
        const countrySelect = $("#registerNazione").html('<option value="" disabled selected>Seleziona una nazione</option>');
        const provinceSelect = $("#registerProvincia").html('<option value="" disabled selected>Seleziona una provincia</option>');
        const citySelect = $("#registerComune").html('<option value="" disabled selected>Seleziona una comune</option>');
        countries = await nationResponse.json();
        provinces = await provinceResponse.json();
        comuni = await comuniResponse.json();
        countries.forEach(country => {
            countrySelect.append(`<option value="${country.id}">${country.nome}</option>`);
        });
        provinces.forEach(prov => {
            
            provinceSelect.append(`<option value="${prov.id}">${prov.nome}</option>`);
        });
        comuni.forEach(city => {
            citySelect.append(`<option value="${city.id}">${city.nome}</option>`);
        });
        
    } catch (error) {
        console.error("Errore durante il caricamento di province e comuni:", error);
    }
}

// Funzione per caricare i dati utente
async function loadUserProfile() {
    await loadProvinceAndComuni();  // Assicurati di caricare prima le province e i comuni
    
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`);
        if (!response.ok) throw new Error("Errore nel caricamento dei dati utente.");
        
        const userData = await response.json();
        console.log("Dati utente ricevuti:", userData);
        
        // Aggiorna i campi del profilo con i dati utente
        updateProfileSection(userData);
    } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
        Swal.fire({
            icon: 'error',
            title: 'Errore di connessione',
            text: 'Non è stato possibile recuperare i dati del profilo.',
            confirmButtonText: 'OK'
        });
    }
}

// Funzione per aggiornare i campi del profilo
function updateProfileSection(userData) {
    const countrySelect = $("#registerNazione").html('<option value="" disabled selected>Seleziona una nazione</option>');
    
    countries.forEach(country => {
        countrySelect.append(`<option value="${country}">${country}</option>`);
    });
    const fiets = {
        "registerNome": userData.nome,
        "registerCognome": userData.cognome,
        "registerDataNascita": userData.data_nascita,
        "registerSesso": userData.sesso_biologico,
        "registerNazione": userData.nazione_nascita,
        "registerProvincia": userData.provincia_nascita,
        "registerComune": userData.comune_nascita,
        "registerCF": userData.codice_fiscale,
        "registerEmail": userData.email,
        "registerCellulare": userData.cellulare,
    };
    for (const [id, value] of Object.entries(fiets)) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || "-";
            element.disabled = true;  // Applica il disabled
        } else {
            console.warn(`Elemento con ID "${id}" non trovato.`);
        }
    }
    const cons = document.getElementById('registerConsenso');
    cons.checked = userData.consenso;
}

// Funzione per abilitare la modifica dei campi
function enableEdit() {
    document.querySelectorAll("#profileForm input,#profileForm select").forEach(input => input.disabled = false);
    document.getElementById("editBtn").style.display = "none";
    document.querySelector(".action-buttons").classList.add("show");
}

// Funzione per annullare la modifica e ricaricare i dati originali
function cancelEdit() {
    document.querySelectorAll("#profileForm input,#profileForm select").forEach(input => input.disabled = true);
    document.querySelector(".action-buttons").classList.remove("show");
    document.getElementById("editBtn").style.display = "flex";
    loadUserProfile();
}


// Funzione per salvare le modifiche al profilo
async function saveProfileChanges() {
    const updatedData = {
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
        consenso: document.getElementById("registerConsenso").checked
    };
    
    if (updatedData.provincia_nascita === null || updatedData.comune_nascita === null) {
        Swal.fire('Errore', 'Provincia o Comune non valido. Verifica i dati inseriti.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });
        
        if (response.ok) {
            Swal.fire('Successo', 'I tuoi dati sono stati aggiornati con successo!', 'success');
            cancelEdit();
        } else {
            Swal.fire('Errore', 'Non è stato possibile aggiornare i dati.', 'error');
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento del profilo:", error);
        Swal.fire('Errore', 'Si è verificato un errore durante l\'aggiornamento.', 'error');
    }
}

// Funzione per caricare appuntamenti utente
async function loadUserAppointments() {
    try {
        const response = await fetch(`${API_URL}/api/reservations/user/${userId}`);
        if (!response.ok) throw new Error("Errore nel caricamento degli appuntamenti.");
        
        const data = await response.json();
        const appointmentsContainer = document.getElementById("userAppointments");
        appointmentsContainer.innerHTML = "";
        
        if (data.length > 0) {
            data.forEach(app => {
                const li = document.createElement("li");
                li.classList.add("appointment-item");
                li.innerHTML = `
                    <strong>Data:</strong> ${app.data} 
                    <strong>Orario:</strong> ${app.orario} - ${app.professional_name}
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${app.id}">Elimina</button>
                `;
                appointmentsContainer.appendChild(li);
            });
            
            // Aggiunge event listener ai pulsanti di eliminazione
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", function () {
                    const appointmentId = this.getAttribute("data-id");
                    deleteAppointment(appointmentId);
                });
            });
        } else {
            appointmentsContainer.innerHTML = "<p class='text-muted'>Nessun appuntamento trovato.</p>";
        }
    } catch (error) {
        console.error("Errore nel caricamento degli appuntamenti:", error);
        document.getElementById("userAppointments").innerHTML = "<p class='text-danger'>Errore nel caricamento degli appuntamenti.</p>";
    }
}

// Funzione per eliminare un appuntamento
async function deleteAppointment(appointmentId) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: "Questa azione non può essere annullata!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sì, elimina',
        cancelButtonText: 'Annulla'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/api/reservations/${appointmentId}`, { method: "DELETE" });
                if (response.ok) {
                    Swal.fire('Eliminato!', 'L\'appuntamento è stato eliminato con successo.', 'success').then(() => {
                        loadUserAppointments();  // Ricarica gli appuntamenti senza ricaricare l'intera pagina
                    });
                } else {
                    Swal.fire('Errore!', 'Si è verificato un errore durante la cancellazione.', 'error');
                }
            } catch (error) {
                console.error("Errore durante l'eliminazione:", error);
                Swal.fire('Errore!', 'Si è verificato un errore di connessione.', 'error');
            }
        }
    });
}

// Inizializzazione della pagina
document.addEventListener("DOMContentLoaded", async function () {
    console.log("Pagina caricata, avvio caricamento profilo...");
    await loadProvinceAndComuni();
    loadUserProfile();
    loadUserAppointments();
    document.getElementById("editBtn").addEventListener("click", enableEdit);
    document.getElementById("saveBtn").addEventListener("click", saveProfileChanges);
    document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
});


