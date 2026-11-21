const form = document.querySelector("#timer-form");
const hoursInput = document.querySelector("#hours");
const minutesInput = document.querySelector("#minutes");
const secondsInput = document.querySelector("#seconds");

const formMessage = document.querySelector("#form-message");
const timerList = document.querySelector("#timer-list");
const emptyState = document.querySelector("#empty-state");

const timerTemplate = document.querySelector("#timer-template");
const finishedTemplate = document.querySelector("#finished-template");

let audioContext;

const timers = new Map();

let nextTimerId = 1;
setInterval(updateTimers, 200);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    initializeAudio();
    const values = [hoursInput, minutesInput, secondsInput]


    const numbers = values.map((input) =>
        input.value.trim() === "" ? 0 : Number(input.value.trim())
    );

    const [hours, minutes, seconds] = numbers;

    const valid = values.every((input, index) =>
        input.value.trim() === "" ||
        (
            Number.isInteger(numbers[index]) &&
            numbers[index] >= 0
        )
    );

    if (
        !valid ||
        hours > 99 ||
        minutes > 59 ||
        seconds > 59
    ) {
        showError(
            "Enter valid time: hours 0-99, minutes and seconds 0-59."
        );
        return;
    }

    const duration =
        hours * 3600 +
        minutes * 60 +
        seconds;

    if (duration === 0) {
        showError("Please enter a time greater than zero.");
        return;
    }
    addTimer(duration);

    formMessage.textContent = "";

    values.forEach((input) => {
        input.value = "";
    });
})

function showError(message) {
    formMessage.textContent = message;
}

function addTimer(duration) {

    const id = nextTimerId++;
    const fragment = timerTemplate.content.cloneNode(true);

    const row = fragment.querySelector(".timer-row");

    const display = row.querySelector(".timer-display");

    const deleteButton = row.querySelector(".delete-button");

    display.textContent = formatTime(duration);

    display.setAttribute(
        "aria-label",
        `${formatTime(duration)} remaining`
    );

    deleteButton.addEventListener("click", () => {
        removeTimer(id);
    });

    const timer = {

        id: id,

        duration: duration,

        remaining: duration,

        endAt: Date.now() + duration * 1000,

        row: row,

        display: display,

        finished: false

    };

    timers.set(id, timer);

    timerList.appendChild(row);

    updateEmptyState();

}

function updateTimers() {

    const now = Date.now();

    for (const timer of timers.values()) {

        if (timer.finished) {
            continue;
        }

        const remaining = Math.max(
            0,
            Math.ceil((timer.endAt - now) / 1000)
        );

        if (remaining !== timer.remaining) {

            timer.remaining = remaining;

            timer.display.textContent = formatTime(remaining);

            timer.display.setAttribute(
                "aria-label",
                `${formatTime(remaining)} remaining`
            );

        }

        if (remaining === 0) {

            finishTimer(timer);

        }

    }

}

function finishTimer(timer) {

    timer.finished = true;

    const fragment = finishedTemplate.content.cloneNode(true);

    const finishedRow = fragment.querySelector(".finished-row");

    const stopButton = finishedRow.querySelector(".stop-button");

    stopButton.addEventListener("click", () => {
        removeTimer(timer.id);
    });

    timer.row.replaceWith(finishedRow);

    timer.row = finishedRow;

    playAlert();

}

// Remove timer
function removeTimer(id) {

    const timer = timers.get(id);

    if (!timer) {
        return;
    }

    timer.row.remove();

    timers.delete(id);

    updateEmptyState();

}

// Show or hide empty message
function updateEmptyState() {

    emptyState.hidden = timers.size > 0;

}

// Convert seconds into HH:MM:SS
function formatTime(totalSeconds) {

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds
    ]
        .map(value => String(value).padStart(2, "0"))
        .join(" : ");

}

function initializeAudio() {

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        console.log("Audio is not supported");
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playAlert() {

    if (!audioContext) {
        return;
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const notes = [880, 1174.66, 1396.91];

    notes.forEach((frequency, index) => {

        const oscillator = audioContext.createOscillator();

        const gain = audioContext.createGain();

        const start =
            audioContext.currentTime + index * 0.18;

        oscillator.type = "sine";

        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.0001, start);

        gain.gain.exponentialRampToValueAtTime(
            0.15,
            start + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            start + 0.4
        );

        oscillator.connect(gain);

        gain.connect(audioContext.destination);

        oscillator.start(start);

        oscillator.stop(start + 0.42);

    });

}
