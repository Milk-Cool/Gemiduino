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

const submit = async data => {
    const f = await fetch("/", {
        "method": "POST",
        "body": data,
        "headers": {
            "Content-Type": "application/octet-stream"
        }
    });
    const j = await f.json();
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