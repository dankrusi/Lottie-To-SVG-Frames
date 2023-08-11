//////////////////////////////////////////////////////////////////////
// Lottie To SVG Frames, by Dan Krusi
// Copyright (c) 2023 Dan Krusi
////////////////////////////////////////////////////////////////////// 

import { downloadZip } from "https://unpkg.com/client-zip/index.js";
import "https://unpkg.com/@lottiefiles/lottie-player@0.4.0/dist/lottie-player.js";
import "https://unpkg.com/jquery@3.3.1/dist/jquery.min.js";

class LottieToSVGFrames {

    // Resources:
    // https://docs.lottiefiles.com/lottie-player/components/lottie-player/usage
    // https://github.com/Touffy/client-zip

    elem;

    // JS file object from drop zone
    // Additional properties:
    //  - lottiePlayer (attached player)
    //  - contents: file contents as text
    //  - frames: array of svg frames (svg text)
    files = [];

    constructor(selector) {
        let self = this;
        self.elem = $(selector);

        self.elem.find(".action-export-all-frames-as-zip").hide();

        self.elem.find(".drop-zone").show();
        self.elem.find(".tools").show();

        self.bindEvents();
    }

    bindEvents() {
        let self = this;

        self.elem.find(".action-export-all-frames-as-zip").on("click", function () {
            self.exportAllFramesAsZIP();
        });
        self.elem.find(".action-donate-via-paypal").on("click", function () {
            self.donateViaPayPal();
        });
        self.elem.find(".drop-zone").on("dragover", function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).addClass('dragging');
        });
        self.elem.find(".drop-zone").on("dragleave", function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).addClass('dragging');
        });
        self.elem.find(".drop-zone").on("drop", function (event) {
            event.preventDefault();
            event.stopPropagation();
            self.handleFileDrop(event.originalEvent);
        });
    }

    exportFrameAsSVG(frame) {

    }

    donateViaPayPal() {
        window.open("https://www.paypal.com/donate/?hosted_button_id=24F8CNC6Q49SE", "_blank");
    }

    exportAllFramesAsZIP() {
        let self = this;

        let zipFiles = [];
        for (let i = 0; i < self.files.length; i++) {
            let file = self.files[i];
            for (let f = 0; f < file.frames.length; f++) {
                let frame = file.frames[f];
                let zipFile = { name: file.name.replace(".json", ".svg").replace(".svg", "-frame-" + (f+1) + ".svg"), lastModified: new Date(), input: frame };
                zipFiles.push(zipFile);
            }
        }

        let zipFileName = self.files[0].name.replace(".json","-frames.zip"); //TODO: what about more than one file?
        downloadZip(zipFiles).blob().then(function (blob) {
            // make and click a temporary link to download the Blob
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = zipFileName;
            link.click();
            link.remove();
        });
    }

    handleFileDrop(dropEvent) {
        let self = this;

        if (dropEvent.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...dropEvent.dataTransfer.items].forEach((item, i) => {
                // If dropped items aren't files, reject them
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    self.openFile(file);
                }
            });
        } else {
            // Use DataTransfer interface to access the file(s)
            [...dropEvent.dataTransfer.files].forEach((file, i) => {
                self.openFile(file);
            });
        }
    }

    openFile(file) {
        let self = this;
        console.log("openFile()", file);

        try {

            // Sanity
            if (file == null) throw "File was null!";
            if (file.type == null) throw "File type was null!";
            if (file.type != "application/json") throw "File is not a .json file!";

            self.files.push(file);

            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                file.json = JSON.parse(event.target.result);
                file.contents = event.target.result;
                self.createPreview(file);
            });
            reader.readAsText(file);

            self.elem.find(".action-export-all-frames-as-zip").show();

        } catch (e) {
            let filename = "";
            if (file != null && file.name != null) filename = " " + file.name;
            alert("There was an error opening the file" + filename + ": " + e);
        }


    }

    createPreview(file) {
        let self = this;
        console.log("createPreview()");

        // Create preview
        let previewElem = $("<div class='preview'/>").appendTo(self.elem.find(".previews"));
        previewElem.append($("<h2/>").text(file.name))
        let lottiePlayerElem = $("<lottie-player/>");
        lottiePlayerElem.attr("controls", "controls");
        lottiePlayerElem.attr("loop", "loop");
        lottiePlayerElem.attr("renderer", "svg");
        lottiePlayerElem.attr("mode", "normal");
        lottiePlayerElem.appendTo(previewElem);
        setTimeout(function () {
            file.lottiePlayer = lottiePlayerElem[0];
            file.lottiePlayer.load(file.contents);

            file.frames = [];
            let numFrames = file.lottiePlayer.getLottie().totalFrames;
            for (let f = 0; f < numFrames; f++) {
                file.lottiePlayer.seek(f);
                let svgString = file.lottiePlayer.snapshot(false);

                let frameElem = $("<div class='frame'/>").appendTo(previewElem);
                frameElem.append($("<h3/>").text("Frame " + (f + 1) + "/" + numFrames));
                let svgElem = $(svgString);
                svgElem.attr("style", "");
                frameElem.append(svgElem);
                file.frames.push(svgString);
            }

            file.lottiePlayer.seek(0);
            file.lottiePlayer.play();

        }, 1); // lottie bug
    }
}

export default LottieToSVGFrames;