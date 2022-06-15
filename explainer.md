# WebXR Device API Explained
The [WebXR Device API](https://immersive-web.github.io/webxr/) provides access to input and output capabilities commonly associated with Virtual Reality (VR) and Augmented Reality (AR) devices. It allows you develop and host VR and AR experiences on the web.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Contents

- [What is WebXR?](#what-is-webxr)
  - [Goals](#goals)
  - [Non-goals](#non-goals)
  - [Target hardware](#target-hardware)
  - [What's the X in XR mean?](#whats-the-x-in-xr-mean)
  - [Is this API affiliated with OpenXR?](#is-this-api-affiliated-with-openxr)
- [Use cases](#use-cases)
  - [Video](#video)
  - [Object/data visualization](#objectdata-visualization)
  - [Artistic experiences](#artistic-experiences)
- [Lifetime of a VR web app](#lifetime-of-a-vr-web-app)
  - [XR hardware](#xr-hardware)
  - [Detecting and advertising XR capabilities](#detecting-and-advertising-xr-capabilities)
  - [Requesting a Session](#requesting-a-session)
  - [Setting up an XRWebGLLayer](#setting-up-an-xrwebgllayer)
  - [Main render loop](#main-render-loop)
  - [Viewer tracking](#viewer-tracking)
  - [Handling session visibility](#handling-session-visibility)
  - [Ending the XR session](#ending-the-xr-session)
- [Inline sessions](#inline-sessions)
- [Advanced functionality](#advanced-functionality)
  - [Feature dependencies](#feature-dependencies)
  - [Controlling rendering quality](#controlling-rendering-quality)
  - [Dynamic viewport scaling](#dynamic-viewport-scaling)
  - [Controlling depth precision](#controlling-depth-precision)
  - [Preventing the compositor from using the depth buffer](#preventing-the-compositor-from-using-the-depth-buffer)
  - [Changing the Field of View for inline sessions](#changing-the-field-of-view-for-inline-sessions)
- [Appendix A: I don’t understand why this is a new API. Why can’t we use…](#appendix-a-i-dont-understand-why-this-is-a-new-api-why-cant-we-use)
  - [`DeviceOrientation` Events](#deviceorientation-events)
  - [WebSockets](#websockets)
  - [The Gamepad API](#the-gamepad-api)
  - [These alternatives don’t account for presentation](#these-alternatives-dont-account-for-presentation)
  - [What's the deal with WebVR?](#whats-the-deal-with-webvr)
- [Appendix B: Proposed IDL](#appendix-b-proposed-idl)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## What is WebXR?

### Goals
Enable XR applications on the web by allowing pages to do the following:

* Detect if XR capabilities are available.
* Query the XR device capabilities.
* Poll the XR device and associated input device state.
* Display imagery on the XR device at the appropriate frame rate.

### Non-goals

* Define how a Virtual Reality or Augmented Reality browser would work.
* Expose every feature of every piece of VR/AR hardware.
* Build “[The Metaverse](https://en.wikipedia.org/wiki/Metaverse).”

### Target hardware

Examples of supported devices include (but are not limited to):

 - [ARCore-compatible devices](https://developers.google.com/ar/discover/supported-devices)
 - [Google Daydream](https://vr.google.com/daydream/)
 - [HTC Vive](https://www.htcvive.com/)
 - [Magic Leap One](https://www.magicleap.com/magic-leap-one)
 - [Microsoft Hololens](https://www.microsoft.com/en-us/hololens/)
 - [Oculus Rift](https://www3.oculus.com/rift/)
 - [Samsung Gear VR](http://www.samsung.com/global/galaxy/gear-vr/)
 - [Windows Mixed Reality headsets](https://developer.microsoft.com/en-us/windows/mixed-reality)

### What's the X in XR mean?

There's a lot of "_____ Reality" buzzwords flying around today. Virtual Reality, Augmented Reality, Mixed Reality... it can be hard to keep track, even though there's a lot of similarities between them. This API aims to provide foundational elements to do all of the above. And since we don't want to be limited to just one facet of VR or AR (or anything in between) we use "X", not as part of an acronym but as an algebraic variable of sorts to indicate "Your Reality Here". We've also heard it called "Extended Reality" and "Cross Reality", which seem fine too, but really the X is whatever you want it to be!

### Is this API affiliated with OpenXR?

Khronos' upcoming [OpenXR API](https://www.khronos.org/openxr) does cover the same basic capabilities as the WebXR Device API for native applications. As such it may seem like WebXR and OpenXR have a relationship like WebGL and OpenGL, where the web API is a near 1:1 mapping of the native API. This is **not** the case with WebXR and OpenXR, as they are distinct APIs being developed by different standards bodies.

That said, given the shared subject matter many of the same concepts are represented by both APIs in different ways and we do expect that once OpenXR becomes publically available it will be reasonable to implement WebXR's feature set using OpenXR as one of multiple possible native backends.

## Use cases
Given the marketing of early XR hardware to gamers, one may naturally assume that this API will primarily be used for development of games. While that’s certainly something we expect to see given the history of the WebGL API, which is tightly related, we’ll probably see far more “long tail”-style content than large-scale games. Broadly, XR content on the web will likely cover areas that do not cleanly fit into the app-store models being used as the primary distribution methods by all the major VR/AR hardware providers, or where the content itself is not permitted by the store guidelines. Some high level examples are:

### Video
360° and 3D video are areas of immense interest (for example, see [ABC’s 360° video coverage](http://abcnews.go.com/US/fullpage/abc-news-vr-virtual-reality-news-stories-33768357)), and the web has proven massively effective at distributing video in the past. An XR-enabled video player would, upon detecting the presence of XR hardware, show a “View in VR” button, similar to the “Fullscreen” buttons present in today’s video players. When the user clicks that button, a video would render in the headset and respond to natural head movement. Traditional 2D video could also be presented in the headset as though the user is sitting in front of a theater-sized screen, providing a more immersive experience.

### Object/data visualization
Sites can provide easy 3D visualizations through WebXR, often as a progressive improvement to their more traditional renderings. Viewing 3D models (e.g., [SketchFab](https://sketchfab.com/)), architectural previsualizations, medical imaging, mapping, and [basic data visualization](http://graphics.wsj.com/3d-nasdaq/) can all be more impactful, easier to understand, and convey an accurate sense of scale in VR and AR. For those use cases, few users would justify installing a native app, especially when web content is simply a link or click away.

Home shopping applications (e.g., [Matterport](https://matterport.com/try/)) serve as particularly effective demonstrations. Depending on device capabilities, sites can scale all the way from a simple photo carousel to an interactive 3D model on screen to viewing the walkthrough in VR, giving users the impression of actually being present in the house. The ability for this to be a low-friction experience for users is a huge asset for both users and developers, since they don’t need to convince users to install a heavy (and possibly malicious) executable before hand.

### Artistic experiences
VR provides an interesting canvas for artists looking to explore the possibilities of a new medium. Shorter, abstract, and highly experimental experiences are often poor fits for an app-store model, where the perceived overhead of downloading and installing a native executable may be disproportionate to the content delivered. The web’s transient nature makes these types of applications more appealing, since they provide a frictionless way of viewing the experience. Artists can also more easily attract people to the content and target the widest range of devices and platforms with a single code base.

## Lifetime of a VR web app

The basic steps most WebXR applications will go through are:

 1. **Query** to see if the desired XR mode is supported.
 1. If support is available, **advertise XR functionality** to the user.
 1. A [user-activation event](https://html.spec.whatwg.org/multipage/interaction.html#activation) indicates that the user wishes to use XR.
 1. **Request an immersive session** from the device
 1. Use the session to **run a render loop** that updates sensor data, and produces graphical frames to be displayed on the XR device.
 1. Continue **producing frames** until the user indicates that they wish to exit XR mode.
 1. **End the XR session**.

In the following sections, the code examples will demonstrate the core API concepts through this lifecycle sequence using immersive VR sessions first, and then cover the differences in introduced by [inline sessions](#inline-sessions) afterwards. The code examples should be read as all belonging to the same application.

### XR hardware

The UA will identify an available physical unit of XR hardware that can present immersive content to the user. Content is considered to be "immersive" if it produces visual, audio, haptic, or other sensory output that simulates or augments various aspects of the users environment. Most frequently this involves tracking the user's motion in space and producing outputs that are synchronized to the user's movement. On desktop clients this will usually be a headset peripheral; on mobile clients it may represent the mobile device itself in conjunction with a viewer harness (e.g., Google Cardboard/Daydream or Samsung Gear VR). It may also represent devices without stereo-presentation capabilities but with more advanced tracking, such as ARCore/ARKit-compatible devices. Any queries for XR capabilities or functionality are implicitly made against this device.

> **Non-normative Note:** If there are multiple XR devices available, the UA will need to pick which one to expose. The UA is allowed to use any criteria it wishes to select which device is used, including settings UI that allow users to manage device priority. Calling `navigator.xr.isSessionSupported` or `navigator.xr.requestSession` with `'inline'` should **not** trigger device-selection UI, however, as this would cause many sites to display XR-specific dialogs early in the document lifecycle without user activation.

It's possible that even if no XR device is available initially, one may become available while the application is running, or that a previously available device becomes unavailable. This will be most common with PC peripherals that can be connected or disconnected at any time. Pages can listen to the `devicechange` event emitted on `navigator.xr` to respond to changes in device availability after the page loads. (XR devices already available when the page loads will not cause a `devicechange` event to be fired.) `devicechange` fires an event of type `Event`.

```js
navigator.xr.addEventListener('devicechange', checkForXRSupport);
```

### Detecting and advertising XR capabilities

Interacting with an XR device is done through the `XRSession` interface, but before any XR-enabled page requests a session it should first query to determine if the type of XR content desired is supported by the current hardware and UA. If it is, the page can then advertise XR functionality to the user. (For example, by adding a button to the page that the user can click to start XR content.)

The `navigator.xr.isSessionSupported` function is used to check if the device supports the XR capabilities the application needs. It takes an "XR mode" describing the desired functionality and returns a promise which resolves with _true_ if the device can successfully create an `XRSession` using that mode. The call resolves with _false_ otherwise.

Querying for support this way is necessary because it allows the application to detect what XR modes are available prior to requesting an `XRSession`, which may engage the XR device sensors and begin presentation. This can incur significant power or performance overhead on some systems and may have side effects such as taking over the user's screen, launching a status tray or storefront, or terminating another application's access to XR hardware. Calling `navigator.xr.isSessionSupported` must not interfere with any running XR applications on the system or have any user-visible side effects.

There are two XR modes that can be requested:

**Inline**: Requested with the mode enum `'inline'`. Inline sessions do not have the ability to display content on the XR device, but may be allowed to access device tracking information and use it to render content on the page. (This technique, where a scene rendered to the page is responsive to device movement, is sometimes referred to as "Magic Window" mode.) UAs implementing the WebXR Device API must guarantee that inline sessions can be created, regardless of XR device presence, unless blocked by page feature policy.

**Immersive VR**: Requested with the mode enum `'immersive-vr'`. Immersive VR content is presented directly to the XR device (for example: displayed on a VR headset). Immersive VR sessions must be requested within a user activation event or within another callback that has been explicitly indicated to allow immersive session requests.

It should be noted that an immersive VR session may still display the users environment on see-through displays such as a HoloLens. See [Handling non-opaque displays](#handling-non-opaque-displays) for more details.

This document will use the term "immersive session" to refer to immersive VR sessions throughout.

In the following examples we will explain the core API concepts using immersive VR sessions first, and cover the differences introduced by [inline sessions](#inline-sessions) afterwards. With that in mind, this code checks for support of immersive VR sessions, since we want the ability to display content on a device like a headset.

```js
async function checkForXRSupport() {
  // Check to see if there is an XR device available that supports immersive VR
  // presentation (for example: displaying in a headset). If the device has that
  // capability the page will want to add an "Enter VR" button to the page (similar to
  // a "Fullscreen" button) that starts the display of immersive VR content.
  navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    if (supported) {
      var enterXrBtn = document.createElement("button");
      enterXrBtn.innerHTML = "Enter VR";
      enterXrBtn.addEventListener("click", beginXRSession);
      document.body.appendChild(enterXrBtn);
    } else {
      console.log("Immersive VR sessions not supported.");
    }
  });
}
```

### Requesting a Session

After confirming that the desired mode is available with `navigator.xr.isSessionSupported()`, the application will need to request an `XRSession` instance with the `navigator.xr.requestSession()` method in order to interact with XR device's presentation or tracking capabilities.

```js
function beginXRSession() {
  // requestSession must be called within a user gesture event
  // like click or touch when requesting an immersive session.
  navigator.xr.requestSession('immersive-vr')
      .then(onSessionStarted)
      .catch(err => {
        // May fail for a variety of reasons. Probably just want to
        // render the scene normally without any tracking at this point.
        window.requestAnimationFrame(onDrawFrame);
      });
}
```

In this sample, the `beginXRSession` function, which is assumed to be run by clicking the "Enter VR" button in the previous sample, requests an `XRSession` that operates in `immersive-vr` mode. The `requestSession` method returns a promise that resolves to an `XRSession` upon success. In addition to the `XRSessionMode`, developers may supply an `XRSessionInit` dictionary containing the capabilities that the returned session must have. For more information, see [Feature dependencies](#feature-dependencies).

If `isSessionSupported` resolved to _true_ for a given mode, then requesting a session with the same mode should be reasonably expected to succeed, barring external factors (such as `requestSession` not being called in a user activation event for an immersive session.) The UA is ultimately responsible for determining if it can honor the request.

Only one immersive session per XR hardware device is allowed at a time across the entire UA. If an immersive session is requested and the UA already has an active immersive session or a pending request for an immersive session, then the new request must be rejected. All inline sessions are [suspended](#handling-suspended-sessions) when an immersive session is active. Inline sessions are not required to be created within a user activation event unless paired with another option that explicitly does require it. 

Once the session has started, some setup must be done to prepare for rendering.
- An `XRReferenceSpace` should be created to establish a space in which `XRViewerPose` data will be defined. See the [Spatial Tracking Explainer](spatial-tracking-explainer.md) for more information.
- An `XRWebGLLayer` must be created and set as the `XRSession`'s `renderState.baseLayer`. (`baseLayer` because future versions of the spec will likely enable multiple layers.)
- Then `XRSession.requestAnimationFrame` must be called to start the render loop pumping.

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  // Store the session for use later.
  xrSession = session;

  xrSession.requestReferenceSpace('local')
  .then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer) // Create a compatible XRWebGLLayer
  .then(() => {
    // Start the render loop
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

### Setting up an XRWebGLLayer

The content to present to the device is defined by an `XRWebGLLayer`. This is set via the `XRSession`'s `updateRenderState()` function. `updateRenderState()` takes a dictionary containing new values for a variety of options affecting the session's rendering, including `baseLayer`. Only the options specified in the dictionary are updated.

Future extensions to the spec will define new layer types. For example: a new layer type would be added to enable use with any new graphics APIs that get added to the browser. The ability to use multiple layers at once and have them composited by the UA will likely also be added in a future API revision.

In order for a WebGL canvas to be used with an `XRWebGLLayer`, its context must be _compatible_ with the XR device. This can mean different things for different environments. For example, on a desktop computer this may mean the context must be created against the graphics adapter that the XR device is physically plugged into. On most mobile devices though, that's not a concern so the context will always be compatible. In either case, the WebXR application must take steps to ensure WebGL context compatibility before using it with an `XRWebGLLayer`.

When it comes to ensuring canvas compatibility there's two broad categories that apps will fall under.

**XR Enhanced:** The app can take advantage of XR hardware, but it's used as a progressive enhancement rather than a core part of the experience. Most users will probably not interact with the app's XR features, and as such asking them to make XR-centric decisions early in the app lifetime would be confusing and inappropriate. An example would be a news site with an embedded 360 photo gallery or video. (We expect the large majority of early WebXR content to fall into this category.)

This style of application should call `WebGLRenderingContextBase`'s `makeXRCompatible()` method. This will set a compatibility bit on the context that allows it to be used. Contexts without the compatibility bit will fail when attempting to create an `XRWebGLLayer` with them.

```js
let glCanvas = document.createElement("canvas");
let gl = glCanvas.getContext("webgl");
loadSceneGraphics(gl);

function setupWebGLLayer() {
  // Make sure the canvas context we want to use is compatible with the current xr device.
  return gl.makeXRCompatible().then(() => {
    // The content that will be shown on the device is defined by the session's
    // baseLayer.
    xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });
  });
}
```

In the event that a context is not already compatible with the XR device the [context will be lost and attempt to recreate itself](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13) using the compatible graphics adapter. It is the page's responsibility to handle WebGL context loss properly, recreating any necessary WebGL resources in response. If the context loss is not handled by the page, the promise returned by `makeXRCompatible` will fail. The promise may also fail for a variety of other reasons, such as the context being actively used by a different, incompatible XR device.


```js
// Set up context loss handling to allow the context to be properly restored if needed.
glCanvas.addEventListener("webglcontextlost", (event) => {
  // Calling preventDefault signals to the page that you intent to handle context restoration.
  event.preventDefault();
});

glCanvas.addEventListener("webglcontextrestored", () => {
  // Once this function is called the gl context will be restored but any graphics resources
  // that were previously loaded will be lost, so the scene should be reloaded.
  loadSceneGraphics(gl);
});
```

**XR Centric:** The app's primary use case is displaying XR content, and as such it doesn't mind initializing resources in an XR-centric fashion, which may include asking users to select a headset as soon as the app starts. An example would be a game which is dependent on XR presentation and input. These types of applications can avoid the need to call `makeXRCompatible` and the possible context loss that it may trigger by setting the `xrCompatible` flag in the WebGL context creation arguments.

```js
let gl = glCanvas.getContext("webgl", { xrCompatible: true });
loadSceneGraphics(gl);
```

Ensuring context compatibility with an XR device through either method may have side effects on other graphics resources in the page, such as causing the entire user agent to switch from rendering using an integrated GPU to a discrete GPU.

> **Note:** The `XRWebGLLayer` uses a WebGL context created by a Canvas element or `OffscreenCanvas` rather than creating its own to both allow for the same content to be rendered to the XR device and the page, as well as allowing the page to load it's WebGL resources prior to the session being created.

If the system's underlying XR device changes (signaled by the `devicechange` event on the `navigator.xr` object) any previously set context compatibility bits will be cleared, and `makeXRCompatible` will need to be called again prior to using the context with a `XRWebGLLayer`. Any active sessions will also be ended, and as a result new `XRSession`s with corresponding new `XRWebGLLayer`s will need to be created.

### Main render loop

The WebXR Device API provides information about the current frame to be rendered via the `XRFrame` object which developers must examine in each iteration of the render loop. From this object the frame's `XRViewerPose` can be queried, which contains the information about all the views which must be rendered in order for the scene to display correctly on the XR device.

`XRWebGLLayer` objects are not updated automatically. To present new frames, developers must use `XRSession`'s `requestAnimationFrame()` method. When the `requestAnimationFrame()` callback functions are run, they are passed both a timestamp and an `XRFrame`. They will contain fresh rendering data that must be used to draw into the `XRWebGLLayer`s `framebuffer` during the callback.

A new `XRFrame` is created for each batch of `requestAnimationFrame()` callbacks or for certain events that are associated with tracking data. `XRFrame` objects act as snapshots of the state of the XR device and all associated inputs. The state may represent historical data, current sensor readings, or a future projection. Due to it's time-sensitive nature, an `XRFrame` is only valid during the execution of the callback that it is passed into.  Once control is returned to the browser any active `XRFrame` objects are marked as inactive. Calling any method of an inactive `XRFrame` will throw an [`InvalidStateError`](https://heycam.github.io/webidl/#invalidstateerror).

The `XRFrame` also makes a copy of the  `XRSession`'s `renderState`, such as `depthNear/Far` values and the `baseLayer`, just prior to the `requestAnimationFrame()` callbacks in the current batch being called. This captured `renderState` is what will be used when computing view information like projection matrices and when the frame is being composited by the XR hardware. Any subsequent calls the developer makes to `updateRenderState()` will not be applied until the next `XRFrame`'s callbacks are processed.

The timestamp provided is acquired using identical logic to the [processing of `window.requestAnimationFrame()` callbacks](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#run-the-animation-frame-callbacks). This means that the timestamp is a `DOMHighResTimeStamp` set to the current time when the frame's callbacks begin processing. Multiple callbacks in a single frame will receive the same timestamp, even though time has elapsed during the processing of previous callbacks. In the future if additional, XR-specific timing information is identified that the API should provide, it is recommended that it be via the `XRFrame` object.

The `XRWebGLLayer`s framebuffer is created by the UA and behaves similarly to a canvas's default framebuffer. Using `framebufferTexture2D`, `framebufferRenderbuffer`, `getFramebufferAttachmentParameter`, and `getRenderbufferParameter` will all generate an INVALID_OPERATION error. Additionally, outside of an `XRSession`'s `requestAnimationFrame()` callback the framebuffer will be considered incomplete, reporting FRAMEBUFFER_UNSUPPORTED when calling `checkFramebufferStatus`. Attempts to draw to it, clear it, or read from it generate an INVALID_FRAMEBUFFER_OPERATION error as indicated by the WebGL specification.

Once drawn to, the XR device will continue displaying the contents of the `XRWebGLLayer` framebuffer, potentially reprojected to match head motion, regardless of whether or not the page continues processing new frames. Potentially future spec iterations could enable additional types of layers, such as video layers, that could automatically be synchronized to the device's refresh rate.

### Viewer tracking With WebGL

Each `XRFrame` the scene will be drawn from the perspective of a "viewer", which is the user or device viewing the scene, described by an `XRViewerPose`. Developers retrieve the current `XRViewerPose` by calling `getViewerPose()` on the `XRFrame` and providing an `XRReferenceSpace` for the pose to be returned in. Due to the nature of XR tracking systems, this function is not guaranteed to return a value and developers will need to respond appropriately. For more information about what situations will cause `getViewerPose()` to fail and recommended practices for handling the situation, refer to the [Spatial Tracking Explainer](spatial-tracking-explainer.md).

The `XRViewerPose` contains a `views` attribute, which is an array of `XRView`s. Each `XRView` has a `projectionMatrix` and `transform` that should be used when rendering with WebGL. The `XRView` is also passed to an `XRWebGLLayer`'s `getViewport()` method to determine what the WebGL viewport should be set to when rendering. This ensures that the appropriate perspectives of scene are rendered to the correct portion on the `XRWebGLLayer`'s `framebuffer` in order to display correctly on the XR hardware.

```js
function onDrawFrame(timestamp, xrFrame) {
  // Do we have an active session?
  if (xrSession) {
    let glLayer = xrSession.renderState.baseLayer;
    let pose = xrFrame.getViewerPose(xrReferenceSpace);
    if (pose) {
      // Run imaginary 3D engine's simulation to step forward physics, animations, etc.
      scene.updateScene(timestamp, xrFrame);

      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

      for (let view of pose.views) {
        let viewport = glLayer.getViewport(view);
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        drawScene(view);
      }
    }
    // Request the next animation callback
    xrSession.requestAnimationFrame(onDrawFrame);
  } else {
    // No session available, so render a default mono view.
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    drawSceneFromDefaultView();

    // Request the next window callback
    window.requestAnimationFrame(onDrawFrame);
  }
}
```

Each `transform` attribute of each `XRView` is an `XRRigidTransform` consisting of a `position` and `orientation`. (See the [definition of an `XRRigidTransform`](spatial-tracking-explainer.md#rigid-transforms) in the spatial tracking explainer for more details.) These should be treated as the locations of virtuals "cameras" within the scene. If the application is using a library to assist with rendering, it may be most natural to apply these values to a camera object directly, like so:

```js
// Apply the view transform to the camera of a fictional rendering library.
function drawScene(view) {
  camera.setPositionVector(
    view.transform.position.x,
    view.transform.position.y,
    view.transform.position.z,
  );

  camera.setOrientationQuaternion(
    view.transform.orientation.x,
    view.transform.orientation.y,
    view.transform.orientation.z,
    view.transform.orientation.w,
  );

  camera.setProjectionMatrix4x4(
    view.projectionMatrix[0],
    view.projectionMatrix[1],
    //...
    view.projectionMatrix[14],
    view.projectionMatrix[15]
  );
  
  scene.renderWithCamera(camera);
}
```

Or it may be easier to pass the transform in as a view matrix, especially if the application makes WebGL calls directly. In that case the matrix needed will typically be the inverse of the view transform, which can easily be acquired from the `inverse` attribute of the `XRRigidTransform`.

```js
// Get a view matrix and projection matrix appropriate for passing directly to a WebGL shader.
function drawScene(view) {
  viewMatrix = view.transform.inverse.matrix;
  projectionMatrix = view.projectionMatrix;

  // Set uniforms as appropriate for shaders being used

  // Draw Scene
}
```

In both cases the `XRView`'s `projectionMatrix` should be used as-is. Altering it may cause incorrect output to the XR device and significant user discomfort.

Because the `XRViewerPose` inherits from `XRPose` it also contains a `transform` describing the position and orientation of the viewer as a whole relative to the `XRReferenceSpace` origin. This is primarily useful for rendering a visual representation of the viewer for spectator views or multi-user environments.

### Audio Listener Tracking

Each `XRFrame` the `viewerPos. transform.matrix` needs to be modified to fit with the orientation values for the [AudioContext.listener](<https://developer.mozilla.org/en-US/docs/Web/API/AudioListener>) front and up values.
Note that in the `viewer` `xrReferenceSpace`, the position and orientation move along with the headset (and presumably the user's head). This means it has a `native origin` always at the `viewerPos. transform.matrix`, so only the orientation of the audio listener will change in this ` xrReferenceSpace`.
It's also important to clarify that there's no such thing as the listener position. The scene can have multiple coexisting coordinate systems. In this example, you're getting the viewer pose in a specific xrReferenceSpace, and using the pose transform matrix to update the AudioListener with position and orientation in that reference space's coordinate system. The unstated assumption is that the audio sources will also use coordinates in that same reference space's coordinate system, and if that's the case you'll get a consistent experience.
It would be perfectly valid (if a bit odd) to do everything in viewer space, keeping the AudioListener at the viewer space origin with fixed forward along -z and up along +y in that space, and then ensure that the coordinates for audio sources are in this same viewer space, relative to the current head position and orientation.

Here is an example of how to connect the `viewerPos. transform.matrix` to the `AudioContext.listener`:

```js
// initialize the audio context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function onDrawFrame(timestamp, xrFrame) {
  // Do we have an active session?
  if (xrSession) {
    let listener = audioCtx.listener;

    let pose = xrFrame.getViewerPose(xrReferenceSpace);
    if (pose) {
      // Run imaginary 3D engine's simulation to step forward physics, PannerNodes, etc.
      scene.updateScene(timestamp, xrFrame);

      // Set the audio listener to face where the XR view is facing
      /// The pose.matrix top left 3x3 elements provide unit column vectors in base space for the posed coordinate system's x/y/z axis directions,
      /// so we use the negative of the third column directly as a forward vector corresponding to the -z direction.
      // The given pose.transform.orientation is a quaternion and not a forward vector, so is not used with web audio
      const m = pose.transform.matrix;
      // Set forward facing position
      [ listener.forwardX.value, listener.forwardY.value, listener.forwardZ.value ] = [-m[8], -m[9], -m[10]];
      // set the horizontal position of the top of the listener's head
      [ listener.upX.value, listener.upY.value, listener.upZ.value ] = [ m[4], m[5], m[6] ];
      // Set the audio listener to travel with the WebXR user position
      // Note that pose.transform.position does equal [m[12], m[13], m[14]]
      [ listener.positionX.value, listener.positionY.value, listener.positionZ.value ] = [m[12], m[13], m[14]];

    }
    // Request the next animation callback
    xrSession.requestAnimationFrame(onDrawFrame);
  }
}
```

### Handling session visibility

The UA may temporarily hide a session at any time. While hidden a session has restricted access to the XR device state and frames will not be processed. Hidden sessions can be reasonably be expected to be made visible again at some point, usually when the user has finished performing whatever action triggered the session to hide in the first place. This is not guaranteed, however, so applications should not rely on it.

The UA may hide a session if allowing the page to continue reading the headset position represents a security or privacy risk (like when the user is entering a password or URL with a virtual keyboard, in which case the head motion may infer the user's input), or if content external to the UA is obscuring the page's output.

In other situations the UA may also choose to keep the session content visible but "blurred", indicating that the session content is still visible but no longer in the foreground. While blurred the page may either refresh the XR device at a slower rate or not at all, poses queried from the device may be less accurate, and all input tracking will be unavailable. If the user is wearing a headset the UA is expected to present a tracked environment (a scene which remains responsive to user's head motion) or reproject the throttled content when the page is being throttled to prevent user discomfort.

The session should continue requesting and drawing frames while blurred, but should not depend on them being processed at the normal XR hardware device framerate. The UA may use these frames as part of it's tracked environment or page composition, though the exact presentation of frames produced by a blurred session will differ between platforms. They may be partially occluded, literally blurred, greyed out, or otherwise de-emphasized.

Some applications may wish to respond to the session being hidden or blurred by halting game logic, purposefully obscuring content, or pausing media. To do so, the application should listen for the `visibilitychange` events from the `XRSession`. For example, a 360 media player would do this to pause the video/audio whenever the UA has obscured it.

```js
xrSession.addEventListener('visibilitychange', xrSessionEvent => {
  switch (xrSessionEvent.session.visibilityState) {
    case 'visible':
      resumeMedia();
      break;
    case 'visible-blurred':
      pauseMedia();
      // Allow the render loop to keep running, but just keep rendering the last
      // frame. Render loop may not run at full framerate.
      break;
    case 'hidden':
      pauseMedia();
      break;
  }
});
```

### Ending the XR session

A `XRSession` is "ended" when it is no longer expected to be used. An ended session object becomes detached and all operations on the object will fail. Ended sessions cannot be restored, and if a new active session is needed it must be requested from `navigator.xr.requestSession()`.

To manually end a session the application calls `XRSession`'s `end()` method. This returns a promise that, when resolved, indicates that presentation to the XR hardware device by that session has stopped. Once the session has ended any continued animation the application requires should be done using `window.requestAnimationFrame()`.

```js
function endXRSession() {
  // Do we have an active session?
  if (xrSession) {
    // End the XR session now.
    xrSession.end().then(onSessionEnd);
  }
}

// Restore the page to normal after an immersive session has ended.
function onSessionEnd() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  xrSession = null;

  // Ending the session stops executing callbacks passed to the XRSession's
  // requestAnimationFrame(). To continue rendering, use the window's
  // requestAnimationFrame() function.
  window.requestAnimationFrame(onDrawFrame);
}
```

The UA may end a session at any time for a variety of reasons. For example: The user may forcibly end presentation via a gesture to the UA, other native applications may take exclusive access of the XR hardware device, or the XR hardware device may become disconnected from the system. Additionally, if the system's underlying XR device changes (signaled by the `devicechange` event on the `navigator.xr` object) any active `XRSession`s will be ended. This applies to both immersive and inline sessions. Well behaved applications should monitor the `end` event on the `XRSession` to detect when the UA forces the session to end.

```js
xrSession.addEventListener('end', onSessionEnd);
```

If the UA needs to halt use of a session temporarily, the session should be suspended instead of ended. (See previous section.)

## Inline sessions

When authoring content to be viewed immersively, it may be beneficial to use an `inline` session to view the same content in a 2D browser window. Using an inline session enables content to use a single rendering path for both inline and immersive presentation modes. It also makes switching between inline content and immersive presentation of that content easier.

A `XRWebGLLayer` created with an `inline` session will not allocate a new WebGL framebuffer but instead set the `framebuffer` attribute to `null`. That way when `framebuffer` is bound all WebGL commands will naturally execute against the WebGL context's default framebuffer and display on the page like any other WebGL content. When that layer is set as the `XRRenderState`'s `baseLayer` the inline session is able to render it's output to the page.

```js
function beginInlineXRSession() {
  // Request an inline session in order to render to the page.
  navigator.xr.requestSession('inline')
      .then((session) => {
        // Inline sessions must have an appropriately constructed WebGL layer
        // set as the baseLayer prior to rendering. (This code assumes the WebGL
        // context has already been made XR compatible.)
        let glLayer = new XRWebGLLayer(session, gl);
        session.updateRenderState({ baseLayer: glLayer });
        onSessionStarted(session);
      })
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

Immersive and inline sessions may run their render loops at at different rates. During immersive sessions the UA runs the rendering loop at the XR device's native refresh rate. During inline sessions the UA runs the rendering loop at the refresh rate of page (aligned with `window.requestAnimationFrame`.) The method of computation of `XRView` projection and view matrices also differs between immersive and inline sessions, with inline sessions taking into account the output canvas dimensions and possibly the position of the users head in relation to the canvas if that can be determined.

`navigator.xr.isSessionSupported()` will always resolve to `true` when checking the support of `"inline"` sessions.  The UA should not reject requests for an inline session unless the page's feature policy prevents it or unless a required feature is unavailable as described in [Feature dependencies](#feature-dependencies)). For example, the following use cases all depend on additional reference space types which would need to be enabled via the `XRSessionInit`:
 - Using phone rotation to view panoramic content.
 - Taking advantage of 6DoF tracking on devices with no associated headset, like [ARCore](https://developers.google.com/ar/) or [ARKit](https://developer.apple.com/arkit/) enabled phones. (Note that this does not provide automatic camera access or composition)
 - Making use of head-tracking features for devices like [zSpace](http://zspace.com/) systems.

## Advanced functionality

Beyond the core APIs described above, the WebXR Device API also exposes several options for taking greater advantage of the XR hardware's capabilities.

### Feature dependencies
Once developers have mastered session creation and rendering, they will often be interested in using additional WebXR features that may not be universally available. While developers are generally encouraged to design for progressive enhancement, some experiences may have requirements on features that are not guaranteed to be universally available. For example, an experience which requires users to move around a large physical space, such as a guided tour, would not function on an Oculus Go because it is unable to provide an [`unbounded` reference space](spatial-tracking-explainer.md#unbounded-reference-space). If an experience is completely unusable without a specific feature, it would be a poor user experience to initialize the underlying XR platform and create a session only to immediately notify the user it won't work.

Features may be unavailable for a number of reasons, among which is the fact not all devices which support WebXR can support the full set of features. Another consideration is that some features expose [sensitive information](privacy-security-explainer.md#sensitive-information) which may require a clear signal of [user intent](privacy-security-explainer.md#user-intent) before functioning. Any feature which requires this signal to be provided via [explicit consent](privacy-security-explainer.md#explicit-consent) must request this consent prior to the session being created. This ensures a consistent experience across all hardware form-factors, regardless of whether the UA has a [trusted immersive UI](privacy-security-explainer.md#trusted-immersive-ui) available.

WebXR allows the following features to be requested:
* `local`
* `local-floor`
* `bounded-floor`
* `unbounded`

This list is currently limited to a subset of reference space types, but in the future will expand to include additional features. Some potential future features under discussion that would be candidates for this list are: eye tracking, plane detection, geo alignment, etc.

Developers communicate their feature requirements by categorizing them into one of the following sequences in the `XRSessionInit` that can be passed into `xr.requestSession()`:
* **`requiredFeatures`** This feature must be available in order for the experience to function at all. If [explicit consent](privacy-security-explainer.md#explicit-consent) is necessary, users will be prompted in response to `xr.requestSession()`. Session creation will be rejected if the feature is unavailable for the XR device, if the UA determines the user does not wish the feature enabled, or if the UA does not recognize the feature being requested. 
* **`optionalFeatures`** The experience would like to use this feature for the entire session, but can function without it. Again, if [explicit consent](privacy-security-explainer.md#explicit-consent) is necessary, users will be prompted in response to `xr.requestSession()`. However, session creation will succeed regardless of the feature's hardware support or user intent. Developers must not assume optional features are available in the session and check the result from attempting to use them.

(NOTE: `xr.isSessionSupported()` does not accept an `XRSessionInit` parameter and supplying one will have no effect)

The following sample code represents the likely behavior of a warehouse-size experience. It depends on having an [`unbounded` reference space](spatial-tracking-explainer.md#unbounded-reference-space) and will reject creating the session if not available.

```js
function onEnterXRClick() {
  navigator.xr.requestSession('immersive-vr', {
    requiredFeatures: [ 'unbounded' ]
  })
  .then(onSessionStarted)
  .catch(() => {
    // Display message to the user explaining that the experience could not
    // be started.
  });
}
```

The following sample code shows an inline experience that would prefer to use motion tracking if available, but will fall back to using touch/mouse input if not.

```js
navigator.xr.requestSession('inline', {
  optionalFeatures: [ 'local' ]
})
.then(onSessionStarted);

function onSessionStarted(session) {
  session.requestReferenceSpace('local')
  .then(onLocalReferenceSpaceCreated)
  .catch(() => {
    session.requestReferenceSpace('viewer').then(onViewerReferenceSpaceCreated);
  });
}
```

Some features recognized by the UA but not explicitly listed in these arrays will be enabled by default for a session. This is only done if the feature does not require a signal of [user intent](privacy-security-explainer.md#user-intent) nor impact performance or the behavior of other features when enabled. At this time, only the following features will be enabled by default:

| Feature | Circumstances |
| ------ | ------- |
| `viewer` | Requested `XRSessionMode` is `inline` or`immersive-vr`|
| `local` | Requested `XRSessionMode` is `immersive-vr`|

### Controlling rendering quality Through WebGL

While in immersive sessions, the UA is responsible for providing a framebuffer that is correctly optimized for presentation to the `XRSession` in each `XRFrame`. Developers can optionally request the framebuffer size be scaled, though the UA may not respect the request. Even when the UA honors the scaling requests, the result is not guaranteed to be the exact percentage requested.

Framebuffer scaling is done by specifying a `framebufferScaleFactor` at `XRWebGLLayer` creation time. Each XR device has a default framebuffer size, which corresponds to a `framebufferScaleFactor` of `1.0`. This default size is determined by the UA and should represent a reasonable balance between rendering quality and performance. It may not be the 'native' size for the device (that is, a buffer which would match the native screen resolution 1:1 at point of highest magnification). For example, mobile platforms such as GearVR or Daydream frequently suggest using lower resolutions than their screens are capable of to ensure consistent performance.

If the `framebufferScaleFactor` is set to a number higher or lower than `1.0` the UA should create a framebuffer that is the default resolution multiplied by the given scale factor. So a `framebufferScaleFactor` of `0.5` would specify a framebuffer with 50% the default height and width, and so on. The UA may clamp the scale factor however it sees fit, or may round it to a desired increment if needed (for example, fitting the buffer dimensions to powers of two if that is known to increase performance.)

```js
function setupWebGLLayer() {
  return gl.makeXRCompatible().then(() => {
    // Create a WebGL layer with a slightly lower than default resolution.
    let glLayer = new XRWebGLLayer(xrSession, gl, { framebufferScaleFactor: 0.8 });
    xrSession.updateRenderState({ baseLayer: glLayer });
  });
```

In some cases the developer may want to ensure that their application is rendering at the 'native' size for the device. To do this the developer can query the scale factor that should be passed during layer creation with the `XRWebGLLayer.getNativeFramebufferScaleFactor()` function. (Note that in some cases the native scale may actually be less than the recommended scale of `1.0` if the system is configured to render "superscaled" by default.)

```js
function setupNativeScaleWebGLLayer() {
  return gl.makeXRCompatible().then(() => {
    // Create a WebGL layer that matches the device's native resolution.
    let nativeScaleFactor = XRWebGLLayer.getNativeFramebufferScaleFactor(xrSession);
    let glLayer = new XRWebGLLayer(xrSession, gl, { framebufferScaleFactor: nativeScaleFactor });
    xrSession.updateRenderState({ baseLayer: glLayer });
  });
```

This technique should be used carefully, since the native resolution on some headsets may be higher than the system is capable of rendering at a stable framerate without use of additional techniques such as foveated rendering. Also note that the UA's scale clamping is allowed to prevent the allocation of native resolution framebuffers if it deems it necessary to maintain acceptable performance.

Framebuffer scaling is typically configured once per session, but can be changed during a session by creating a new `XRWebGLLayer` and updating the render state to apply that on the next frame:

```js
function rescaleWebGLLayer(scale) {
    let glLayer = new XRWebGLLayer(xrSession, gl, { framebufferScaleFactor: scale });
    xrSession.updateRenderState({ baseLayer: glLayer });
  });
```

Rescaling the framebuffer may involve reallocating render buffers and should only be done rarely, for example when transitioning from a game mode to a text-heavy menu mode or similar. See [Dynamic viewport scaling](#dynamic-viewport-scaling) for an alternative if your application needs more frequent adjustments.

### Dynamic viewport scaling

Dynamic viewport scaling allows applications to only use a subset of the available framebuffer. This is intended for fine-grained performance tuning where the desired render resolution changes frequently, and can be adjusted on a frame-by-frame basis. A typical use case would be rendering scenes with highly variable complexity, for example where the user may move their viewpoint to closely examine a model with a complex shader. (If an application wanted to keep this constant for a session, it should use `framebufferScaleFactor` instead, see [Controlling rendering quality](#controlling-rendering-quality).)

This is an opt-in feature for applications, it is activated by calling `requestViewportScale(scale)` on an `XRView`, followed by a call to `getViewport()` which applies the change and returns the updated viewport:

```js
for (let view of pose.views) {
  view.requestViewportScale(scale);
  let viewport = glLayer.getViewport(view);
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
  drawScene(view);
}
```

NOTE: Dynamic viewport scaling is a recent addition to WebXR, and implementations may not provide the API yet. For compatibility, consider adding a `if (view.requestViewportScale)` check to ensure that the API exists.

The feature may not be available on all systems since it depends on driver support. If it is unsupported, the system will ignore the requested scale and continue using the full-sized viewport. If necessary, the application can compare the sizes returned by `getViewport()` across animation frames to confirm if the feature is active, for example if it would want to use an alternate performance tuning method such as reducing scene complexity as a fallback.

For consistency, the `getViewport()` result for any given view is always fixed for the duration of an animation frame. If `requestViewportScale()` is used before the first `getViewport()` call, the change applies immediately for the current animation frame. Otherwise, the change is deferred until `getViewport()` is called again in a future animation frame.

User agents can optionally provide a `recommendedViewportScale` attribute on an `XRView` with a suggested value based on internal performance heuristics. This attribute is null if the user agent doesn't provide a recommendation. A `requestViewportScale(null)` call has no effect, so applications could use the following code to apply the heuristic only if it exists:

```js
  view.requestViewportScale(view.recommendedViewportScale);
```

Alternatively, applications could modify the recommended scale, i.e. clamping it to a minimum scale to avoid text becoming unreadable, or use their own heuristic based on data such as current visible scene complexity and recent framerate average.

### Controlling depth precision

The projection matrices given by the `XRView`s take into account not only the field of view of presentation medium but also the depth range for the scene, defined as a near and far plane. WebGL fragments rendered closer than the near plane or further than the far plane are discarded. By default the near plane is 0.1 meters away from the user's viewpoint and the far plane is 1000 meters away.

Some scenes may benefit from changing that range to better fit the scene's content. For example, if all of the visible content in a scene is expected to remain within 100 meters of the user's viewpoint, and all content is expected to appear at least 1 meter away, reducing the range of the near and far plane to `[1, 100]` will lead to more accurate depth precision. This reduces the occurrence of z fighting (or aliasing), an artifact which manifests as a flickery, shifting pattern when closely overlapping surfaces are rendered. Conversely, if the visible scene extends for long distances you'd want to set the far plane far enough away to cover the entire visible range to prevent clipping, with the tradeoff being that further draw distances increase the occurrence of z fighting artifacts. The best practice is to always set the near and far planes to as tight of a range as your content will allow.

To adjust the near and far plane distance, `depthNear` and `depthFar` values can be given in meters when calling `updateRenderState()`.

```js
// This reduces the depth range of the scene to [1, 100] meters.
// The change will take effect on the next XRSession requestAnimationFrame callback.
xrSession.updateRenderState({
  depthNear: 1.0,
  depthFar: 100.0,
});
```

### Preventing the compositor from using the depth buffer

By default the depth attachment of an `XRWebGLLayer`'s `framebuffer`, if present, may be used to assist the XR compositor. For example, the scene's depth values may be used by advanced reprojection techniques or to help avoid depth conflicts when rendering platform/UA interfaces. This assumes, of course, that the values in the depth buffer are representative of the scene content.

Some applications may violate that assumption, such as when using certain deferred rendering techniques or rendering stereo video. In those cases if the depth buffer's values are used by the compositor it may result in objectionable artifacts. To avoid this, the compositor can be instructed to ignore the depth values of an `XRWebGLLayer` by setting the `ignoreDepthValues` option to `true` at layer creation time:

```js
let webglLayer = new XRWebGLLayer(xrSession, gl, { ignoreDepthValues: true });
```

If `ignoreDepthValues` is not set to `true` the The UA is allowed (but not required) to use depth buffer as it sees fit. As a result, barring compositor access to the depth buffer in this way may lead to certain platform or UA features being unavailable or less robust. To detect if the depth buffer is being used by the compositor, check the `ignoreDepthValues` attribute of the `XRWebGLLayer` after the layer is created. A value of `true` indicates that the depth buffer will not be utilized by the compositor even if `ignoreDepthValues` was set to `false` during layer creation.

### Changing the Field of View for inline sessions

Whenever possible the matrices given by `XRView`'s `projectionMatrix` attribute should make use of physical properties, such as the headset optics or camera lens, to determine the field of view to use. Most inline content, however, won't have any physically based values from which to infer a field of view. In order to provide a unified render pipeline for inline content an arbitrary field of view must be selected.

By default a vertical field of view of 0.5π radians (90 degrees) is used for inline sessions. The horizontal field of view can be computed from the vertical field of view based on the width/height ratio of the `XRWebGLLayer`'s associated canvas.

If a different default field of view is desired, it can be specified by passing a new `inlineVerticalFieldOfView` value, in radians, to the `updateRenderState` method:

```js
// This changes the default vertical field of view for an inline session to
// 0.4 pi radians (72 degrees).
xrSession.updateRenderState({
  inlineVerticalFieldOfView: 0.4 * Math.PI,
});
```

The UA is allowed to clamp the value, and if a physically-based field of view is available it must always be used in favor of the default value.

Attempting to set a `inlineVerticalFieldOfView` value on an immersive session will cause `updateRenderState()` to throw an `InvalidStateError`. `XRRenderState.inlineVerticalFieldOfView` must return `null` on immersive sessions.

## Appendix A: I don’t understand why this is a new API. Why can’t we use…

### `DeviceOrientation` Events
The data provided by an `XRViewerPose` instance is similar to the data provided by the non-standard `DeviceOrientationEvent`, with some key differences:

* It’s an explicit polling interface, which ensures that new input is available for each frame. The event-driven `DeviceOrientation` data may skip a frame, or may deliver two updates in a single frame, which can lead to disruptive, jittery motion in an XR application.
* `DeviceOrientation` events do not provide positional data, which is a key feature of high-end XR hardware.
* More can be assumed about the intended use case of XR device data, so optimizations such as motion prediction can be applied.
* `DeviceOrientation` events are typically not available on desktops.

It should be noted that `DeviceOrientation` events have not been standardized, have behavioral differences between browser, and there are ongoing efforts to change or remove the API. This makes it difficult for developers to rely on for a use case where accurate tracking is necessary to prevent user discomfort.

The `DeviceOrientation` events specification is superceded by [Orientation Sensor](https://w3c.github.io/orientation-sensor/) specification that defines the [`RelativeOrientationSensor`](https://w3c.github.io/orientation-sensor/#relativeorientationsensor) and [`AbsoluteOrientationSensor`](https://w3c.github.io/orientation-sensor/#absoluteorientationsensor) interfaces. This next generation API is purpose-built for WebXR Device API polyfill. It represents orientation data in WebGL-compatible formats (quaternion, rotation matrix), satisfies stricter latency requirements, and addresses known interoperability issues that plagued `DeviceOrientation` events by explicitly defining which [low-level motion sensors](https://w3c.github.io/motion-sensors/#fusion-sensors) are used in obtaining the orientation data.

### WebSockets
A local [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) service could be set up to relay headset poses to the browser. Some early VR experiments with the browser tried this route, and some tracking devices (most notably [Leap Motion](https://www.leapmotion.com/)) have built their JavaScript SDKs around this concept. Unfortunately, this has proven to be a high-latency route. A key element of a good XR experience is low latency. For head mounted displays, ideally, the movement of your head should result in an update on the device (referred to as “motion-to-photons time”) in 20ms or less. The browser’s rendering pipeline already makes hitting this goal difficult, and adding more overhead for communication over WebSockets only exaggerates the problem. Additionally, using such a method requires users to install a separate service, likely as a native app, on their machine, eroding away much of the benefit of having access to the hardware via the browser. It also falls down on mobile where there’s no clear way for users to install such a service.

### The Gamepad API
Some people have suggested that we try to expose XR data through the [Gamepad API](https://w3c.github.io/gamepad/), which seems like it should provide enough flexibility through an unbounded number of potential axes. While it would be technically possible, there are a few properties of the API that currently make it poorly suited for this use.

* Axes are normalized to always report data in a `[-1, 1]` range. That may work sufficiently for orientation reporting, but when reporting position or acceleration, you would have to choose an arbitrary mapping of the normalized range to a physical one (i.e., `1.0` is equal to 2 meters or similar). However that forces developers to make assumptions about the capabilities of future XR hardware, and the mapping makes for error-prone and unintuitive interpretation of the data.
* Axes are not explicitly associated with any given input, making it difficult for users to remember if axis `0` is a component of devices’ position, orientation, acceleration, etc.
* XR device capabilities can differ significantly, and the Gamepad API currently doesn’t provide a way to communicate a device’s features and its optical properties.
* Gamepad features such as buttons have no clear meaning when describing an XR headset and its periphery.

There is a related effort to expose motion-sensing controllers through the Gamepad API by adding a `pose` attribute and some other related properties. Although these additions would make the API more accommodating for headsets, we feel that it’s best for developers to have a separation of concerns such that devices exposed by the Gamepad API can be reasonably assumed to be gamepad-like and devices exposed by the WebXR Device API can be reasonably assumed to be headset-like.

### These alternatives don’t account for presentation
It’s important to realize that all of the alternative solutions offer no method of displaying imagery on the headset itself, with the exception of Cardboard-like devices where you can simply render a fullscreen split view. Even so, that doesn’t take into account how to communicate the projection or distortion necessary for an accurate image. Without a reliable presentation method the ability to query inputs from a headset becomes far less valuable.

### What's the deal with WebVR?

There's understandably some confusion between the WebXR and an API that some browsers have implemented at various points in the past called WebVR. Both handle communication with Virtual Reality hardware, and both have very similar names. So what's the difference between these two APIs?

**WebVR** was an API developed in the earliest days of the current generation of Virtual Reality hardware/software, starting around the time that the Oculus DK2 was announced. Native VR APIs were still in their formative stages, and the capabilities of commercial devices were still being determined. As such the WebVR API developed around some assumptions that would not hold true long term. For example, the API assumed that applications would always need to render a single left and right eye view of the scene, that the separation between eyes would only ever involve translation and not rotation, and that only one cannonical tracking space was necessary to support. In addition, the API design made forward compatibility with newer device types, like mobile AR, difficult, to the point that it may have necessitated a separate API. WebVR also made some questionable descisions regarding integration with the rest of the web platform, specifically in terms of how it interacted with WebGL and the Gamepad API. Despite this, it worked well enough in the short term that some UAs, especially those shipped specifically for VR devices, decided to ship the API to their users.

In the meantime the group that developed WebVR recognized the issues with the initial API, in part through feedback from developers and standards bodies, and worked towards resolving them. Eventually they recognized that in order to create a more scalable and more ergonomic API they would have to break backwards compatibility with WebVR. This new revision of the API was referred to as WebVR 2.0 for a while, but eventually was officially renamed **WebXR** in recognition of the fact that the new API would support both VR and AR content. Developement of WebXR has been able to benefit not only from the group's experience with WebVR but also from a more mature landscape of immersive computing devices that now includes multiple commercial headsets, the emergence of both mobile and headset AR, and multiple mature native APIs.

WebXR is intended to completely replace WebVR in the coming years. All browsers that initially shipped WebVR have committed to shipping WebXR in it's place once the API design is finished. In the meanwhile, developers can code against WebXR, relying on the [WebXR Polyfill](https://github.com/immersive-web/webxr-polyfill) to ensure their code runs in browsers with only WebVR implementations.

## Appendix B: Proposed IDL

```webidl
//
// Navigator
//

partial interface Navigator {
  readonly attribute XR xr;
};

dictionary XRSessionInit {
  sequence<DOMString> requiredFeatures;
  sequence<DOMString> optionalFeatures;
}

[SecureContext, Exposed=Window] interface XR : EventTarget {
  attribute EventHandler ondevicechange;
  Promise<boolean> isSessionSupported(XRSessionMode mode);
  Promise<XRSession> requestSession(XRSessionMode mode, optional XRSessionInit);
};

//
// Session
//

enum XRSessionMode {
  "inline",
  "immersive-vr"
}

[SecureContext, Exposed=Window] interface XRSession : EventTarget {
  readonly attribute XRRenderState renderState;

  attribute EventHandler onblur;
  attribute EventHandler onfocus;
  attribute EventHandler onend;

  void updateRenderState(optional XRRenderStateInit state);

  long requestAnimationFrame(XRFrameRequestCallback callback);
  void cancelAnimationFrame(long handle);

  Promise<void> end();
};

// Timestamp is passed as part of the callback to make the signature compatible
// with the window's FrameRequestCallback.
callback XRFrameRequestCallback = void (DOMHighResTimeStamp time, XRFrame frame);

dictionary XRRenderStateInit {
  double depthNear;
  double depthFar;
  double inlineVerticalFieldOfView;
  XRWebGLLayer? baseLayer;
};

[SecureContext, Exposed=Window] interface XRRenderState {
  readonly attribute double depthNear;
  readonly attribute double depthFar;
  readonly attribute double? inlineVerticalFieldOfView;
  readonly attribute XRWebGLLayer? baseLayer;
};

//
// Frame, Device Pose, and Views
//

[SecureContext, Exposed=Window] interface XRFrame {
  readonly attribute XRSession session;

  XRViewerPose? getViewerPose(XRReferenceSpace referenceSpace);
};

enum XREye {
  "none",
  "left",
  "right"
};

[SecureContext, Exposed=Window] interface XRView {
  readonly attribute XREye eye;
  readonly attribute Float32Array projectionMatrix;
  readonly attribute XRRigidTransform transform;
};

[SecureContext, Exposed=Window] interface XRViewerPose : XRPose {
  readonly attribute FrozenArray<XRView> views;
};

[SecureContext, Exposed=Window] interface XRViewport {
  readonly attribute long x;
  readonly attribute long y;
  readonly attribute long width;
  readonly attribute long height;
};

//
// Layers
//

dictionary XRWebGLLayerInit {
  boolean antialias = true;
  boolean depth = true;
  boolean stencil = false;
  boolean alpha = true;
  boolean ignoreDepthValues = false;
  double framebufferScaleFactor = 1.0;
};

typedef (WebGLRenderingContext or
         WebGL2RenderingContext) XRWebGLRenderingContext;

[SecureContext, Exposed=Window,
 Constructor(XRSession session,
             XRWebGLRenderingContext context,
             optional XRWebGLLayerInit layerInit)]
interface XRWebGLLayer {
  readonly attribute boolean antialias;
  readonly attribute boolean ignoreDepthValues;

  readonly attribute unsigned long framebufferWidth;
  readonly attribute unsigned long framebufferHeight;
  readonly attribute WebGLFramebuffer framebuffer;

  XRViewport? getViewport(XRView view);

  static double getNativeFramebufferScaleFactor(XRSession session);
};

//
// Events
//

[SecureContext, Exposed=Window, Constructor(DOMString type, XRSessionEventInit eventInitDict)]
interface XRSessionEvent : Event {
  readonly attribute XRSession session;
};

dictionary XRSessionEventInit : EventInit {
  required XRSession session;
};

//
// WebGL
//
partial dictionary WebGLContextAttributes {
    boolean xrCompatible = false;
};

partial interface WebGLRenderingContextBase {
    [NewObject] Promise<void> makeXRCompatible();
};
```
