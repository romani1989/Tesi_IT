const API_URL = "http://127.0.0.1:5000";

// 📌 Recupera l'ID del professionista dalla URL
const urlParams = new URLSearchParams(window.location.search);
const doctorId = urlParams.get("doctorid");

// 📌 Variabili per gli elementi della pagina
const timeSlotsContainer = document.getElementById("timeSlots");
const confirmBookingBtn = document.getElementById("confirmBookingBtn");
const backToHomeBtn = document.getElementById("backToHome");
const doctorName = document.getElementById("doctorName");
const doctorSpecialization = document.getElementById("doctorSpecialization");
const doctorImage = document.getElementById("doctorImage");

document.addEventListener('DOMContentLoaded', async function () {
    var calendarEl = document.getElementById('calendar');
    
    // 📌 Recupera le date disponibili dal server
    let availableDates = await fetchAvailableDates();

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        locale: 'IT', // Imposta altezza fissa senza scroll
        selectable: true,
        validRange: {
            start: new Date() // Impedisce la selezione di date passate
        },
        dateClick: function(info) {
            if (availableDates.includes(info.dateStr)) {
                document.querySelectorAll(".fc-day-selected").forEach(el => el.classList.remove("fc-day-selected"));
                info.dayEl.classList.add("fc-day-selected");
                fetchAvailableTimes(doctorId, info.dateStr);
            }
        },
        dayCellDidMount: function(cellInfo) {
            let cellDate = new Date(cellInfo.date.getTime() - (cellInfo.date.getTimezoneOffset() * 60000))
                .toISOString().split('T')[0];
        
            if (availableDates.includes(cellDate)) {
                cellInfo.el.classList.add("available-day");
            } else {
                cellInfo.el.style.pointerEvents = 'none';
                cellInfo.el.style.opacity = '0.5';
            }
        }
    });

    calendar.render();
});

// 📌 Funzione per recuperare le date disponibili
async function fetchAvailableDates() {
    try {
        const response = await fetch(`${API_URL}/api/professionals/${doctorId}/disponibilita`);
        const data = await response.json();
        return data.available_dates || [];
    } catch (error) {
        console.error('Errore nel recupero delle date disponibili:', error);
        return [];
    }
}

// 📌 Funzione per recuperare gli orari disponibili
async function fetchAvailableTimes(doctorId, date) {
    try {
        const response = await fetch(`${API_URL}/api/professionals/${doctorId}/orari`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: date })
        });

        const data = await response.json();
        timeSlotsContainer.innerHTML = "";

        if (data.available_times.length > 0) {
            data.available_times.forEach(time => {
                const timeSlot = document.createElement("div");
                timeSlot.classList.add("time-slot");
                timeSlot.textContent = time;
                timeSlot.addEventListener("click", () => {
                    document.querySelectorAll(".time-slot").forEach(t => t.classList.remove("selected"));
                    timeSlot.classList.add("selected");
                });
                timeSlotsContainer.appendChild(timeSlot);
            });
        } else {
            timeSlotsContainer.innerHTML = "<p class='text-muted'>Nessun orario disponibile</p>";
        }
    } catch (error) {
        console.error("Errore nel recupero degli orari disponibili:", error);
        timeSlotsContainer.innerHTML = "<p class='text-danger'>Errore nel recupero degli orari.</p>";
    }
}

// 📌 Funzione per salvare la prenotazione
async function bookAppointment() {
    const selectedDate = document.querySelector(".fc-day-selected")?.getAttribute("data-date");
    const selectedTimeSlot = document.querySelector(".time-slot.selected");
    const userId = localStorage.getItem("userId");

    console.log("Data selezionata:", selectedDate);
    console.log("Orario selezionato:", selectedTimeSlot ? selectedTimeSlot.textContent : "Nessuno");

    if (!userId) {
        alert("Devi essere loggato per prenotare un appuntamento.");
        return;
    }

    if (!selectedDate || !selectedTimeSlot) {
        alert("Seleziona una data e un orario per procedere!");
        return;
    }

    if (!doctorId) {
        alert("Errore: Professionista non trovato.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reservations/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                professional_id: doctorId,
                data: selectedDate,
                orario: selectedTimeSlot.textContent.trim(),
                stato: "in attesa"
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Prenotazione effettuata con successo!");
            window.location.href = "../index.html"; // Reindirizza alla homepage
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Errore durante la prenotazione:", error);
        alert("Si è verificato un errore durante la prenotazione.");
    }
}

// 📌 Evento per salvare la prenotazione
confirmBookingBtn.addEventListener("click", bookAppointment);

// 📌 Evento per tornare alla home
backToHomeBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});

// 📌 Dati dei professionisti
const professionals = {
    1: { name: "Giuseppe Rossi", specialization: "Medico", image: "../images/Giuseppe.jpeg" },
    2: { name: "Gelsomina Bianchi", specialization: "Psicologa", image: "../images/Gelsomina.jpeg" },
    3: { name: "Guglielmo Verdi", specialization: "Psicologo", image: "../images/Guglielmo.png" },
    4: { name: "Vincenzo Esposito", specialization: "Medico", image: "../images/Vincenzo.png" },
    5: { name: "Elena Cimmino", specialization: "Nutrizionista", image: "../images/Elena.png" },
    6: { name: "Carmela Crilino", specialization: "Nutrizionista", image: "../images/Carmela.png" }
};

// 📌 Mostra i dati del professionista
if (doctorId && professionals[doctorId]) {
    doctorName.textContent = professionals[doctorId].name;
    doctorSpecialization.textContent = professionals[doctorId].specialization;
    doctorImage.src = professionals[doctorId].image;
} else {
    document.querySelector(".container").innerHTML = "<p class='text-danger'>Errore: Professionista non trovato</p>";
}
