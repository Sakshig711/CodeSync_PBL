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

  copyButton.addEventListener("click", () => {
    const codeText = textBox.value;
    executeCode(codeText);
  });

  function executeCode(codeText) {
    getOutputToken(codeText)
      .then(function (token) {
        return makeSecondRequest(token);
      })
      .then(function (response) {
        const stdout = response.submissions[0].stdout;
        updateOutput(stdout);
      })
      .catch(function (error) {
        console.error("Error: ", error);
      });
  }

  function updateOutput(stdout) {
    outputContainer.innerText = stdout;
    console.log(stdout);
  }

  function textToBase64(text) {
    return btoa(text);
  }

  function getOutputToken(codeText) {
    const base64Code = textToBase64(codeText);

    const getTokenSettings = {
      async: true,
      crossDomain: true,
      url: "https://judge0-extra-ce.p.rapidapi.com/submissions/batch?base64_encoded=true",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "b18550a92dmshaf84c14d5e4596ep1fb318jsnfda795c172cd",
        "X-RapidAPI-Host": "judge0-extra-ce.p.rapidapi.com",
      },
      processData: false,
      data: JSON.stringify({
        submissions: [
          {
            language_id: 1,
            source_code: `${base64Code}`,
          },
        ],
      }),
    };

    return $.ajax(getTokenSettings)
      .then(function (response) {
        // Check if the response has the expected structure
        if (response && response.length > 0 && response[0].token) {
          return response[0].token;
        } else {
          throw new Error("Invalid response format from getOutputToken");
        }
      })
      .catch(function (error) {
        console.error("Error in getOutputToken:", error);
        throw error; // Propagate the error to the next catch block
      });
  }

  function makeSecondRequest(token) {
    const newRequestSettings = {
      async: true,
      crossDomain: true,
      url: `https://judge0-extra-ce.p.rapidapi.com/submissions/batch?tokens=${token}&base64_encoded=false&fields=stdout`,
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "b18550a92dmshaf84c14d5e4596ep1fb318jsnfda795c172cd",
        "X-RapidAPI-Host": "judge0-extra-ce.p.rapidapi.com",
      },
    };

    return $.ajax(newRequestSettings).catch(function (error) {
      console.error("Error in makeSecondRequest:", error);
      throw error; // Propagate the error to the next catch block
    });
  }

  function executeCode(codeText) {
    return getOutputToken(codeText)
      .then(function (token) {
        return makeSecondRequest(token);
      })
      .then(function (response) {
        const stdout = response.submissions[0].stdout;
        updateOutput(stdout);
      })
      .catch(function (error) {
        console.error("Error in executeCode:", error);
        // Handle the error or display an error message to the user
      });
  }
});

// Add a global event listener for unhandled promise rejections
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled Promise Rejection:", event.reason);
});
