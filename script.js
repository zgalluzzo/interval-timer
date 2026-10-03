const settingsForm = document.querySelector("#timer-settings");
const timerDisplay = document.querySelector("#timer-display");
const timerStatus = document.querySelector("#timer-status");
const roundProgress = document.querySelector("#round-progress");
const timeRemaining = document.querySelector("#time-remaining");

const AudioContextClass =
  window.AudioContext || window.webkitAudioContext;

let audioContext = null;

const timerState = {
  phase: "ready",
  currentRound: 1,
  totalRounds: 1,
  roundDuration: 0,
  restDuration: 0,
  selectedSound: "bell",
  secondsRemaining: 0,
  endTime: null,
  intervalId: null,
};

function prepareAudio() {
  if (!AudioContextClass) {
    return;
  }

  try {
    if (audioContext === null) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
        // Timer operation should continue if audio cannot start.
      });
    }
  } catch {
    audioContext = null;
  }
}

function playTone({
  frequency,
  startOffset = 0,
  duration,
  volume,
  type = "sine",
}) {
  if (audioContext === null || audioContext.state !== "running") {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startTime = audioContext.currentTime + startOffset;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    volume,
    startTime + 0.01,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(endTime + 0.01);
}

function playBeep() {
  playTone({
    frequency: 880,
    duration: 0.2,
    volume: 0.15,
    type: "square",
  });
}

function playBell() {
  playTone({
    frequency: 660,
    duration: 0.9,
    volume: 0.2,
  });

  playTone({
    frequency: 990,
    duration: 0.7,
    volume: 0.1,
  });
}

function playChime() {
  playTone({
    frequency: 523.25,
    duration: 0.4,
    volume: 0.15,
  });

  playTone({
    frequency: 659.25,
    startOffset: 0.2,
    duration: 0.4,
    volume: 0.15,
  });

  playTone({
    frequency: 783.99,
    startOffset: 0.4,
    duration: 0.6,
    volume: 0.15,
  });
}

function playSelectedSound() {
  if (audioContext === null || audioContext.state !== "running") {
    return;
  }

  const soundPlayers = {
    bell: playBell,
    beep: playBeep,
    chime: playChime,
  };

  const playSound = soundPlayers[timerState.selectedSound];

  if (playSound) {
    playSound();
  }
}

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
    playSelectedSound();
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

function startTimer({ totalRounds, roundDuration, restDuration, selectedSound }) {
  stopInterval();

  timerState.currentRound = 1;
  timerState.totalRounds = totalRounds;
  timerState.roundDuration = roundDuration;
  timerState.restDuration = restDuration;
  timerState.selectedSound = selectedSound;

  timerDisplay.hidden = false;

  startPhase("work", roundDuration);
}

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(settingsForm);
  const totalRounds = Number(formData.get("rounds"));
  const roundDuration = Number(formData.get("roundDuration"));
  const restDuration = Number(formData.get("restDuration"));
  const selectedSound = formData.get("sound");
  const validSounds = ["bell", "chime", "beep"];

  const settingsAreValid =
    Number.isInteger(totalRounds) &&
    totalRounds >= 1 &&
    Number.isInteger(roundDuration) &&
    roundDuration >= 1 &&
    Number.isInteger(restDuration) &&
    restDuration >= 0 &&
    validSounds.includes(selectedSound)

  if (!settingsAreValid) {
    return;
  }

  prepareAudio();

  startTimer({
    totalRounds,
    roundDuration,
    restDuration,
    selectedSound,
  });
});