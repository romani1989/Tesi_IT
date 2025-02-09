const API_URL = "http://127.0.0.1:5000"; 
const userId = localStorage.getItem("userId");

console.log("ID utente salvato nel localStorage:", userId);


if (!userId) {
    alert("Devi essere loggato per accedere al profilo.");
    window.location.href = "index.html"; 
}


async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`);
        if (!response.ok) {
            throw new Error("Errore nel caricamento dei dati utente.");
        }
        
        const userData = await response.json();
        console.log("Dati utente ricevuti:", userData);

        
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

        
        updateProfileSection(userData);

    } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
        if (document.getElementById("profileDetails")) {
            document.getElementById("profileDetails").innerHTML = `<p class='text-danger'>Errore di connessione al server.</p>`;
        }
    }
}


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


document.addEventListener("DOMContentLoaded", function () {
    console.log("Pagina caricata, avvio caricamento profilo...");
    loadUserProfile(); 
    loadUserAppointments(); 

    
    const backHomeBtn = document.getElementById("backHomeBtn");
    if (backHomeBtn) {
        backHomeBtn.addEventListener("click", function () {
            window.location.href = "index.html"; 
        });
    }
});


async function loadUserAppointments() {
    if (!userId) {
        console.error("Nessun userId trovato. L'utente deve essere loggato.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reservations/user/${userId}`);
        const data = await response.json();
        let appointmentsContainer = document.getElementById("userAppointments");
        appointmentsContainer.innerHTML = "";

        if (data.length > 0) {
            data.forEach(app => {
                let li = document.createElement("li");
                li.innerHTML = `
                    <strong class="me-4">Data:</strong> ${app.data} 
                    <strong>Orario:</strong> ${app.orario} - ${app.professional_name}
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${app.id}">Elimina</button>
                `;
                appointmentsContainer.appendChild(li);
            });

            
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", function () {
                    let appointmentId = this.getAttribute("data-id");
                    deleteAppointment(appointmentId);
                });
            });

        } else {
            appointmentsContainer.innerHTML = "<p class='text-muted'>Nessun appuntamento trovato.</p>";
        }
    } catch (error) {
        console.error("Errore nel caricamento degli appuntamenti:", error);
    }
}


async function deleteAppointment(appointmentId) {
    if (!confirm("Sei sicuro di voler cancellare questo appuntamento?")) return;

    try {
        const response = await fetch(`${API_URL}/api/reservations/${appointmentId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert("Appuntamento eliminato con successo!");
            loadUserAppointments(); 
        } else {
            alert("Errore durante l'eliminazione.");
        }
    } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
        alert("Errore durante l'eliminazione.");
    }
}
