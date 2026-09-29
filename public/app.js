// v2.1.0 - 2026-09-28 - Retell browser SDK 3.0.1 (RetellWebClient); passes transport + iceServers from /v3/create-web-call
/**
 * RealWealth Riley Widget - voice call client (source for public/bundle.js)
 * Build: npx esbuild public/app.js --bundle --format=iife --global-name=App --outfile=public/bundle.js
 */
import { RetellWebClient } from "retell-client-js-sdk";

const retellWebClient = new RetellWebClient();
var isCalling = false;
var callButton = document.getElementById("callButton");
var statusText = document.getElementById("status");
var transcriptDiv = document.getElementById("transcript");
retellWebClient.on("call_started", () => {
  console.log("Call started");
  updateStatus("Connected - Riley is listening...", "connected");
  isCalling = true;
  callButton.textContent = "End Call";
  callButton.classList.add("active");
});
retellWebClient.on("call_ended", () => {
  console.log("Call ended");
  updateStatus("Call ended", "idle");
  isCalling = false;
  callButton.textContent = "Start Call";
  callButton.classList.remove("active");
});
retellWebClient.on("agent_start_talking", () => {
  updateStatus("Riley is speaking...", "speaking");
});
retellWebClient.on("agent_stop_talking", () => {
  updateStatus("Riley is listening...", "connected");
});
retellWebClient.on("update", (update) => {
  if (update.transcript) {
    transcriptDiv.innerHTML = update.transcript.map((t) => `<p><strong>${t.role === "agent" ? "Riley" : "You"}:</strong> ${t.content}</p>`).join("");
    transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
  }
});
retellWebClient.on("error", (error) => {
  console.error("Error:", error);
  updateStatus("Error: " + error.message, "error");
  isCalling = false;
  callButton.textContent = "Start Call";
  callButton.classList.remove("active");
});
function updateStatus(message, state) {
  statusText.textContent = message;
  statusText.className = "status " + state;
}
async function toggleCall() {
  if (isCalling) {
    retellWebClient.stopCall();
  } else {
    try {
      updateStatus("Connecting...", "connecting");
      callButton.disabled = true;
      const response = await fetch("/create-web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error("Failed to create call");
      }
      const data = await response.json();
      if (data.access_token) {
        // v2.1.0: Retell v3 web calls connect over the "gateway" transport.
        // Pass transport + ICE servers from /v3/create-web-call through to the client.
        await retellWebClient.startCall({
          accessToken: data.access_token,
          callId: data.call_id,
          transport: data.transport,
          iceServers: data.ice_servers
        });
      } else {
        throw new Error("No access token received");
      }
    } catch (error) {
      console.error("Error starting call:", error);
      updateStatus("Error: " + error.message, "error");
    } finally {
      callButton.disabled = false;
    }
  }
}
window.toggleCall = toggleCall;
