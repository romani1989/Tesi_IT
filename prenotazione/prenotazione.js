const API_URL = "http://127.0.0.1:5000"; // URL del backend Flask

// 📌 Bottone per confermare la prenotazione
const confirmBookingBtn = document.getElementById("confirmBookingBtn");

// 📌 Bottone per tornare alla Home
const backToHomeBtn = document.getElementById("backToHome");

// 📌 Selezione dei membri del team
const teamMembers = document.querySelectorAll(".team-member");

let selectedSpecialistId = null; // Memorizza lo specialista selezionato

// 🔹 Gestisce la selezione di uno specialista
teamMembers.forEach(member => {
    member.addEventListener("click", function () {
        // Rimuove la classe "selected" da tutti gli altri specialisti
        teamMembers.forEach(m => m.classList.remove("selected"));

        // Aggiunge la classe al membro selezionato
        this.classList.add("selected");

        // Memorizza l'ID dello specialista selezionato
        selectedSpecialistId = this.getAttribute("data-specialist-id");
    });
});

// 🔹 Evento per tornare alla home
if (backToHomeBtn) {
    backToHomeBtn.addEventListener("click", () => {
        window.location.href = "../index.html"; // Torna alla home
    });
}

// 🔹 Funzione per inviare la prenotazione al backend
async function bookAppointment(event) {
    event.preventDefault();
    
    const date = document.getElementById("appointmentDate").value;
    const time = document.getElementById("appointmentTime").value;
    const userId = localStorage.getItem("userToken"); // Recupera il token dell'utente

    if (!selectedSpecialistId || !date || !time) {
        alert("Seleziona uno specialista e inserisci data e ora per continuare!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reservations/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                professional_id: selectedSpecialistId,
                data: date,
                orario: time,
                stato: "in attesa"
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Prenotazione effettuata con successo!");
            window.location.href = "../index.html"; // Dopo la prenotazione, torna alla Home
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Errore durante la prenotazione:", error);
        alert("Si è verificato un errore.");
    }
}

// 📌 Aggiungi evento al pulsante "Conferma Prenotazione"
if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", bookAppointment);
}