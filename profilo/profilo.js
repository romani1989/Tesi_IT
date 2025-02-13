const API_URL = "http://127.0.0.1:5000";
const userId = localStorage.getItem("userId");
let provinceData = [], comuniData = [];

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
        const [provinceResponse, comuniResponse] = await Promise.all([
            fetch("../assets/data/province.json"),
            fetch("../assets/data/comuni.json")  
        ]);

        if (!provinceResponse.ok || !comuniResponse.ok) {
            throw new Error("Errore nel caricamento dei dati JSON");
        }

        provinceData = await provinceResponse.json();
        comuniData = await comuniResponse.json();
    } catch (error) {
        console.error("Errore durante il caricamento di province e comuni:", error);
    }
}

function getProvinceName(provinceId) {
    const province = provinceData.find(prov => String(prov.id) === String(provinceId));  
    return province ? province.nome : "Provincia non trovata";
}

function getComuneName(comuneId) {
    const comune = comuniData.find(com => String(com.id) === String(comuneId));  
    return comune ? comune.nome : "Comune non trovato";
}


function getProvinceId(provinceName) {
    const province = provinceData.find(prov => prov.nome.toLowerCase() === provinceName.toLowerCase());
    return province ? province.id : null;
}

function getComuneId(comuneName) {
    const comune = comuniData.find(com => com.nome.toLowerCase() === comuneName.toLowerCase());
    return comune ? comune.id : null;
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
    console.log("Provincia:", getProvinceName(userData.provincia_nascita));
    console.log("Comune:", getComuneName(userData.comune_nascita));

    const fields = {
        "userNomeInput": userData.nome,
        "userCognomeInput": userData.cognome,
        "userDataNascitaInput": userData.data_nascita,
        "userSessoInput": userData.sesso_biologico,
        "userNazionediNascitaInput": userData.nazione_nascita,
        "userProvinciaInput": getProvinceName(userData.provincia_nascita),
        "userComuneInput": getComuneName(userData.comune_nascita),
        "userCodiceFiscaleInput": userData.codice_fiscale,
        "userEmailInput": userData.email,
        "userCellulareInput": userData.cellulare
    };

    for (const [id, value] of Object.entries(fields)) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || "-";
        } else {
            console.warn(`Elemento con ID "${id}" non trovato.`);
        }
    }
}

// Funzione per abilitare la modifica dei campi
function enableEdit() {
    document.querySelectorAll("#profileForm input").forEach(input => input.disabled = false);
    document.getElementById("editBtn").style.display = "none";
    document.querySelector(".action-buttons").classList.add("show");
}

// Funzione per annullare la modifica e ricaricare i dati originali
function cancelEdit() {
    document.querySelectorAll("#profileForm input").forEach(input => input.disabled = true);
    document.querySelector(".action-buttons").classList.remove("show");
    document.getElementById("editBtn").style.display = "flex";
    loadUserProfile();
}



// Funzione per salvare le modifiche al profilo
async function saveProfileChanges() {
    const updatedData = {
        nome: document.getElementById("userNomeInput").value,
        cognome: document.getElementById("userCognomeInput").value,
        data_nascita: document.getElementById("userDataNascitaInput").value,
        sesso_biologico: document.getElementById("userSessoInput").value,
        nazione_nascita: document.getElementById("userNazionediNascitaInput").value,
        provincia_nascita: getProvinceId(document.getElementById("userProvinciaInput").value),
        comune_nascita: getComuneId(document.getElementById("userComuneInput").value),
        codice_fiscale: document.getElementById("userCodiceFiscaleInput").value,
        email: document.getElementById("userEmailInput").value,
        cellulare: document.getElementById("userCellulareInput").value
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


