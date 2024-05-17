/** @type {MediaStream} */
let cameraStream;

const startVideo = async () => {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.querySelector("#camera");
    const videoSubmit = document.querySelector("#camera-submit");
    video.classList.toggle("hidden");
    video.srcObject = cameraStream;
    video.onloadedmetadata = () => video.play();
    videoSubmit.classList.toggle("hidden");
}

const displayResults = json => {
    const dialog = document.querySelector("#result");
    dialog.replaceChildren();

    const headline = document.createElement("div");
    headline.setAttribute("slot", "headline");
    headline.innerText = "Gemiduino results";
    dialog.appendChild(headline);

    const content = document.createElement("div");
    content.setAttribute("slot", "content");
    
    const parts = document.createElement("md-list");
    for(const part of json.parts) {
        const partEl = document.createElement("md-list-item");
        partEl.innerText = part.name;
        parts.appendChild(partEl);
    }
    content.appendChild(parts);

    const aiSuggestions = document.createElement("div");
    const aiSuggestionsHeadline = document.createElement("h1");
    aiSuggestionsHeadline.innerText = "AI suggestions";
    aiSuggestions.appendChild(aiSuggestionsHeadline);
    const aiSuggestionsText = document.createElement("p");
    aiSuggestionsText.innerText = json.ai_suggestions;
    aiSuggestions.appendChild(aiSuggestionsText);
    content.appendChild(aiSuggestions);

    const manSuggestions = document.createElement("div");
    const manSuggestionsHeadline = document.createElement("h1");
    manSuggestionsHeadline.innerText = "Project suggestions";
    manSuggestions.appendChild(manSuggestionsHeadline);
    const manSuggestionsList = document.createElement("md-list");
    for(const suggestion of json.man_suggestions) {
        const suggestionEl = document.createElement("md-list-item");
        const suggestionLink = document.createElement("a");
        suggestionLink.href = suggestion.link;
        suggestionLink.innerText = suggestion.name;
        suggestionLink.target = "_blank";
        suggestionEl.appendChild(suggestionLink);
        manSuggestionsList.appendChild(suggestionEl);
    }
    manSuggestions.appendChild(manSuggestionsList);
    content.appendChild(manSuggestions);

    dialog.appendChild(content);

    const actions = document.createElement("div");
    actions.setAttribute("slot", "actions");
    const close = document.createElement("md-text-button");
    close.innerText = "Close";
    close.addEventListener("click", () => dialog.close());
    actions.appendChild(close);
    dialog.appendChild(actions);

    dialog.removeAttribute("open");
    dialog.setAttribute("open", "");
}

const submit = async data => {
    const progress = document.querySelector("#loading");
    progress.classList.toggle("hidden");
    const f = await fetch("/", {
        "method": "POST",
        "body": data,
        "headers": {
            "Content-Type": "application/octet-stream"
        }
    });
    const json = await f.json();
    displayResults(json);
    progress.classList.toggle("hidden");
}

const submitCamera = async () => {
    if(!cameraStream) return;
    const cap = new ImageCapture(cameraStream.getVideoTracks()[0]);
    submit(await cap.takePhoto());
}

const submitFile = e => {
    const file = e.target.files[0];
    if(!file) return;
    const fr = new FileReader();
    fr.onload = async e2 => {
        if(e2.target.readyState != FileReader.DONE) return;
        await submit(e2.target.result);
    };
    fr.readAsArrayBuffer(file);
}
document.querySelector("#file").addEventListener("change", submitFile);