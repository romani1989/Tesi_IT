const API_URL = "http://127.0.0.1:5000"; // Assicurati che il backend sia attivo
const userId = localStorage.getItem("userId");

console.log("ID utente salvato nel localStorage:", userId);

// Controlla se l'utente è loggato
if (!userId) {
    alert("Devi essere loggato per accedere al profilo.");
    window.location.href = "index.html"; // Torna alla home se non loggato
}

// Funzione per recuperare i dati dell'utente dal backend
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`);
        if (!response.ok) {
            throw new Error("Errore nel caricamento dei dati utente.");
        }
        
        const userData = await response.json();
        console.log("Dati utente ricevuti:", userData);

        // Assicuriamoci che gli elementi esistano prima di modificarli
        if (document.getElementById("profileDetails")) {
            document.getElementById("profileDetails").innerHTML = `
                <div class="profile-card">
                    <h3>${userData.nome} ${userData.cognome}</h3>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Telefono:</strong> ${userData.cellulare}</p>
                    <p><strong>Codice Fiscale:</strong> ${userData.codice_fiscale}</p>
                    <p><strong>Data di nascita:</strong> ${userData.data_nascita}</p>
                </div>
            `;
        }

        // Popoliamo anche la sezione "I miei dati"
        updateProfileSection(userData);

    } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
        if (document.getElementById("profileDetails")) {
            document.getElementById("profileDetails").innerHTML = `<p class='text-danger'>Errore di connessione al server.</p>`;
        }
    }
}

// Funzione per riempire la sezione "I miei dati"
function updateProfileSection(userData) {
    const fields = {
        "userNome": userData.nome,
        "userCognome": userData.cognome,
        "userDataNascita": userData.data_nascita,
        "userSesso": userData.sesso_biologico,
        "userNazione": userData.nazione_nascita,
        "userProvincia": userData.provincia_nascita,
        "userComune": userData.comune_nascita,
        "userCF": userData.codice_fiscale,
        "userEmail": userData.email,
        "userCellulare": userData.cellulare
    };

    for (const [id, value] of Object.entries(fields)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || "-";
        } else {
            console.warn(`Elemento con ID "${id}" non trovato.`);
        }
    }
}

// Aspettiamo che il DOM sia caricato prima di eseguire il codice
document.addEventListener("DOMContentLoaded", function () {
    console.log("Pagina caricata, avvio caricamento profilo...");
    loadUserProfile(); // Chiamiamo la funzione per caricare i dati utente

    // Bottone per tornare alla home
    const backHomeBtn = document.getElementById("backHomeBtn");
    if (backHomeBtn) {
        backHomeBtn.addEventListener("click", function () {
            window.location.href = "index.html"; // Torna alla Home
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("Devi essere loggato per accedere al profilo.");
        window.location.href = "index.html"; 
        return;
    }

    // Recupera gli appuntamenti dell'utente
    fetch(`http://127.0.0.1:5000/api/reservations/user/${userId}`)
        .then(response => response.json())
        .then(appointments => {
            const appointmentsList = document.getElementById("userAppointments");
            appointmentsList.innerHTML = ""; // Svuota la lista

            if (appointments.length === 0) {
                appointmentsList.innerHTML = "<li>Nessun appuntamento trovato.</li>";
            } else {
                appointments.forEach(app => {
                    const li = document.createElement("li");
                    li.innerHTML = `Data:<strong class="me-4">${app.data}</strong>  Orario : ${app.orario} - ${app.professional_name}`;
                    appointmentsList.appendChild(li);
                });
            }
        })
        .catch(error => console.error("Errore nel recupero degli appuntamenti:", error));
});
