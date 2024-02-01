document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const textBox = document.getElementById("textBox");
  const copyButton = document.getElementById("copyButton");
  const outputContainer = document.getElementById("outputContainer");

  // Get the room ID from the URL
  const roomId = window.location.pathname.substring(1);

  // Emit the 'joinRoom' event to join the specific room
  socket.emit("joinRoom", roomId);

  textBox.addEventListener("input", () => {
    const newText = textBox.value;
    socket.emit("textUpdate", newText);
  });

  socket.on("textUpdate", ({ id, text }) => {
    if (socket.id !== id) {
      textBox.value = text;
    }
  });
});

// Add a global event listener for unhandled promise rejections
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled Promise Rejection:", event.reason);
});
