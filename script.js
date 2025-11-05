let gameMode = null;
let randomNumber = null;
let currentQuizIndex = 0;
let notifications = [];
const TASK_STORAGE_KEY = "amigo_tasks_v2";

const replies = {
  "hello": ["Hey! How's your day going? 😄", "Hello! What's up? 😊"],
  "hi": ["Hi there! How can I help you today?", "Hey! Good to see you."],
  "how are you": ["I'm a bot, but I'm feeling helpful today! 😊", "All systems go — ready to chat!"],
  "name": ["I'm AmigoBot — your friendly chat buddy!"],
  "joke": [
    "Why did the web developer go broke? Because he used up all his cache. 😆",
    "Why do programmers prefer dark mode? Because light attracts bugs. 😂"
  ],
  "sad": [
    "I'm sorry you're feeling sad. I'm here to listen 💛",
    "Sending a virtual hug — you're not alone 🤗"
  ],
  "tired": [
    "Try a short break or a quick walk — little rests help a lot 😌",
    "A power nap for 20 minutes can work wonders!"
  ],
  "stressed": [
    "Take a deep breath — in for 4, hold 4, out for 6. Repeat a few times.",
    "Break big tasks into tiny steps. Start with one small thing."
  ],
  "roast": [
    "I’d roast you but I don't want to give free lessons. 😜",
    "You must be a keyboard — because you're just my type. 😏"
  ],
  "dumb": [
    "No one is dumb — just temporarily confused. Also I tease lovingly 😝",
    "If brains were dynamite you wouldn't have enough to blow your hat off. (kidding!)"
  ],
  "crush": [
    "Ooo tell me about your crush — what's their vibe? 😏",
    "If you want, tell me one thing about them and I'll say whether it's a sign. 😉"
  ],
  "friend": [
    "Friends are gems — any drama to spill? 👀",
    "Talk to me — sometimes sharing helps you see things clearly."
  ],
  "study": [
    "Study smart: active recall and spaced repetition will help more than long passive reading.",
    "Try Pomodoro: 25 minutes focused, 5 minute break. Repeat 4 times and take a longer break."
  ],
  "exam": [
    "Make a summary sheet of formulas and key ideas — review the day before the exam.",
    "Practice past papers under timed conditions."
  ],
  "project": [
    "Break the project into milestones and set a small task for today.",
    "Write README and TODO — it'll clarify what's left."
  ],
  "notify": [
    "To set a reminder type: notify 10 Take a break",
    "Use: notify <minutes> <message> — e.g., notify 5 walk the dog"
  ],
  "guess": ["Type 'guess' to start number guess game (1–10)."],
  "rps": ["Type 'rps' to start Rock-Paper-Scissors."],
  "quiz": ["Type 'quiz' to start a short quiz."],
  "_fallback": [
    "I hear you. Ask me to 'notify', 'guess', 'rps', or 'quiz'.",
    "Tell me more — ask for a joke, study tip, or say 'notify 10 tea break'."
  ]
};

let quizQuestions = [
  { question: "What is the capital of France?", options: ["Paris","London","Rome"], answer: "Paris" },
  { question: "2 + 2 = ?", options: ["3","4","5"], answer: "4" },
  { question: "Which planet is known as the Red Planet?", options: ["Earth","Venus","Mars"], answer: "Mars" }
];

