const settingsForm = document.querySelector("#timer-settings");
const timerDisplay = document.querySelector("#timer-display");
const timerStatus = document.querySelector("#timer-status");
const roundProgress = document.querySelector("#round-progress");
const timeRemaining = document.querySelector("#time-remaining");

const timerState = {
  phase: "ready",
  currentRound: 1,
  totalRounds: 1,
  roundDuration: 0,
  restDuration: 0,
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

function renderRoundProgress() {
  roundProgress.textContent =
    `Round ${timerState.currentRound} of ${timerState.totalRounds}`;
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
    handlePhaseComplete();
  }
}

function startPhase(phase, durationInSeconds) {
  stopInterval();

  timerState.phase = phase;
  timerState.secondsRemaining = durationInSeconds;
  timerState.endTime = Date.now() + durationInSeconds * 1000;

  timerStatus.textContent = phase === "work" ? "Work" : "Rest";

  renderRoundProgress();
  renderTimer();

  if (durationInSeconds === 0) {
    handlePhaseComplete();
    return;
  }

  timerState.intervalId = setInterval(updateTimer, 250);
}

function handlePhaseComplete() {
  if (timerState.phase === "work") {
    if (timerState.currentRound === timerState.totalRounds) {
      completeTimer();
      return;
    }

    startPhase("rest", timerState.restDuration);
    return;
  }

  if (timerState.phase === "rest") {
    timerState.currentRound += 1;
    startPhase("work", timerState.roundDuration);
  }
}

function startTimer({ totalRounds, roundDuration, restDuration }) {
  stopInterval();

  timerState.currentRound = 1;
  timerState.totalRounds = totalRounds;
  timerState.roundDuration = roundDuration;
  timerState.restDuration = restDuration;

  timerDisplay.hidden = false;

  startPhase("work", roundDuration);
}

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(settingsForm);
  const totalRounds = Number(formData.get("rounds"));
  const roundDuration = Number(formData.get("roundDuration"));
  const restDuration = Number(formData.get("restDuration"));

  const settingsAreValid =
    Number.isInteger(totalRounds) &&
    totalRounds >= 1 &&
    Number.isInteger(roundDuration) &&
    roundDuration >= 1 &&
    Number.isInteger(restDuration) &&
    restDuration >= 0;

  if (!settingsAreValid) {
    return;
  }

  startTimer({
    totalRounds,
    roundDuration,
    restDuration,
  });
});