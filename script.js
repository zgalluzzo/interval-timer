const settingsForm = document.querySelector("#timer-settings");
const timerDisplay = document.querySelector("#timer-display");
const timerStatus = document.querySelector("#timer-status");
const timeRemaining = document.querySelector("#time-remaining");

const timerState = {
  phase: "ready",
  secondsRemaining: 0,
  endTime: null,
  intervalId: null,
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTimer() {
  timeRemaining.textContent = formatTime(timerState.secondsRemaining);
}

function stopInterval() {
  if (timerState.intervalId !== null) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
}

function completeTimer() {
  stopInterval();
  timerState.phase = "complete";
  timerState.secondsRemaining = 0;

  timerStatus.textContent = "Complete";
  renderTimer();
}

function updateTimer() {
  const millisecondsRemaining = Math.max(
    0,
    timerState.endTime - Date.now(),
  );

  timerState.secondsRemaining = Math.ceil(
    millisecondsRemaining / 1000,
  );

  renderTimer();

  if (millisecondsRemaining === 0) {
    completeTimer();
  }
}

function startTimer(durationInSeconds) {
  stopInterval();

  timerState.phase = "work";
  timerState.secondsRemaining = durationInSeconds;
  timerState.endTime = Date.now() + durationInSeconds * 1000;

  timerDisplay.hidden = false;
  timerStatus.textContent = "Work";

  renderTimer();

  timerState.intervalId = setInterval(updateTimer, 250);
}

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(settingsForm);
  const roundDuration = Number(formData.get("roundDuration"));

  if (!Number.isFinite(roundDuration) || roundDuration < 1) {
    return;
  }

  startTimer(roundDuration);
});