function scrollChatToBottom() {
  const chatBox = document.getElementById("chat-box");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function createMessageElement(text, sender="bot") {
  const p = document.createElement("p");
  p.classList.add("message", sender);
  p.innerText = text;
  return p;
}

function displayMessage(text, sender="bot") {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;
  const el = createMessageElement(text, sender);
  chatBox.appendChild(el);
  scrollChatToBottom();
}

function sendMessage() {
  const input = document.getElementById("user-input");
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;
  displayMessage(raw, "user");
  input.value = "";
  input.focus();
  setTimeout(() => {
    const botReply = handleMessage(raw);
    if (botReply) displayMessage(botReply, "bot");
  }, 300);
}

document.addEventListener("keydown", function(e){
  const input = document.getElementById("user-input");
  if (!input) return;
  if (e.key === "Enter" && document.activeElement === input) {
    e.preventDefault();
    sendMessage();
  }
});

function handleMessage(rawInput) {
  const input = String(rawInput).toLowerCase().trim();
  if (gameMode) {
    const gameResp = handleGameInput(input);
    if (gameResp) return gameResp;
  }
  const special = handleSpecialInput(input);
  if (special) return special;
  for (const key of Object.keys(replies)) {
    if (key === "_fallback") continue;
    if (input.includes(key)) {
      return pickReply(replies[key]);
    }
  }
  return pickReply(replies["_fallback"]);
}

function handleSpecialInput(input) {
  if (input.startsWith("notify")) {
    const parts = input.split(" ").filter(Boolean);
    if (parts.length < 3) return "Usage: notify <minutes> <your message>";
    const minutes = parts[1];
    const msg = parts.slice(2).join(" ");
    return setNotification(minutes, msg);
  }
  if (input === "guess" && gameMode === null) {
    gameMode = "guess";
    randomNumber = Math.floor(Math.random() * 10) + 1;
    return "🎲 Guess the Number started! Enter a number between 1 and 10.";
  }
  if (input === "rps" && gameMode === null) {
    gameMode = "rps";
    return "✊✋✌️ Rock Paper Scissors started! Type rock, paper, or scissors.";
  }
  if (input === "quiz" && gameMode === null) {
    gameMode = "quiz";
    currentQuizIndex = 0;
    const q = quizQuestions[currentQuizIndex];
    return `❓ Quiz Started!\nQ1: ${q.question}\nOptions: ${q.options.join(", ")}`;
  }
  return null;
}

function handleGameInput(input) {
  if (gameMode === "guess") {
    const guess = parseInt(input, 10);
    if (isNaN(guess)) return "Enter a valid number between 1 and 10 🎲";
    if (guess === randomNumber) {
      gameMode = null;
      randomNumber = null;
      return "🎉 Correct! You guessed it!";
    }
    return guess > randomNumber ? "Too high! ⬆️ Try again" : "Too low! ⬇️ Try again";
  }

  if (gameMode === "rps") {
    const choices = ["rock","paper","scissors"];
    if (!choices.includes(input)) return "Type rock, paper, or scissors ✊✋✌️";
    const botChoice = choices[Math.floor(Math.random() * 3)];
    let res;
    if (input === botChoice)
      res = `I chose ${botChoice}. It's a tie! 🤝`;
    else if (
      (input === "rock" && botChoice === "scissors") ||
      (input === "paper" && botChoice === "rock") ||
      (input === "scissors" && botChoice === "paper")
    )
      res = `I chose ${botChoice}. You win! 🎉`;
    else res = `I chose ${botChoice}. You lose 😢`;
    gameMode = null;
    return res;
  }

  if (gameMode === "quiz") {
    const q = quizQuestions[currentQuizIndex];
    if (!q) {
      gameMode = null;
      return "Quiz data issue.";
    }
    if (input === q.answer.toLowerCase()) {
      currentQuizIndex++;
      if (currentQuizIndex < quizQuestions.length) {
        const next = quizQuestions[currentQuizIndex];
        return `✅ Correct!\nQ${currentQuizIndex+1}: ${next.question}\nOptions: ${next.options.join(", ")}`;
      } else {
        gameMode = null;
        return "🎉 Quiz Finished! Great job!";
      }
    } else {
      return `❌ Wrong! Correct answer: ${q.answer}`;
    }
  }
  return null;
}

function setNotification(timeInMinutes, message) {
  const minutes = Number(timeInMinutes);
  if (isNaN(minutes) || minutes <= 0) return "Please provide a valid positive number of minutes.";
  const id = Date.now() + Math.random();
  notifications.push({ id, message });
  const timeInMs = minutes * 60 * 1000;
  setTimeout(() => {
    notifications = notifications.filter(n => n.id !== id);
    displayMessage(`🔔 Reminder: ${message}`, "bot");
    try {
      alert(`🔔 Reminder: ${message}`);
    } catch(e){
      console.warn(e);
    }
  }, timeInMs);
  return `✅ Reminder set for ${minutes} minute(s): "${message}"`;
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("main-content");
  if (sidebar) sidebar.classList.toggle("active");
  if (main) main.classList.toggle("active");
}

function toggleTheme() {
  const btn = document.querySelector(".theme-btn");
  document.body.classList.toggle("dark");
  if (btn) btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

function initPlanner() {
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const list = document.getElementById("task-list");
  const stats = document.getElementById("planner-stats");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const clearAllBtn = document.getElementById("clear-all");
  let tasks = loadTasks();

  function render() {
    list.innerHTML = "";
    if (!tasks.length) {
      const li = document.createElement("li");
      li.style.padding = "10px";
      li.style.color = "#666";
      li.innerText = "No tasks yet — add one above ✨";
      list.appendChild(li);
    } else {
      tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!task.completed;
        checkbox.addEventListener("change", () => toggleTaskComplete(task.id));

        const text = document.createElement("div");
        text.className = "task-text";
        text.innerText = task.text;
        if (task.completed) text.classList.add("completed");

        meta.appendChild(checkbox);
        meta.appendChild(text);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const del = document.createElement("button");
        del.innerText = "Delete";
        del.addEventListener("click", () => deleteTask(task.id));

        actions.appendChild(del);
        li.appendChild(meta);
        li.appendChild(actions);
        list.appendChild(li);
      });
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    if (stats) stats.innerText = `Total: ${total} • Completed: ${completed}`;
  }

  function save() {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    render();
  }

  function addTask(text) {
    const t = { id: Date.now() + Math.random(), text: text.trim(), completed: false };
    tasks.unshift(t);
    save();
  }

  function toggleTaskComplete(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    save();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    save();
  }

  function clearAll() {
    if (!confirm("Clear all tasks?")) return;
    tasks = [];
    save();
  }

  render();

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      addTask(val);
      input.value = "";
      input.focus();
    });
  }

  if (clearCompletedBtn) clearCompletedBtn.addEventListener("click", clearCompleted);
  if (clearAllBtn) clearAllBtn.addEventListener("click", clearAll);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    console.warn("Failed to read tasks:", e);
    return [];
  }
}

function pickReply(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

window.addEventListener("load", () => {
  const chatBox = document.getElementById("chat-box");
  if (chatBox && chatBox.children.length === 0) {
    displayMessage("Hello! It's AmigoBot here, your chat friend.", "bot");
  }
  if (document.getElementById("task-form")) {
    initPlanner();
  }
});
