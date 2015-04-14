/* -*- mode: javascript; js-indent-level: 2 -*- */
'use strict';

var an;

window.onload = function() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  var video = document.getElementById('video');
  var topContainer = document.getElementById('top-container');
  var streamCanvas = document.getElementById('stream');
  var snapshotCanvas = document.getElementById('snapshot');
  var toggleButton = document.getElementById('toggleButton');
  var captureButton = document.getElementById('captureButton');
  var undoButton = document.getElementById('undoButton');
  var playButton = document.getElementById('playButton');
  var clearButton = document.getElementById('clearButton');
  var clearConfirmDialog = document.getElementById('clearConfirmDialog');
  var clearConfirmButton = document.getElementById('clearConfirmButton');
  var clearCancelButton = document.getElementById('clearCancelButton');
  var saveButton = document.getElementById('saveButton');
  var saveDialog = document.getElementById('saveDialog');
  var fileNameInput = saveDialog.querySelector('input');
  var saveConfirmButton = document.getElementById('saveConfirmButton');
  var saveCancelButton = document.getElementById('saveCancelButton');
  var loadButton = document.getElementById('loadButton');
  var exportButton = document.getElementById('exportButton');
  var whammyButton = document.getElementById('whammyButton');
  var compareButton = document.getElementById('compareButton');
  var playbackSpeedSelector = document.getElementById('playbackSpeed');

  var captureClicks = function (e) {e.stopPropagation()};

  var showSpinner = function() {
//    topContainer.style.opacity = 0.5;
//    topContainer.addEventListener('click', captureClicks, true);
  };

  var hideSpinner = function() {
//    topContainer.style.opacity = null;
//    topContainer.removeEventListener('click', captureClicks, true);
  };

  var doCompare = function(whammyData, webmData) {
    console.log('Compare!');
    var decoder = new webm.Decoder(whammyData);
    decoder.verify(true);
    decoder = new webm.Decoder(webmData);
    decoder.verify(true);
  };
  
  var saveCB = function () {
    var value = fileNameInput.value;
    if (!value.length)
      value = 'StopMotion';
    value = value.replace(/\s+/g, '_');
    value = value.replace(/[^\w\-\.]+/g, '');
    if (value.endsWith('.webm'))
      value = value.substring(0, value.length - 4);
    if (!value.endsWith('.mng'))
      value += '.mng';
    saveDialog.close();
    showSpinner();
    an.save(value, hideSpinner);
  };

  var exportCB = function () {
    var value = fileNameInput.value;
    if (!value.length)
      value = 'StopMotion';
    value = value.replace(/\s+/g, '_');
    value = value.replace(/[^\w\-\.]+/g, '');
    if (value.endsWith('.mng'))
      value = value.substring(0, value.length - 5);
    if (!value.endsWith('.webm'))
      value += '.webm';
    saveDialog.close();
    showSpinner();
    an.export(value, hideSpinner);
  };

  var whammyCB = function () {
    var value = fileNameInput.value;
    if (!value.length)
      value = 'StopMotion';
    value = value.replace(/\s+/g, '_');
    value = value.replace(/[^\w\-\.]+/g, '');
    if (value.endsWith('.mng'))
      value = value.substring(0, value.length - 5);
    if (!value.endsWith('.webm'))
      value += '.webm';
    saveDialog.close();
    showSpinner();
    an.whammyExport(value, hideSpinner);
  };

  // Create Animator object and set up callbacks.
  an = new animator.Animator(video, streamCanvas, snapshotCanvas);
  an.frameTimeout = function() {
    return 1000.0 / playbackSpeedSelector.value;
  };
  toggleButton.onclick = function() {
    an.toggleVideo();
    if (an.video.paused)
      toggleButton.firstChild.src = "images/on72.png";
    else
      toggleButton.firstChild.src = "images/off72.png";
  };
  captureButton.onclick = function () {
    an.capture();
    captureButton.style.backgroundColor = "#4682b4";
    setTimeout(function() {captureButton.style.backgroundColor = "#b0c4de";}, 500);
  };
  undoButton.onclick = an.undoCapture.bind(an);
  playButton.onclick = an.togglePlay.bind(an);
  clearButton.onclick = function() {
    if (!an.frames.length)
      return;
    clearConfirmDialog.showModal();
  };
  clearConfirmButton.onclick = function () {
    an.clear();
    clearConfirmDialog.close();
  };
  clearCancelButton.onclick = function () {
    clearConfirmDialog.close();
  };
  saveButton.onclick = function () {
    if (!an.frames.length || an.saved)
      return;
    if (an.name)
      fileNameInput.value = an.name;
    saveConfirmButton.onclick = saveCB;
    saveDialog.showModal();
  };
  saveCancelButton.onclick = function () {
    saveDialog.close();
  };
  exportButton.onclick = function () {
    if (!an.frames.length || an.exported)
      return;
    if (an.name)
      fileNameInput.value = an.name;
    saveConfirmButton.onclick = exportCB;
    saveDialog.showModal();
  };
  whammyButton.onclick = function () {
    if (!an.frames.length || an.exported)
      return;
    if (an.name)
      fileNameInput.value = an.name;
    saveConfirmButton.onclick = whammyCB;
    saveDialog.showModal();
  };
  
  compareButton.onclick = function () {
    if (!an.frames.length || an.exported)
      return;
    var webmEncoder = new webm.Encoder();
    var webmBlob = webmEncoder.encode('test', an.w, an.h, an.frameTimeout(), an.frames.length, an.getFrameVP8.bind(an));
    var webmReader = new FileReader();
    webmReader.onloadend = function() {
      var webmArr = new Uint8Array(this.result.length);
      for (var i = 0; i < this.result.length; i++)
        webmArr[i] = this.result.charCodeAt(i);
      var webmReader = this;
      var whammyEncoder = new Whammy.Video(1000.0 / an.frameTimeout());
      for (var i = 0; i < an.frames.length; i++)
        whammyEncoder.add(an.getFrameWebP(i));
      var whammyBlob = whammyEncoder.compile();
      var whammyReader = new FileReader();
      whammyReader.onloadend = function() {
        var whammyArr = new Uint8Array(this.result.length);
        for (var i = 0; i < this.result.length; i++)
          whammyArr[i] = this.result.charCodeAt(i);
        doCompare(whammyArr, webmArr);
      };
      whammyReader.readAsBinaryString(whammyBlob);
    };
    webmReader.readAsBinaryString(webmBlob);

  };
  loadButton.onclick = function () {
    var fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.addEventListener("change", function () {
      if (this.files[0]) {
        showSpinner();
        an.load(this.files[0], hideSpinner);
      }
      this.files = [];
    }, false);
    fileInput.click();
  }

  // Everything is set up, now connect to camera.
  MediaStreamTrack.getSources(function(sources) {
    var videoSources = [];
    for (var i = 0; i < sources.length; i++)
      if (sources[i].kind == 'video')
        videoSources.push(sources[i]);
    if (videoSources.length > 1) {
      var canvasColumnDiv = document.getElementById('canvas-column');
      var selectDiv = document.createElement('div');
      canvasColumnDiv.appendChild(selectDiv);
      var cameraSelect = document.createElement('select');
      cameraSelect.id = 'camera-select';
      selectDiv.appendChild(cameraSelect);
      for (var i = 0; i < videoSources.length; i++) {
        if (videoSources[i].kind != 'video')
          continue;
        var cameraOption = document.createElement('option');
        cameraOption.value = videoSources[i].id;
        cameraOption.innerText = 'Camera ' + (i + 1);
        cameraSelect.appendChild(cameraOption);
        if (i == 0)
          cameraOption.selected = true;
      }
      cameraSelect.onchange = function(e) {
        an.detachStream();
        an.attachStream(e.target.value);
      };
      an.attachStream(videoSources[0].id);
    } else {
      an.attachStream();
    }
  });
};
