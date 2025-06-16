// jshint -W097
// jshint undef: true, unused: true
/* globals require,window,document,requestAnimationFrame,dat,location*/

"use strict";

var qs = require("query-string");
var glm = require("gl-matrix");
var saveAs = require("filesaver.js").saveAs;
var JSZip = require("jszip");
var Space3D = require("./space-3d.js");
var Skybox = require("./skybox.js");

var resolution = 1024;

window.onload = function() {
  var params = qs.parse(location.hash);
  if (params.backgroundColor) { params.backgroundColor = hexToRgb(params.backgroundColor); }
  if (params.sunColor) { params.sunColor = hexToRgb(params.sunColor); }
  if (params.nebulaColorBegin) { params.nebulaColorBegin = hexToRgb(params.nebulaColorBegin); }
  if (params.nebulaColorEnd) { params.nebulaColorEnd = hexToRgb(params.nebulaColorEnd); }

  var ControlsMenu = function() {
    this.seed = params.seed || generateRandomSeed();

    this.randomSeed = function() {
      this.seed = generateRandomSeed();
    };

    this.randomSeedAndRender = function() {
      randomSeed();
      renderTextures();
    };

    this.randomSeedAndRender = function() {
      this.randomSeed();
      renderTextures();
    };

    this.randomColor = function() {
      var color1 = [Math.random()*255,Math.random()*255,Math.random()*255];
      var color2 = [Math.random()*255,Math.random()*255,Math.random()*255];

      this.backgroundColor = rgbToHex(Math.pow(Math.random(),2)*32,Math.pow(Math.random(),2)*32,Math.pow(Math.random(),2)*32);

      this.sunColor = rgbToHex(...mixColor(
        saturateColor(mixColor(color1, color2, Math.random()), 2.0), // start with a hue within our standard colour range, but over-saturated
        [255,255,255],
        Math.pow(Math.random(), Math.random()>0.5?3.0:1.0/3.0) // then lean toward white, either strongly favouring white, or strongly the standard range
      ));
      this.nebulaColorBegin = rgbToHex(...color1);
      this.nebulaColorEnd = rgbToHex(...color2);
    };

    this.randomColorAndRender = function() {
      this.randomColor();
      renderTextures();
    }

    this.randomColor();
    if(params.backgroundColor !== undefined) this.backgroundColor = rgbToHex(...params.backgroundColor);
    if(params.sunColor !== undefined) this.sunColor = rgbToHex(...params.sunColor);
    if(params.nebulaColorBegin !== undefined) this.nebulaColorBegin = rgbToHex(...params.nebulaColorBegin);
    if(params.nebulaColorEnd !== undefined) this.nebulaColorEnd = rgbToHex(...params.nebulaColorEnd);

    this.fov = parseInt(params.fov) || 80;
    this.pointStars = params.pointStars === undefined ? true : params.pointStars === "true";
    this.stars = params.stars === undefined ? true : params.stars === "true";
    this.sun = params.sun === undefined ? true : params.sun === "true";
    this.sunFalloff = params.sunFalloff === undefined ? 100 : parseFloat(params.sunFalloff);
    this.jpegQuality = params.jpegQuality === undefined ? 0.85 : parseFloat(params.jpegQuality);
    this.nebulae = params.nebulae === undefined ? true : params.nebulae === "true";
    this.nebulaOpacity = params.nebulaOpacity === undefined ? 33 : parseInt(params.nebulaOpacity);
    this.noiseScale = params.nebulaOpacity === undefined ? 5 : parseFloat(params.noiseScale);
    this.nebulaBrightness = params.nebulaBrightness === undefined ? 18 : parseInt(params.nebulaBrightness);
    this.resolution = parseInt(params.resolution) || 1024;
    this.animationSpeed =
      params.animationSpeed === undefined
        ? 1.0
        : parseFloat(params.animationSpeed);
    this.saveSkybox = function() {
      const zip = new JSZip();
      for (const name of ["front", "back", "left", "right", "top", "bottom"]) {
        const canvas = document.getElementById(`texture-${name}`);
        const data = canvas.toDataURL().split(",")[1];
        zip.file(`${name}.png`, data, { base64: true });
      }
      if (this.resolution <= 2048) {
        const cubemapData = this._saveCubemap().split(",")[1];
        zip.file('cubemap.png', cubemapData, { base64: true });    
      }
      zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, "skybox.zip");
      });
    };
    this.saveSkyboxJpg = function() {
      const zip = new JSZip();
      for (const name of ["front", "back", "left", "right", "top", "bottom"]) {
        const canvas = document.getElementById(`texture-${name}`);
        const data = canvas.toDataURL('image/jpeg', this.jpegQuality).split(",")[1];
        zip.file(`${name}.jpg`, data, { base64: true });
      }
      if (this.resolution <= 2048) {
        const cubemapData = this._saveCubemap('image/jpeg', this.jpegQuality).split(",")[1];
        zip.file('cubemap.jpg', cubemapData, { base64: true });    
      }
      zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, "skybox.zip");
      });
    };
    this._saveCubemap = function(type, params) {
      type = type || "image/png";
      params = params || null;
      const cubemapCanvas = document.createElement('canvas');
      const left = document.getElementById('texture-left');
      const top = document.getElementById('texture-top');
      const front = document.getElementById('texture-front');
      const bottom = document.getElementById('texture-bottom');
      const right = document.getElementById('texture-right');
      const back = document.getElementById('texture-back');
      
      // set size of canvas depending on resolution
      var context = cubemapCanvas.getContext('2d');
      context.canvas.width = this.resolution * 4;
      context.canvas.height = this.resolution * 3;

      // combine images together in the texture-cubemap canvas
      context.drawImage(left, 0, this.resolution);
      context.drawImage(top, this.resolution, 0);
      context.drawImage(front, this.resolution, this.resolution);
      context.drawImage(bottom, this.resolution, this.resolution * 2);
      context.drawImage(right, this.resolution * 2, this.resolution);
      context.drawImage(back, this.resolution * 3, this.resolution);
    
      return cubemapCanvas.toDataURL(type, params);      
    };
  };

  var menu = new ControlsMenu();
  var gui = new dat.GUI({
    autoPlace: false,
    width: 320
  });
  gui
    .add(menu, "seed")
    .name("Seed")
    .listen()
    .onFinishChange(renderTextures);
  gui.add(menu, "randomSeedAndRender").name("Randomize seed");
  gui.add(menu, "randomColorAndRender").name("Randomize colors");
  gui.add(menu, "fov", 10, 150, 1).name("Field of view °");
  gui
    .addColor(menu, 'backgroundColor')
    .listen()
    .name("Background color")
    .onChange(renderTextures);
  gui
    .add(menu, "pointStars")
    .name("Point stars")
    .onChange(renderTextures);
  gui
    .add(menu, "stars")
    .name("Bright stars")
    .onChange(renderTextures);
  gui
    .add(menu, "sun")
    .name("Sun")
    .onChange(renderTextures);
  gui
    .addColor(menu, 'sunColor')
    .listen()
    .name("Sun color")
    .onChange(renderTextures);
  gui
    .add(menu, "sunFalloff", 50, 250, 1)
    .name("Sun Falloff")
    .onFinishChange(renderTextures);
  gui
    .add(menu, "nebulae")
    .name("Nebulae")
    .onChange(renderTextures);
  gui
    .addColor(menu, 'nebulaColorBegin')
    .listen()
    .name("Nebula Color Begin")
    .onChange(renderTextures);
  gui
    .addColor(menu, 'nebulaColorEnd')
    .listen()
    .name("Nebula Color End")
    .onChange(renderTextures);
  gui
    .add(menu, "resolution", [256, 512, 1024, 2048, 4096])
    .name("Resolution")
    .onChange(renderTextures);
  gui.add(menu, "animationSpeed", 0, 10).name("Animation speed");
  gui.add(menu, "saveSkybox").name("Download skybox png");
  gui
    .add(menu, "jpegQuality", 0.5, 1, 0.01)
    .name("Jpeg Quality")
    .onFinishChange(renderTextures);
  gui.add(menu, "saveSkyboxJpg").name("Download skybox jpeg");

  document.body.appendChild(gui.domElement);
  gui.domElement.style.position = "fixed";
  gui.domElement.style.left = "16px";
  gui.domElement.style.top = "272px";

  function hideGui() {
    gui.domElement.style.display = "none";
  }

  function showGui() {
    gui.domElement.style.display = "block";
  }

  function hideSplit() {
    document.getElementById("texture-left").style.display = "none";
    document.getElementById("texture-right").style.display = "none";
    document.getElementById("texture-top").style.display = "none";
    document.getElementById("texture-bottom").style.display = "none";
    document.getElementById("texture-front").style.display = "none";
    document.getElementById("texture-back").style.display = "none";
  }

  function showSplit() {
    document.getElementById("texture-left").style.display = "block";
    document.getElementById("texture-right").style.display = "block";
    document.getElementById("texture-top").style.display = "block";
    document.getElementById("texture-bottom").style.display = "block";
    document.getElementById("texture-front").style.display = "block";
    document.getElementById("texture-back").style.display = "block";
  }

  function setQueryString() {
    const queryString = qs.stringify({
      seed: menu.seed,
      fov: menu.fov,
      backgroundColor: menu.backgroundColor,
      pointStars: menu.pointStars,
      stars: menu.stars,
      sun: menu.sun,
      sunColor: menu.sunColor,
      sunFalloff: menu.sunFalloff,
      jpegQuality: menu.jpegQuality,
      nebulaColorBegin: menu.nebulaColorBegin,
      nebulaColorEnd: menu.nebulaColorEnd,
      nebulae: menu.nebulae,
      resolution: menu.resolution,
      animationSpeed: menu.animationSpeed
    });
    try {
      history.replaceState(null, "", "#" + queryString);
    } catch (e) {
      location.hash = queryString;
    }
  }

  var hideControls = false;

  window.onkeypress = function(e) {
    if (e.charCode == 32) {
      hideControls = !hideControls;
    }
  };

  var renderCanvas = document.getElementById("render-canvas");
  renderCanvas.width = renderCanvas.clientWidth;
  renderCanvas.height = renderCanvas.clientHeight;

  var skybox = new Skybox(renderCanvas);
  var space = new Space3D(resolution);

  function renderTextures() {
    var textures = space.render({
      seed: menu.seed,
      backgroundColor: hexToRgb(menu.backgroundColor),
      pointStars: menu.pointStars,
      stars: menu.stars,
      sun: menu.sun,
      sunColor: hexToRgb(menu.sunColor),
      sunFalloff: menu.sunFalloff,
      jpegQuality: menu.jpegQuality,
      nebulaColorBegin: hexToRgb(menu.nebulaColorBegin),
      nebulaColorEnd: hexToRgb(menu.nebulaColorEnd),
      nebulae: menu.nebulae,
      resolution: menu.resolution
    });
    skybox.setTextures(textures);

    function drawIndividual(source, targetid) {
      var canvas = document.getElementById(targetid);
      canvas.width = canvas.height = menu.resolution;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0);
    }

    drawIndividual(textures.left, "texture-left");
    drawIndividual(textures.right, "texture-right");
    drawIndividual(textures.front, "texture-front");
    drawIndividual(textures.back, "texture-back");
    drawIndividual(textures.top, "texture-top");
    drawIndividual(textures.bottom, "texture-bottom");
  }

  renderTextures();

  var tick = 0.0;

  function render() {
    hideGui();

    if (!hideControls) {
      showGui();
    }

    tick += 0.0025 * menu.animationSpeed;

    var view = glm.mat4.create();
    var projection = glm.mat4.create();

    renderCanvas.width = renderCanvas.clientWidth;
    renderCanvas.height = renderCanvas.clientHeight;

    glm.mat4.lookAt(
      view,
      [0, 0, 0],
      [Math.cos(tick), Math.sin(tick * 0.555), Math.sin(tick)],
      [0, 1, 0]
    );

    var fov = (menu.fov / 360) * Math.PI * 2;
    glm.mat4.perspective(
      projection,
      fov,
      renderCanvas.width / renderCanvas.height,
      0.1,
      8
    );

    skybox.render(view, projection);

    requestAnimationFrame(render);

    setQueryString();
  }

  render();
};

function mix(a, b, x) {
  return a + (b-a) * x;
}

function mixColor(a, b, x) {
  return [mix(a[0], b[0], x), mix(a[1], b[1], x), mix(a[2], b[2], x)];
}

function getColorBrightness(color) {
  return 0.299*color[0]+0.587*color[1]+0.114*color[2];
}

function saturateColor(a, x) {
  const brightness = getColorBrightness(a);
  return clampColor(mixColor([brightness, brightness, brightness], a, x));
}

function clampColor(color) {
  return [Math.min(color[0], 255), Math.min(color[1], 255), Math.min(color[2], 255)];
}

function rgbToHex(r, g, b) {
  return "#" + Math.floor(r).toString(16).padStart(2,'0') + Math.floor(g).toString(16).padStart(2,'0') + Math.floor(b).toString(16).padStart(2,'0');
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [1, 1, 1];
}

function generateRandomSeed() {
  return (Math.random() * 1000000000000000000).toString(36);
}
``