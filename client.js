document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const textBox = document.getElementById("textBox");
  const copyButton = document.getElementById("copyButton");
  const outputContainer = document.getElementById("outputContainer");
  const participantsList = document.getElementById("participantsList");
  const languageDropdown = document.getElementById("languageDropdown");
  let languageId = languageDropdown.value;
  
  
  const roomId = window.location.pathname.substring(1);
  
  const codeEditor = CodeMirror.fromTextArea(textBox, {
    lineNumbers: true,
    mode: "javascript",  
  });
  
  socket.emit("joinRoom", roomId);
  
  codeEditor.on("change", (instance, changeObj) => {
    if (changeObj.origin !== "setValue" && changeObj.origin !== "socket") {
      const newText = codeEditor.getValue();
      socket.emit("textUpdate", newText);
    }
  });
  
  socket.on("textUpdate", ({ id, text }) => {
    if (socket.id !== id) {
      const cursor = codeEditor.getCursor();
      const scrollInfo = codeEditor.getScrollInfo();
      codeEditor.setValue(text);
      codeEditor.setCursor(cursor);
      codeEditor.scrollTo(scrollInfo.left, scrollInfo.top);
    }
  });

  socket.on("updateParticipants", (participants) => {
    participantsList.innerHTML = participants.map(participant => `<li>${participant.name}</li>`).join('');
  });

  copyButton.addEventListener("click", () => {
    const codeText = codeEditor.getValue();
    executeCode(codeText);
  });
  
  languageDropdown.addEventListener("change", () => {
    languageId = languageDropdown.value;
  });
  
  function executeCode(codeText) {
    getOutputToken(codeText)
      .then((token) => makeSecondRequest(token))
      .then((response) => {
        const stdout = response.submissions[0].stdout;
        updateOutput(stdout);
      })
      .catch((error) => {
        console.error("Error in executeCode:", error);
        // Handle the error or display an error message to the user
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
        "X-RapidAPI-Key": "d57e982ca9msh6b2b2958231b232p17e730jsn94a853cf40a5",
        "X-RapidAPI-Host": "judge0-extra-ce.p.rapidapi.com",
      },
      processData: false,
      data: JSON.stringify({
        submissions: [
          {
            language_id: parseInt(languageId),
            source_code: `${base64Code}`,
          },
        ],
      }),
    };

    return $.ajax(getTokenSettings)
      .then((response) => {
        if (response && response.length > 0 && response[0].token) {
          return response[0].token;
        } else {
          throw new Error("Invalid response format from getOutputToken");
        }
      })
      .catch((error) => {
        console.error("Error in getOutputToken:", error);
        throw error;
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

    return $.ajax(newRequestSettings)
      .catch((error) => {
        console.error("Error in makeSecondRequest:", error);
        throw error;
      });
  }

  // Add a global event listener for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
  });
});
