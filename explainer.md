# WebVR Explained

## What is WebVR?
[WebVR](https://w3c.github.io/webvr/) is an API that provides access to input and output capabilities commonly associated with Virtual Reality hardware like [Google’s Daydream](https://vr.google.com/daydream/), the [Oculus Rift](https://www3.oculus.com/rift/), the [Samsung Gear VR](http://www.samsung.com/global/galaxy/gear-vr/), and the [HTC Vive](https://www.htcvive.com/). More simply put, it lets you create Virtual Reality web sites that you can view in a VR headset.

### Ooh, so like _Johnny Mnemonic_ where the Internet is all ’90s CGI?
Nope, not even slightly. And why do you even want that? That’s a terrible UX.

WebVR, at least initially, is aimed at letting you create VR experiences that are embedded in the web that we know and love today. It’s explicitly not about creating a browser that you use completely in VR (although it could work well in an environment like that).

### Goals
Enable Virtual Reality applications on the web by allowing pages to do the following:

* Detect available Virtual Reality devices.
* Query the devices capabilities.
* Poll the device’s position and orientation.
* Display imagery on the device at the appropriate frame rate.

### Non-goals

* Define how a Virtual Reality browser would work.
* Take full advantage of Augmented Reality devices.
* Build “[The Metaverse](https://en.wikipedia.org/wiki/Metaverse).”

## Use cases
Given the marketing of early VR hardware to gamers, it’s natural to expect that this API will primarily be used for development of games. While that’s certainly something we expect to see given the history of the WebGL API, which is tightly related, we’ll probably see far more “long tail”-style content than large-scale games. Broadly, VR content on the web will likely cover areas that do not cleanly fit into the app-store models being used as the primary distribution methods by all the major VR hardware providers, or where the content itself is not permitted by the store guidelines.

### Video
360° and 3D video are areas of immense interest (for example, see [ABC’s 360° video coverage of the upcoming US election](http://abcnews.go.com/US/fullpage/abc-news-vr-virtual-reality-news-stories-33768357)), and the web has proven massively effective at distributing video in the past. A VR-enabled video player would, upon detecting the presence of VR hardware, show a “View in VR” button, similar to the “Fullscreen” buttons present in today’s video players. When the user clicks that button, a video would render in the headset and respond to natural head movement. Traditional 2D video could also be presented in the headset as though the user is sitting in front of a theater-sized screen, providing a more immersive experience.

### Object/data visualization
Sites can provide easy 3D visualizations through WebVR, often as a progressive improvement to their more traditional rendering. Viewing 3D models (e.g., [SketchFab](https://sketchfab.com/)), architectural previsualizations, medical imaging, mapping, and [basic data visualization](http://graphics.wsj.com/3d-nasdaq/) can all be more impactful, easier to understand, and convey an accurate sense of scale in VR. For those use cases, few users would justify installing a native app, especially when web content is simply a link or a click away.

Home shopping applications (e.g., [Matterport](https://matterport.com/try/)) serve as particularly effective demonstrations of this. Depending on device capabilities, sites can scale all the way from a simple photo carousel to an interactive 3D model on screen to viewing the walkthrough in VR, giving users the impression of actually being present in the house. The ability for this to be a low-friction experience for users is a huge asset for both users and developers, since they don’t need to convince users to install a heavy (and possibly malicious) executable before hand.

### Artistic experiences
VR provides an interesting canvas for artists looking to explore the possibilities of a new medium. Shorter, abstract, and highly experimental experiences are often poor fits for an app-store model, where the perceived overhead of downloading and installing a native executable may be disproportionate to the content delivered. The web’s transient nature makes these types of applications more appealing, since they provide a frictionless way of viewing the experience. Artists can also more easily attract people to the content and target the widest range of devices and platforms with a single code base.

## Basic API usage

### Device detection
The first thing that any VR-enabled page will want to do is enumerate the available VR hardware and determine which one to interact with.

```js
var vrDisplay = null;
navigator.getVRDisplays().then(function (displays) {
  // Use the first display in the array if one is available. If multiple
  // displays are present, you may want to present the user with a way of
  // choosing which display to use.
  if (displays.length > 0) {
    vrDisplay = displays[0];
    // If the user has VR hardware, using `vrDisplay`, advertise your
    // page's VR features (i.e., render your VR scene).
    showVRFeatures();
  } else {
    // Could not find any VR hardware connected.
  }
});
```

[`navigator.getVRDisplays`](https://w3c.github.io/webvr/#navigator-getvrdisplays-attribute) returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that, when resolved, provides a list of available displays. Each [`VRDisplay`](https://w3c.github.io/webvr/#interface-vrdisplay) represents a single piece of physical VR hardware. On desktops this will usually be a headset peripheral; on mobile devices it may represent the device itself in conjunction with a viewer harness (e.g., Google Cardboard or Samsung Gear VR).

### Device capabilities
VR headsets can differ significantly in their tracking and display capabilities. For instance, VR hardware tracks the hardware’s orientation and/or position of the hardware in space. A headset that tracks only orientation is referred to as having 3-Degrees-of-Freedom (3DoF) tracking. A headseat that tracks orientation and position is referred to as having 6-Degrees-of-Freedom (6DoF) tracking.

To determine the headset’s capabilities and the page’s behavior accordingly, developers can inspect the [`capabilities` attribute](https://w3c.github.io/webvr/#interface-vrdisplaycapabilities) of the [`VRDisplay` instance](https://w3c.github.io/webvr/#interface-vrdisplay).

```js
if (vrDisplay.capabilities.hasPosition) {
  // This headset can track its position.
}
if (vrDisplay.capabilities.hasOrientation) {
  // This headset can track its orientation, which should almost
  // always be the case.
}
if (vrDisplay.capabilities.hasExternalDisplay) {
  // The headset is a separate display from the main monitor, which
  // means you should consider mirroring the content shown on the headset.
  // This is usually `true` on PCs and `false` on mobile devices.
}
if (vrDisplay.capabilities.canPresent) {
  // If this is `false`, then the headset can’t actually present content to
  // the user in stereo. Although you may want to take the tracking
  // into account, you shouldn’t advertise “VR mode” to users.
  // Google Project Tango devices are good examples of a headset that would
  // expose 6DoF tracking but without presentation capabilities. Instead,
  // they can be used as a “magic window” into a virtual space.
}
```

### Headset input
WebVR provides tracking information via the [`getPose` method](https://w3c.github.io/webvr/#dom-vrdisplay-getpose) method of the [`VRDisplay` instance](https://w3c.github.io/webvr/#interface-vrdisplay), which developers can use to poll the display for new position, orientation, velocity, and acceleration data on each frame. The ideal pattern is to query this information within a [`VRDisplay#requestAnimationFrame`](https://w3c.github.io/webvr/#dom-vrdisplay-requestanimationframe) callback loop, which runs at the refresh rate of the headset (which is frequently higher than that of an average monitor). The [pose](https://w3c.github.io/webvr/#vrpose) can then be used to update either the viewpoint of a scene or the position and orientation of an object within that scene.

```js
function onAnimationFrame (time) {
  // When presenting content to the headset, we want to update at its
  // refresh rate if it differs from the refresh rate of the main
  // display. Calling `VRDisplay#requestAnimationFrame` ensures we render
  // at the right speed for VR.
  vrDisplay.requestAnimationFrame(onAnimationFrame);

  // Orientation is reported as a quaternion.
  camera.orientation = pose.orientation;

  // Need to account for the fact that not all headsets report position.
  if (pose.position) {
  	camera.position = pose.position;
  } else {
    camera.position = [0, 0, 0];
  }

  drawScene(camera);
}
```

### Rendering
Currently the only supported rendering method is [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API), though that’s likely to change in future versions of the WebVR API. In order to render a WebGL scene that will feel correct when viewed through a headset, values from the [`VREyeParameters`](https://w3c.github.io/webvr/#interface-vreyeparameters) interface that describe the field of view, resolution, and [interpupillary distance](https://en.wikipedia.org/wiki/Interpupillary_distance) (IPD) are used to set up WebGL’s view and projection matrices.

```js
function drawSceneForEye (eyeName, camera) {
  // `eyeName` is a string equal to `left` or `right`.
  var eye = vrDisplay.getEyeParameters(eyeName);

  // Adjust the camera to render correctly for this eye.
  camera.setFieldOfView(eye.fieldOfView);
  camera.position.translate(eye.offset);

  // Render scene’s 3D content here using the camera.
  // …
}
```

### Output
VR hardware frequently needs to make use of specialized display paths to counteract distortion introduced by the lenses, compensate for latency, etc. As a result, VR content can’t simply be drawn to the screen like a normal web app would; instead, VR content must be explicitly submitted to the `VRDisplay` instance. In order to do that, the page must first request permission to begin presenting to the `VRDisplay` using [`VRDisplay#requestPresent`](https://w3c.github.io/webvr/#dom-vrdisplay-requestpresent), which takes in the WebGL canvas whose contents will be shown on the headset and returns a Promise that will resolve or reject if the page can begin presenting or not, respectively.

```js
function enterVRMode () {
  vrDisplay.requestPresent([{source: glCanvas}]).then(function () {
    // Presentation began successfully, so kick off the animation loop.
    vrDisplay.requestAnimationFrame(onAnimationFrame);
  }, function (err) {
    // Unable to begin presentation for some reason.
    console.error('Could not present VR', err);
  });
}
```

The page is responsible for rendering a stereo view by drawing out the content for each eye to one half of the canvas. Then, once the rendering has completed, the page must notify the headset that it’s done by calling the [`VRDisplay#submitFrame`](https://w3c.github.io/webvr/#dom-vrdisplay-submitframe) method.

```js
function drawScene (camera) {
  // Draw the left eye.
  gl.viewport(0, 0, glCanvas.width * 0.5, glCanvas.height);
  drawSceneForEye("left", camera);

  // Draw the right eye.
  gl.viewport(glCanvas.width * 0.5, 0, glCanvas.width * 0.5, glCanvas.height);
  drawSceneForEye("right", camera);

  // Notify the headset that the new frame is ready.
  vrDisplay.submitFrame();
}
```

To stop presenting to the `VRDisplay`, the page must call the [`VRDisplay#exitPresent`](https://w3c.github.io/webvr/#dom-vrdisplay-exitpresent) method.

### More sample code
This overview attempts to touch on all the important parts of using WebVR but, for the sake of clarity, avoids discussing advanced uses. For developers who want to dig a bit deeper, there are several working samples of the API in action at https://webvr.info/samples/. These samples each outline a specific part of the API with plenty of code comments to help guide developers through what everything is doing.

## I don’t understand why this is a new API. Why can’t we use…

### `DeviceOrientation` Events
The data provided by a `VRPose` instance is similar to the data provided by `DeviceOrientationEvent`, with some key differences:

* It’s an explicit polling interface, which ensures that new input is available for each frame. The event-driven `DeviceOrientation` data may skip a frame, or may deliver two updates in a single frame, which can lead to disruptive, jittery motion in a VR application.
* `DeviceOrientation` events do not provide positional data, which is a key feature of high-end VR hardware.
* More can be assumed about the intended use case of `VRDisplay` data, so optimizations such as motion prediction can be applied.
* `DeviceOrientation` events are typically not available on desktops.

That being said, however, for some simple VR devices (e.g., Cardboard) `DeviceOrientation` events provide enough data to create a basic [polyfill](https://en.wikipedia.org/wiki/Polyfill) of the WebVR API, as demonstrated by [Boris Smus](https://twitter.com/borismus)’ wonderful [`webvr-polyfill` project](https://github.com/borismus/webvr-polyfill). This provides an approximation of a native implementation, allowing developers to experiment with the API even when unsupported by the user’s browser. While useful for testing and compatibility, such pure-JavaScript implementations miss out on the ability to take advantage of VR-specific optimizations available on some mobile devices (e.g., Google Daydream-ready phones or Samsung Gear VR’s compatible device lineup). A native implementation on mobile can provide a much better experience with lower latency, less jitter, and higher graphics performance than can a `DeviceOrientation`-based one.

### WebSockets
A local [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) service could be set up to relay headset poses to the browser. Some early VR experiments with the browser tried this route, and some non-VR tracking devices (most notably [Leap Motion](https://www.leapmotion.com/)) have built their JavaScript SDKs around this concept. Unfortunately, this has proven to be a high-latency route. A key element of a good VR experience is low latency. Ideally, the movement of your head should result in an update on the display (referred to as “motion-to-photons time”) in 20ms or fewer. The browser’s rendering pipeline already makes hitting this goal difficult, and adding additional overhead for communication over WebSockets only exaggerates the problem. Additionally, using such a method requires users to install a separate service, likely as a native app, on their machine, eroding away much of the benefit of having access to the hardware via the browser. It also falls down on mobile where there’s no clear way for users to install such a service.

### The Gamepad API
Some people have suggested that we try to expose VR headset data through the [Gamepad API](https://w3c.github.io/gamepad/), which seems like it should provide enough flexibility through an unbounded number of potential axes. While it would be technically possible, there are a few properties of the API that currently make it poorly suited for this use.

* Axes are normalized to always report data in a `[-1, 1]` range. That may work sufficiently for orientation reporting, but when reporting position or acceleration, you would have to choose an arbitrary mapping of the normalized range to a physical one (i.e., `1.0` is equal to 2 meters or similar). But that forces developers to make assumptions about the capabilities of future VR hardware, and the mapping makes for error-prone and unintuitive interpretation of the data.
* Axes are not explicitly associated with any given input, making it difficult for users to remember if axis `0` is a component of devices’ position, orientation, acceleration, etc.
* VR device capabilities can differ significantly, and the Gamepad API currently doesn’t provide a way to communicate a device’s features and its optical properties.
* Gamepad features such as buttons have no clear meaning when describing a VR headset and its periphery.

There is a related effort to expose 3DoF and 6DoF VR controllers through the Gamepad API by adding a `pose` attribute and some other related properties. Although these additions would make the API more accommodating for headsets, we feel that it’s best for developers to have a separation of concerns such that devices exposed by the Gamepad API can be reasonably assumed to be gamepad-like and devices exposed by the WebVR API can be reasonably assumed to be headset-like.

### These alternatives don’t account for display
It’s important to realize that all of the alternative solutions offer no method of displaying imagery on the headset itself, with the exception of Cardboard-like devices where you can simply render a fullscreen split view. Even so, that doesn’t take into account how to communicate the projection or distortion necessary for an accurate image. Without a reliable display method the ability to query inputs from a headset becomes far less valuable.
