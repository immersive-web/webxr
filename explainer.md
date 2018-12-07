# WebXR Device API Explained

## What is WebXR?
The [WebXR Device API](https://immersive-web.github.io/webxr/) provides access to input and output capabilities commonly associated with Virtual Reality (VR) and Augmented Reality (AR) hardware like [Google’s Daydream](https://vr.google.com/daydream/), the [Oculus Rift](https://www3.oculus.com/rift/), the [Samsung Gear VR](http://www.samsung.com/global/galaxy/gear-vr/), the [HTC Vive](https://www.htcvive.com/), and [Windows Mixed Reality headsets](https://developer.microsoft.com/en-us/windows/mixed-reality). More simply put, it lets you create Virtual Reality and Augmented Reality web sites that you can view with the appropriate hardware like a VR headset or AR-enabled phone.

### Ooh, so like _Johnny Mnemonic_ where the Internet is all ’90s CGI?
Nope, not even slightly. And why do you even want that? That’s a terrible UX.

WebXR, at least initially, is aimed at letting you create VR/AR experiences that are embedded in the web that we know and love today. It’s explicitly not about creating a browser that you use completely in VR (although it could work well in an environment like that).

### What's the X in XR mean?

There's a lot of "_____ Reality" buzzwords flying around today. Virtual Reality, Augmented Reality, Mixed Reality... it can be hard to keep track, even though there's a lot of similarities between them. This API aims to provide foundational elements with which to do all of the above. And since we don't want to be limited to just one facet of VR or AR (or anything in between) we use "X" not as part of an acronym but as an algebraic variable of sorts to indicate "Your Reality Here". We've also heard it called "Extended Reality" and "Cross Reality", which seem fine too, but really the X is whatever you want it to be!

### Is this API affiliated with OpenXR?

Khronos' upcoming [OpenXR API](https://www.khronos.org/openxr) does cover the same basic capabilities as the WebXR Device API for native applications. As such it may seem like WebXR and OpenXR have a relationship like WebGL and OpenGL, where the web API is a near 1:1 mapping of the native API. This is **not** the case with WebXR and OpenXR, as they are distinct APIs being developed by different standards bodies.

That said, given the shared subject matter many of the same concepts are represented by both APIs in different ways and we do expect that once OpenXR becomes publically available it will be reasonable to implement WebXR's feature set using OpenXR as one of multiple possible native backends.

### Goals
Enable XR applications on the web by allowing pages to do the following:

* Detect if XR capabilities are available.
* Query the XR devices capabilities.
* Poll the XR device and associated input device state.
* Display imagery on the XR device at the appropriate frame rate.

### Non-goals

* Define how a Virtual Reality or Augmented Reality browser would work.
* Expose every feature of every piece of VR/AR hardware.
* Build “[The Metaverse](https://en.wikipedia.org/wiki/Metaverse).”

## Use cases
Given the marketing of early XR hardware to gamers, one may naturally assume that this API will primarily be used for development of games. While that’s certainly something we expect to see given the history of the WebGL API, which is tightly related, we’ll probably see far more “long tail”-style content than large-scale games. Broadly, XR content on the web will likely cover areas that do not cleanly fit into the app-store models being used as the primary distribution methods by all the major VR/AR hardware providers, or where the content itself is not permitted by the store guidelines. Some high level examples are:

### Video
360° and 3D video are areas of immense interest (for example, see [ABC’s 360° video coverage](http://abcnews.go.com/US/fullpage/abc-news-vr-virtual-reality-news-stories-33768357)), and the web has proven massively effective at distributing video in the past. An XR-enabled video player would, upon detecting the presence of XR hardware, show a “View in VR” button, similar to the “Fullscreen” buttons present in today’s video players. When the user clicks that button, a video would render in the headset and respond to natural head movement. Traditional 2D video could also be presented in the headset as though the user is sitting in front of a theater-sized screen, providing a more immersive experience.

### Object/data visualization
Sites can provide easy 3D visualizations through WebXR, often as a progressive improvement to their more traditional rendering. Viewing 3D models (e.g., [SketchFab](https://sketchfab.com/)), architectural previsualizations, medical imaging, mapping, and [basic data visualization](http://graphics.wsj.com/3d-nasdaq/) can all be more impactful, easier to understand, and convey an accurate sense of scale in VR and AR. For those use cases, few users would justify installing a native app, especially when web content is simply a link or a click away.

Home shopping applications (e.g., [Matterport](https://matterport.com/try/)) serve as particularly effective demonstrations of this. Depending on device capabilities, sites can scale all the way from a simple photo carousel to an interactive 3D model on screen to viewing the walkthrough in VR, giving users the impression of actually being present in the house. The ability for this to be a low-friction experience for users is a huge asset for both users and developers, since they don’t need to convince users to install a heavy (and possibly malicious) executable before hand.

### Artistic experiences
VR provides an interesting canvas for artists looking to explore the possibilities of a new medium. Shorter, abstract, and highly experimental experiences are often poor fits for an app-store model, where the perceived overhead of downloading and installing a native executable may be disproportionate to the content delivered. The web’s transient nature makes these types of applications more appealing, since they provide a frictionless way of viewing the experience. Artists can also more easily attract people to the content and target the widest range of devices and platforms with a single code base.

## Lifetime of a VR web app

The basic steps most WebXR applications will go through are:

 1. Query to see if the desired XR mode is supported.
 1. If support is available, application advertises XR functionality to the user.
 1. Request an immersive XR session from the device in response to a [user-activation event](https://html.spec.whatwg.org/multipage/interaction.html#activation).
 1. Use the session to run a render loop that produces graphical frames to be displayed on the XR device.
 1. Continue producing frames until the user indicates that they wish to exit XR mode.
 1. End the XR session.

### XR hardware

The UA will identify an available physical unit of XR hardware that can present imagery to the user, referred to here as an "XR device". On desktop clients this will usually be a headset peripheral; on mobile clients it may represent the mobile device itself in conjunction with a viewer harness (e.g., Google Cardboard/Daydream or Samsung Gear VR). It may also represent devices without stereo-presentation capabilities but with more advanced tracking, such as ARCore/ARKit-compatible devices. Any queries for XR capabilities or functionality are implicitly made against this device.

> **Non-normative Note:** If there are multiple XR devices available, the UA will need to pick which one to expose. The UA is allowed to use any criteria it wishes to select which device is used, including settings UI that allows users to manage device priority. Calling `navigator.xr.supportsSessionMode` or `navigator.xr.requestSession` with `{ mode: 'inline' }` should **not** trigger device-selection UI, however, as this would cause many sites to display XR-specific dialogs early in the document lifecycle without user activation.

It's possible that even if no XR device is available initially, one may become available while the application is running, or that a previously available device becomes unavailable. This will be most common with PC peripherals that can be connected or disconnected at any time. Pages can listen to the `devicechange` event emitted on `navigator.xr` to respond to changes in device availability after the page loads. (XR devices already available when the page loads will not cause a `devicechange` event to be fired.) `devicechange` fires an event of type `Event`.

```js
navigator.xr.addEventListener('devicechange', checkForXRSupport);
```

### Detecting and advertising XR capabilities

Interacting with an XR device is done through the `XRSession` interface, but before any XR-enabled page requests a session it should first query to determine if the type of XR content desired is supported by the current hardware and UA. If it is, the page can then advertise XR functionality to the user. (For example, by adding a button to the page that the user can click to start XR content.)

The `navigator.xr.supportsSessionMode` function is used to check if the device supports the XR capabilities the application needs. It takes an "XR mode" describing the desired functionality and returns a promise which resolves if the device can successfully create an `XRSession` using that mode. The call rejects otherwise.

Querying for support this way is necessary because it allows the application to detect what XR modes are available prior to requesting an `XRSession`, which may engage the XR device sensors and begin presentation. This can incur significant power or performance overhead on some systems and may have side effects such as taking over the user's screen, launching a status tray or storefront, or terminating another application's access to XR hardware. Calling `navigator.xr.supportsSessionMode` must not interfere with any running XR applications on the system or have any user-visible side effects.

There are three XR modes that can be requested:

**Inline**: The default mode when requesting a session, but can be explicitly specified with the `'inline'` enum value. Inline sessions do not have the ability to display content on the XR device, but may be allowed to access device tracking information and use it to render content on the page. (This technique, where a scene rendered to the page is responsive to device movement, is sometimes referred to as "Magic Window" mode.) UAs implementing the WebXR Device API must guarantee that inline sessions can be created, regardless of XR device presence, unless blocked by page feature policy.

**Immersive VR**: Requested with the mode enum `'immersive-vr'`. Immersive VR content is presented directly to the XR device (for example: displayed on a VR headset). Immersive VR sessions must be requested within a user activation event or within another callback that has been explicitly indicated to allow immersive session requests.

It should be noted that an immersive VR session may still display the users environment like an immersive AR session, especially on transparent displays. See [Handling non-opaque displays](#handling-non-opaque-displays) for more details.

**Immersive AR**: Requested with the mode enum `'immersive-ar'`. Immersive AR content functions largely the same as immersive VR content, with the primary difference being that it guarantees that the users environment will be visible and aligned with the rendered content. This may be achieved with see-through displays, like HoloLens or Magic Leap, or video passthrough systems like ARCore and ARKit. Additionally, access to environmental data (such as hit testing) may be permitted. Like immersive VR, immersive AR sessions must be requested within a user activation event or another callback that has been explicitly indicated to allow immersive session requests.

This document will use the term "immersive session" to refer to either an immersive VR or and immersive AR session throughout.

In the following examples we will explain the core API concepts using immersive VR sessions first, and cover the differences introduced by [immersive AR sessions](#ar-sessions) and [inline sessions](#inline-sessions) afterwards. With that in mind, this code checks for supports of immersive VR content, since we want the ability to display imagery on a device like a headset.

```js
async function checkForXRSupport() {
  // Check to see if there is an XR device available that supports immersive VR
  // presentation (for example: displaying in a headset). If the device has that
  // capability the page will want to add an "Enter VR" button to the page (similar to
  // a "Fullscreen" button) that starts the display of immersive VR content.
  navigator.xr.supportsSessionMode('immersive-vr').then(() => {
    var enterXrBtn = document.createElement("button");
    enterXrBtn.innerHTML = "Enter VR";
    enterXrBtn.addEventListener("click", beginXRSession);
    document.body.appendChild(enterXrBtn);
  }).catch((reason) => {
    console.log("Session not supported: " + reason);
  });
}
```

### Requesting a Session

After confirming that the desired mode is available with `navigator.xr.supportsSessionMode()`, the application will need to request an `XRSession` instance with the `navigator.xr.requestSession()` method in order to interact with XR device's presentation or tracking capabilities.

```js
function beginXRSession() {
  // requestSession must be called within a user gesture event
  // like click or touch when requesting an immersive session.
  navigator.xr.requestSession({mode: 'immersive-vr'})
      .then(onSessionStarted)
      .catch(err => {
        // May fail for a variety of reasons. Probably just want to
        // render the scene normally without any tracking at this point.
        window.requestAnimationFrame(onDrawFrame);
      });
}
```

In this sample, the `beginXRSession` function, which is assumed to be run by clicking the "Enter VR" button in the previous sample, requests an `XRSession` that operates in `immersive-vr` mode. The `requestSession` method returns a promise that resolves to an `XRSession` upon success. When requesting a session, the capabilities that the returned session must have, including it's XR mode, are passed in via an `XRSessionCreationOptions` dictionary.

If `supportsSessionMode` resolved for a given mode, then requesting a session with the same mode should be reasonably expected to succeed, barring external factors (such as `requestSession` not being called in a user activation event for an immersive session.) The UA is ultimately responsible for determining if it can honor the request.

Only one immersive session per XR hardware device is allowed at a time across the entire UA. All inline sessions are suspended when an immersive session is active. Inline sessions are not required to be created within a user activation event unless paired with another option that explicitly does require it.

Once the session has started, some setup must be done to prepare for rendering.
- An `XRReferenceSpace` should be created to establish a space in which `XRViewerPose` data will be defined. See the [Spatial Tracking Explainer](spatial-tracking-explainer.md) for more information.
- An `XRLayer` must be created and set as the `XRSession`'s `renderState.baseLayer`. (`baseLayer` because future versions of the spec will likely enable multiple layers, at which point this would act like the `firstChild` attribute of a DOM element.)
- Then `XRSession.requestAnimationFrame` must be called to start the render loop pumping.

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  // Store the session for use later.
  xrSession = session;

  xrSession.requestReferenceSpace({ type:'stationary', subtype:'eye-level' })
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

### Setting up an XRLayer

The content to present to the device is defined by an `XRLayer`. In the initial version of the spec only one layer type, `XRWebGLLayer`, is defined and only one layer can be used at a time. This is set via the `XRSession`'s `updateRenderState()` function. `updateRenderState()` takes a dictionary containing new values for a variety of options affecting the session's rendering, including `baseLayer`. Only the options specified in the dictionary are updated, and a promise is returned that resolves when the new values take effect.

Future iterations of the spec will define new types of `XRLayer`s. For example: a new layer type would be added to enable use with any new graphics APIs that get added to the browser. The ability to use multiple layers at once and have them composited by the UA will likely also be added in a future API revision.

In order for a WebGL canvas to be used with an `XRWebGLLayer`, its context must be _compatible_ with the XR device. This can mean different things for different environments. For example, on a desktop computer this may mean the context must be created against the graphics adapter that the XR device is physically plugged into. On most mobile devices though, that's not a concern and so the context will always be compatible. In either case, the WebXR application must take steps to ensure WebGL context compatibility before using it with an `XRWebGLLayer`.

When it comes to ensuring canvas compatibility there's two broad categories that apps will fall under.

**XR Enhanced:** The app can take advantage of XR hardware, but it's used as a progressive enhancement rather than a core part of the experience. Most users will probably not interact with the app's XR features, and as such asking them to make XR-centric decisions early in the app lifetime would be confusing and inappropriate. An example would be a news site with an embedded 360 photo gallery or video. (We expect the large majority of early WebXR content to fall into this category.)

This style of application should call `WebGLRenderingContextBase`'s `makeXRCompatible()` method. This will set a compatibility bit on the context that allows it to be used. Contexts without the compatibility bit will fail when attempting to create an `XRLayer` with them. In the event that a context is not already compatible with the XR device the [context will be lost and attempt to recreate itself](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13) using the compatible graphics adapter. It is the page's responsibility to handle WebGL context loss properly, recreating any necessary WebGL resources in response. If the context loss is not handled by the page, the promise returned by `makeXRCompatible` will fail. The promise may also fail for a variety of other reasons, such as the context being actively used by a different, incompatible XR device.

```js
let glCanvas = document.createElement("canvas");
let gl = glCanvas.getContext("webgl");

function setupWebGLLayer() {
  // Make sure the canvas context we want to use is compatible with the current xr device.
  return gl.makeXRCompatible().then(() => {
    // The content that will be shown on the device is defined by the session's
    // baseLayer.
    return xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });
  });
}
```

**XR Centric:** The app's primary use case is displaying XR content, and as such it doesn't mind initializing resources in an XR-centric fashion, which may include asking users to select a headset as soon as the app starts. An example would be a game which is dependent on XR presentation and input. These types of applications can avoid the need to call `makeXRCompatible` and the possible context loss that it may trigger by passing the XR device that the context will be used with as a context creation argument.

```js
let gl = glCanvas.getContext("webgl", { xrCompatible: true });
```

Ensuring context compatibility with an XR device through either method may have side effects on other graphics resources in the page, such as causing the entire user agent to switch from rendering using an integrated GPU to a discrete GPU.

If the system's underlying XR device changes (signaled by the `devicechange` event on the `navigator.xr` object) any previously set context compatibility bits will be cleared, and `makeXRCompatible` will need to be called again prior to using the context with a `XRWebGLLayer`. Any active sessions will also be ended, and as a result new `XRSession`s with corresponding new `XRWebGLLayer`s will need to be created as well.

### Main render loop

The WebXR Device API provides information about the current frame to be rendered via the `XRFrame` object which developers must examine each iteration of the render loop. From this object the frame's `XRViewerPose` can be queried, which contains the information about all the views which must be rendered in order for the scene to display correctly on the XR device.

`XRWebGLLayer` objects are not updated automatically. To present new frames, developers must use `XRSession`'s `requestAnimationFrame()` method. When the `requestAnimationFrame()` callback functions are run, they are passed both a timestamp and an `XRFrame`, which will contain fresh rendering data that must be used to draw into the `XRWebGLLayer`s `framebuffer` during the callback.

A new `XRFrame` is created for each batch of `requestAnimationFrame()` callbacks or for certain events that are associated with tracking data. `XRFrame` objects act as snapshots of the state of the XR device and all associated inputs. The state may represent historical data, current sensor readings, or a future projection. Due to it's time-sensitive nature, an `XRFrame` is only valid during the execution of the callback that it is passed into, and once control is returned to the browser any active `XRFrame` objects are marked as inactive. Calling any method of an inactive `XRFrame` will throw an [`InvalidStateError`](https://heycam.github.io/webidl/#invalidstateerror).

The `XRFrame` also makes a copy of the  `XRSession`'s `renderState`, such as `depthNear/Far` values and the `baseLayer`, at the time the first `requestAnimationFrame()` call in the current batch was made. This captured `renderState` is what will be used when computing view information like projection matrices and when the frame is being composited by the XR hardware. Any subsequent calls the developer makes to `updateRenderState()` will not be applied until the the next `XRFrame` is created.

The timestamp provided is acquired using identical logic to the [processing of `window.requestAnimationFrame()` callbacks](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#run-the-animation-frame-callbacks). This means that the timestamp is a `DOMHighResTimeStamp` set to the current time when the frame's callbacks begin processing. Multiple callbacks in a single frame will receive the same timestamp, even though time has elapsed during the processing of previous callbacks. In the future if additional, XR-specific timing information is identified that the API should provide it is recommended that it be via the `XRFrame` object.

The `XRWebGLLayer`s framebuffer is created by the UA and behaves similarly to a canvas's default framebuffer. Using `framebufferTexture2D`, `framebufferRenderbuffer`, `getFramebufferAttachmentParameter`, and `getRenderbufferParameter` will all generate an INVALID_OPERATION error. Additionally, outside of an `XRSession`'s `requestAnimationFrame()` callback the framebuffer will be considered incomplete, reporting FRAMEBUFFER_UNSUPPORTED when calling `checkFramebufferStatus`. Attempts to draw to it, clear it, or read from to generate an INVALID_FRAMEBUFFER_OPERATION error as indicated by the WebGL specification.

Once drawn to, the XR device will continue displaying the contents of the `XRWebGLLayer` framebuffer, potentially reprojected to match head motion, regardless of whether or not the page continues processing new frames. Potentially future spec iterations could enable additional types of layers, such as video layers, that could automatically be synchronized to the device's refresh rate.

### Viewer tracking

Each `XRFrame` the scene will be drawn from the perspective of a "viewer", which is the user or device viewing the scene, described by an `XRViewerPose`. Developers retrieve the current `XRViewerPose` by calling `getViewerPose()` on the `XRFrame` and providing an `XRReferenceSpace` for the pose to be returned in. Due to the nature of XR tracking systems, this function is not guaranteed to return a value and developers will need to respond appropriately.  For more information about what situations will cause `getViewerPose()` to fail and recommended practices for handling the situation, refer to the [Spatial Tracking Explainer](spatial-tracking-explainer.md).

The `XRViewerPose` contains a `views` attribute, which is an array of `XRView`s. Each `XRView` has a `viewMatrix` and a `projectionMatrix` that should be used when rendering with WebGL. The `XRView` is also passed to an `XRWebGLLayer`'s `getViewport()` method to determine what the WebGL viewport should be set to when rendering. This ensures that the appropriate perspectives of scene are rendered to the correct portion on the `XRWebGLLayer`'s `framebuffer` in order to display correctly on the XR hardware.

```js
function onDrawFrame(timestamp, xrFrame) {
  // Do we have an active session?
  if (xrSession) {
    let glLayer = xrSession.renderState.baseLayer;
    let pose = xrFrame.getViewerPose(xrReferenceSpace);
    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

    for (let view of pose.views) {
      let viewport = glLayer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      drawScene(view);
    }

    // Request the next animation callback
    xrSession.requestAnimationFrame(onDrawFrame);
  } else {
    // No session available, so render a default mono view.
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    drawScene();

    // Request the next window callback
    window.requestAnimationFrame(onDrawFrame);
  }
}

function drawScene(view) {
  let viewMatrix = null;
  let projectionMatrix = null;
  if (view) {
    viewMatrix = view.viewMatrix;
    projectionMatrix = view.projectionMatrix;
  } else {
    viewMatrix = defaultViewMatrix;
    projectionMatrix = defaultProjectionMatrix;
  }

  // Set uniforms as appropriate for shaders being used

  // Draw Scene
}
```

The `XRViewerPose` also contains a `transform`, which is an `XRRigidTransform` describing the position and orientation of the viewer as a whole relative to the `XRReferenceSpace` origin. This is primarily useful for rendering a visual representation of the viewer for spectator views or multi-user environments. Each `XRView` has a `transform` as well that can be used in lieu of the `viewMatrix` to position virtual cameras in the scene if the rendering library being used prefers.

An `XRRigidTransform` contains a `position` vector and `orientation` quaternion. When interpreting an `XRRigidTransform` the `orientation` is applied prior to the `position`. This means that, for example, a transform that indicates a quarter rotation to the right and a 1 meter translation along -Z would place a transformed object at `[0, 0, -1]` facing to the right. `XRRigidTransform`s also have a `matrix` attribute that reports the same transform as a 4x4 matrix when needed.

### Handling suspended sessions

The UA may temporarily "suspend" a session at any time. While suspended a session has restricted or throttled access to the XR device state and may process frames slowly or not at all. Suspended sessions can be reasonably be expected to be resumed at some point, usually when the user has finished performing whatever action triggered the suspension in the first place.

The UA may suspend a session if allowing the page to continue reading the headset position represents a security or privacy risk (like when the user is entering a password or URL with a virtual keyboard, in which case the head motion may infer the user's input), or if other content is obscuring the page's output.

While suspended the page may either refresh the XR device at a slower rate or not at all, and poses queried from the device may be less accurate. If the user is wearing a headset the UA is expected to present a tracked environment (a scene which remains responsive to user's head motion) when the page is being throttled to prevent user discomfort.

The application should continue requesting and drawing frames while suspended, but should not depend on them being processed at the normal XR hardware device framerate. The UA may use these frames as part of it's tracked environment or page composition, though they may be partially occluded, blurred, or otherwise manipulated. Additionally, poses queried while the session is suspended may not accurately reflect the XR hardware device's physical pose.

Some applications may wish to respond to session suspension by halting game logic, purposefully obscuring content, or pausing media. To do so, the application should listen for the `blur` and `focus` events from the `XRSession`. For example, a 360 media player would do this to pause the video/audio whenever the UA has obscured it.

```js
xrSession.addEventListener('blur', xrSessionEvent => {
  pauseMedia();
  // Allow the render loop to keep running, but just keep rendering the last frame.
  // Render loop may not run at full framerate.
});

xrSession.addEventListener('focus', xrSessionEvent => {
  resumeMedia();
});
```

### Ending the XR session

A `XRSession` is "ended" when it is no longer expected to be used. An ended session object becomes detached and all operations on the object will fail. Ended sessions cannot be restored, and if a new active session is needed it must be requested from `navigator.xr.requestSession()`.

To manually end a session the application calls `XRSession`'s `end()` method. This returns a promise that, when resolved, indicates that presentation to the XR hardware device by that session has stopped. Once the session has ended any continued animation the application's requires should be done using `window.requestAnimationFrame()`.

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

If the UA needs to halt use of a session temporarily the session should be suspended instead of ended. (See previous section.)

## AR sessions

If an XR-enabled page wants to display Augmented Reality content instead of Virtual Reality, it can create an AR session by passing `{mode: 'immersive-ar'}` into `requestSession`. 

```js
function beginXRSession() {
  // requestSession must be called within a user gesture event
  // like click or touch when requesting an immersive session.
  navigator.xr.requestSession({mode: 'immersive-ar'})
      .then(onSessionStarted);
}
```

This provides a session that behaves much like the immersive VR sessions described above with a few key behavioral differences. The primary distinction between an "immersive-vr" and "immersive-ar" session is that the latter guarantees that the user's environment is visible and that rendered content will be aligned to the environment. The exact nature of the visibility is hardware-dependent, and communicated by the `XRSession`'s `environmentBlendMode` attribute. AR sessions will never report an `environmentBlendMode` of `opaque`. See [Handling non-opaque displays](#handling-non-opaque-displays) for more details.

UAs must reject the request for an AR session if the XR hardware device cannot support a mode where the user's environment is visible. Pages should be designed to robustly handle the inability to acquire AR sessions. `navigator.xr.supportsSessionMode()` can be used if a page wants to test for AR session support before attempting to create the `XRSession`.

```js
function checkARSupport() {
  // Check to see if the UA can support an AR sessions.
  return navigator.xr.supportsSessionMode('immersive-ar')
      .then(() => { console.log("AR content is supported!"); })
      .catch((reason) => { console.log("AR content is not supported: " + reason); });
}
```

The UA may choose to present the immersive AR session's content via any type of display, including dedicated XR hardware (for devices like HoloLens or Magic Leap) or 2D screens (for APIs like [ARKit](https://developer.apple.com/arkit/) and [ARCore](https://developers.google.com/ar/)). In all cases the session takes exclusive control of the display, hiding the rest of the page if necessary. On a phone screen, for example, this would mean that the session's content should be displayed in a mode that is distinct from standard page viewing, similar to the transition that happens when invoking the `requestFullscreen` API. The UA must also provide a way of exiting that mode and returning to the normal view of the page, at which point the immersive AR session must end.

## Rendering to the Page

There are a couple of scenarios in which developers may want to present content rendered with the WebXR Device API on the page instead of (or in addition to) a headset: Mirroring and inline rendering. Both methods display WebXR content on the page via a Canvas element with an `XRPresentationContext`. Like a `WebGLRenderingContext`, developers acquire an `XRPresentationContext` by calling the `HTMLCanvasElement` or `OffscreenCanvas` `getContext()` method with the context id of "xrpresent". The returned `XRPresentationContext` is permenantly bound to the canvas.

A `XRPresentationContext` can only be supplied imagery by an `XRSession`, though the exact behavior depends on the scenario in which it's being used.

### Mirroring

On desktop devices, or any device which has an external display connected to it, it's frequently desirable to show what the user in the headset is seeing on the external display. This is usually referred to as mirroring.

In order to mirror WebXR content to the page, developers provide an `XRPresentationContext` as the `outputContext` in the `XRSessionCreationOptions` of an immersive session. Once the session has started any content displayed on the headset will then be mirrored into the canvas associated with the `outputContext`. The `outputContext` remains bound to the session until the session has ended, and cannot be used with multiple `XRSession`s simultaneously.

When mirroring only one eye's content will be shown, and it should be shown without any distortion to correct for headset optics. The UA may choose to crop the image shown, display it at a lower resolution than originally rendered, and the mirror may be multiple frames behind the image shown in the headset. The mirror may include or exclude elements added by the underlying XR system (such as visualizations of room boundaries) at the UA's discretion. Pages should not rely on a particular timing or presentation of mirrored content, it's really just for the benefit of bystanders or demo operators.

The UA may also choose to ignore the `outputCanvas` on systems where mirroring is inappropriate, such as devices without an external display to mirror to like mobile or all-in-one systems.

```js
function beginXRSession() {
  let mirrorCanvas = document.createElement('canvas');
  let mirrorCtx = mirrorCanvas.getContext('xrpresent');
  document.body.appendChild(mirrorCanvas);

  navigator.xr.requestSession({ mode: 'immersive-vr', outputContext: mirrorCtx })
      .then(onSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

### Inline sessions

There are several scenarios where it's beneficial to render a scene whose view is controlled by device tracking within a 2D page. For example:

 - Using phone rotation to view panoramic content.
 - Taking advantage of 6DoF tracking on devices (like [Tango](https://get.google.com/tango/) phones) with no associated headset.
 - Making use of head-tracking features for devices like [zSpace](http://zspace.com/) systems.

These scenarios can make use of inline sessions to render tracked content to the page. Using an inline session also enables content to use a single rendering path for both inline and immersive presentation modes and makes switching between inline content and immersive presentation of that content easier.

The [`RelativeOrientationSensor`](https://w3c.github.io/orientation-sensor/#relativeorientationsensor) and [`AbsoluteOrientationSensor`](https://w3c.github.io/orientation-sensor/#absoluteorientationsensor) interfaces (see [Motion Sensors Explainer](https://w3c.github.io/motion-sensors/)) can be used to polyfill the first case.

Similar to mirroring, to make use of this mode an `XRPresentationContext` is provided as the `outputContext` at session creation time with an inline session. At that point content rendered to the `XRRenderState`'s `baseLayer` will be rendered to the canvas associated with the `outputContext`. The UA is also allowed to composite in additional content if desired. In the future, if multiple `XRLayers` are used their composited result will be what is displayed in the `outputContext`. Requests to create an inline session without an output context will be rejected.

Immersive and inline sessions can use the same render loop, but there are some differences in behavior to be aware of. The sessions may run their render loops at at different rates. During immersive sessions the UA runs the rendering loop at the XR device's native refresh rate. During inline sessions the UA runs the rendering loop at the refresh rate of page (aligned with `window.requestAnimationFrame`.) The method of computation of `XRView` projection and view matrices also differs between immersive and inline sessions, with inline sessions taking into account the output canvas dimensions and possibly the position of the users head in relation to the canvas if that can be determined.

Most instances of inline sessions will only provide a single `XRView` to be rendered, but UA may request multiple views be rendered if, for example, it's detected that that output medium of the page supports stereo rendering. As a result pages should always draw every `XRView` provided by the `XRFrame` regardless of what type of session has been requested.

UAs may have different restrictions on inline sessions that don't apply to immersive sessions. For instance, the UA does not have to guarantee the availability of tracking data to inline sessions, and even when it does a different set of `XRReferenceSpace` types may be available to inline sessions versus immersive sessions.

```js
let inlineCanvas = document.createElement('canvas');
let inlineCtx = inlineCanvas.getContext('xrpresent');
document.body.appendChild(inlineCanvas);

function beginInlineXRSession() {
  // Request an inline session in order to render to the page.
  navigator.xr.requestSession({ outputContext: inlineCtx })
      .then(OnSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

The UA should not reject requests for an inline session unless the page's feature policy prevents it. `navigator.xr.supportsSessionMode()` can still be used if a page wants to test if inline session are allowed.

```js
function checkInlineSupport() {
  // Check to see if the page is allowed to request inline sessions.
  return navigator.xr.supportsSessionMode('inline')
      .then(() => { console.log("Inline content is supported!"); })
      .catch((reason) => { console.log("Inline content is blocked: " + reason); });
}
```

## Advanced functionality

Beyond the core APIs described above, the WebXR Device API also exposes several options for taking greater advantage of the XR hardware's capabilities.

### Controlling rendering quality

While in immersive sessions, the UA is responsible for providing a framebuffer that is correctly optimized for presentation to the `XRSession` in each `XRFrame`. Developers can optionally request either the buffer size or viewport size be scaled, though the UA may not respect the request. Even when the UA honors the scaling requests, the result is not guaranteed to be the exact percentage requested.

The first scaling mechanism is done by specifying a `framebufferScaleFactor` at `XRWebGLLayer` creation time. Each XR device has a default framebuffer size, which corresponds to a `framebufferScaleFactor` of `1.0`. This default size is determined by the UA and should represent a reasonable balance between rendering quality and performance. It may not be the 'native' size for the device (that is, a buffer which would match the native screen resolution 1:1 at point of highest magnification). For example, mobile platforms such as GearVR or Daydream frequently suggest using lower resolutions than their screens are capable of to ensure consistent performance.

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

This technique should be used carefully, since the native resolution on some headsets may be higher than the system is capable of rendering at a stable framerate without use of additional techniques such as foveated rendering. Also note that the UA's scale clamping is allowed to prevent the allocation of native resoltion framebuffers if it deems it necessary to maintain acceptable performance.

The second scaling mechanism is to request a scaled viewport into the `XRWebGLLayer`'s `framebuffer`. For example, under times of heavy load the developer may choose to temporarily render fewer pixels. To do so, developers should call `XRWebGLLayer.requestViewportScaling()` and supply a value between 0.0 and 1.0. The UA may then respond by changing the `XRWebGLLayer`'s `framebuffer` and/or the `XRViewport` values in future XR frames. It is worth noting that the UA may change the viewports for reasons other than developer request, and that not all UAs will respect requested viewport changes; as such, developers must always query the viewport values on each XR frame.

```js
function onDrawFrame() {
  // Draw the current frame

  // In response to a performance dip, request the viewport be restricted
  // to a percentage (ex: 50%) of the layer's actual buffer. This change
  // will apply to subsequent rendering frames
  layer.requestViewportScaling(0.5);

  // Register for next frame callback
  xrSession.requestAnimationFrame(onDrawFrame);
}
```

### Controlling depth precision

The projection matrices given by the `XRView`s take into account not only the field of view of presentation medium but also the depth range for the scene, defined as a near and far plane. WebGL fragments rendered closer than the near plane or further than the far plane are discarded. By default the near plane is 0.1 meters away from the user's viewpoint and the far plane is 1000 meters away.

Some scenes may benefit from changing that range to better fit the scene's content. For example, if all of the visible content in a scene is expected to remain within 100 meters of the user's viewpoint, and all content is expected to appear at least 1 meter away, reducing the range of the near and far plane to `[1, 100]` will lead to more accurate depth precision. This reduces the occurrence of z fighting, an artifact which manifests as a flickery, shifting pattern when closely overlapping surfaces are rendered. Conversely, if the visible scene extends for long distances you'd want to set the far plane far enough away to cover the entire visible range to prevent clipping, with the tradeoff being that further draw distances increase the occurrence of z fighting artifacts. The best practice is to always set the near and far planes to as tight of a range as your content will allow.

To adjust the near and far plane distance, `depthNear` and `depthFar` values can be given in meters when calling `updateRenderState()`.

```js
// This reduces the depth range of the scene to [1, 100] meters.
// The change will take effect on the next XRSession requestAnimationFrame callback.
xrSession.updateRenderState({
  depthNear: 1.0,
  depthFar: 100.0,
});
```

### Handling non-opaque displays

Some devices which support the WebXR Device API may use displays that are not fully opaque, or otherwise show your surrounding environment in some capacity. To determine how the display will blend rendered content with the real world, check the `XRSession`'s `environmentBlendMode` attribute. It may currently be one of three values, and more may be added in the future if new display technology necessitates it:

  - `opaque`: The environment is not visible at all through this display. Transparent pixels in the `baseLayer` will appear black. This is the expected mode for most VR headsets. Alpha values will be ignored, with the compositor treating all alpha values as 1.0.
  - `additive`: The environment is visible through the display and pixels in the `baseLayer` will be shown additively against it. Black pixels will appear fully transparent, and there is typically no way to make a pixel fully opaque. Alpha values will be ignored, with the compositor treating all alpha values as 1.0. This is the expected mode for devices like HoloLens or Magic Leap.
  - `alpha-blend`: The environment is visible through the display and pixels in the `baseLayer` will be blended with it according to the alpha value of the pixel. Pixels with an alpha value of 1.0 will be fully opaque and pixels with an alpha value of 0.0 will be fully transparent. This is the expected mode for devices which use passthrough video to show the environment such as ARCore or ARKit enabled phones, as well as headsets that utilize passthrough video for AR like the Vive Pro.

When rendering content it's important to know how the content will appear on the display, as that may affect the techniques you use to render. For example, on an `additive` display is used that can only render additive light. This means that the color black appears as fully transparent and expensive graphical effects like shadows may not show up at all. Similarly, if the developer knows that the environment will be visible they may choose to not render an opaque background.

```js
function drawScene() {
  renderer.enableShadows(xrSession.environmentBlendMode != 'additive');

  // Only draw a background for the scene if the environment is not visible.
  if (xrSession.environmentBlendMode == 'opaque') {
    renderer.drawSkybox();
  }

  // Draw the reset of the scene.
}
```

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
A local [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) service could be set up to relay headset poses to the browser. Some early VR experiments with the browser tried this route, and some tracking devices (most notably [Leap Motion](https://www.leapmotion.com/)) have built their JavaScript SDKs around this concept. Unfortunately, this has proven to be a high-latency route. A key element of a good XR experience is low latency. For head mounted displays, ideally, the movement of your head should result in an update on the device (referred to as “motion-to-photons time”) in 20ms or fewer. The browser’s rendering pipeline already makes hitting this goal difficult, and adding additional overhead for communication over WebSockets only exaggerates the problem. Additionally, using such a method requires users to install a separate service, likely as a native app, on their machine, eroding away much of the benefit of having access to the hardware via the browser. It also falls down on mobile where there’s no clear way for users to install such a service.

### The Gamepad API
Some people have suggested that we try to expose XR data through the [Gamepad API](https://w3c.github.io/gamepad/), which seems like it should provide enough flexibility through an unbounded number of potential axes. While it would be technically possible, there are a few properties of the API that currently make it poorly suited for this use.

* Axes are normalized to always report data in a `[-1, 1]` range. That may work sufficiently for orientation reporting, but when reporting position or acceleration, you would have to choose an arbitrary mapping of the normalized range to a physical one (i.e., `1.0` is equal to 2 meters or similar). But that forces developers to make assumptions about the capabilities of future XR hardware, and the mapping makes for error-prone and unintuitive interpretation of the data.
* Axes are not explicitly associated with any given input, making it difficult for users to remember if axis `0` is a component of devices’ position, orientation, acceleration, etc.
* XR device capabilities can differ significantly, and the Gamepad API currently doesn’t provide a way to communicate a device’s features and its optical properties.
* Gamepad features such as buttons have no clear meaning when describing an XR headset and its periphery.

There is a related effort to expose motion-sensing controllers through the Gamepad API by adding a `pose` attribute and some other related properties. Although these additions would make the API more accommodating for headsets, we feel that it’s best for developers to have a separation of concerns such that devices exposed by the Gamepad API can be reasonably assumed to be gamepad-like and devices exposed by the WebXR Device API can be reasonably assumed to be headset-like.

### These alternatives don’t account for presentation
It’s important to realize that all of the alternative solutions offer no method of displaying imagery on the headset itself, with the exception of Cardboard-like devices where you can simply render a fullscreen split view. Even so, that doesn’t take into account how to communicate the projection or distortion necessary for an accurate image. Without a reliable presentation method the ability to query inputs from a headset becomes far less valuable.

## Appendix B: Proposed IDL

```webidl
//
// Navigator
//

partial interface Navigator {
  readonly attribute XR xr;
};

[SecureContext, Exposed=Window] interface XR : EventTarget {
  attribute EventHandler ondevicechange;
  Promise<void> supportsSessionMode(XRSessionMode mode);
  Promise<XRSession> requestSession(optional XRSessionCreationOptions parameters);
};

//
// Session
//

enum XRSessionMode {
  "inline",
  "immersive-vr",
  "immersive-ar"
}

dictionary XRSessionCreationOptions {
  XRSessionMode mode = "inline";
  XRPresentationContext outputContext;
};

[SecureContext, Exposed=Window] interface XRSession : EventTarget {
  readonly attribute XRSessionMode mode;
  readonly attribute XRPresentationContext outputContext;
  readonly attribute XREnvironmentBlendMode environmentBlendMode;
  readonly attribute XRRenderState renderState;

  attribute EventHandler onblur;
  attribute EventHandler onfocus;
  attribute EventHandler onend;

  Promise<void> updateRenderState(XRRenderStateInit state);

  long requestAnimationFrame(XRFrameRequestCallback callback);
  void cancelAnimationFrame(long handle);

  Promise<void> end();
};

// Timestamp is passed as part of the callback to make the signature compatible
// with the window's FrameRequestCallback.
callback XRFrameRequestCallback = void (DOMHighResTimeStamp time, XRFrame frame);

enum XREnvironmentBlendMode {
  "opaque",
  "additive",
  "alpha-blend",
};

dictionary XRRenderStateOptions {
  double depthNear;
  double depthFar;
  XRLayer baseLayer;
};

[SecureContext, Exposed=Window] interface XRRenderState {
  readonly attribute double depthNear;
  readonly attribute double depthFar;
  readonly attribute XRLayer baseLayer;
};

//
// Frame, Device Pose, and Views
//

[SecureContext, Exposed=Window] interface XRFrame {
  readonly attribute XRSession session;

  // Also listed in the spatial-tracking-explainer.md
  XRViewerPose? getViewerPose(optional XRReferenceSpace referenceSpace);
  XRInputPose? getInputPose(XRInputSource inputSource, optional XRReferenceSpace referenceSpace);
};

enum XREye {
  "left",
  "right"
};

[SecureContext, Exposed=Window,
 Constructor(optional DOMPointInit position, optional DOMPointInit orientation)]
interface XRRigidTransform {
  readonly attribute DOMPointReadOnly position;
  readonly attribute DOMPointReadOnly orientation;
  readonly attribute Float32Array matrix;
};

[SecureContext, Exposed=Window] interface XRView {
  readonly attribute XREye eye;
  readonly attribute Float32Array projectionMatrix;
  readonly attribute Float32Array viewMatrix;
  readonly attribute XRRigidTransform transform;
};

[SecureContext, Exposed=Window] interface XRViewerPose {
  readonly attribute XRRigidTransform transform;
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

[SecureContext, Exposed=Window] interface XRLayer {};

dictionary XRWebGLLayerInit {
  boolean antialias = true;
  boolean depth = true;
  boolean stencil = false;
  boolean alpha = true;
  double framebufferScaleFactor = 1.0;
};

typedef (WebGLRenderingContext or
         WebGL2RenderingContext) XRWebGLRenderingContext;

[SecureContext, Exposed=Window,
 Constructor(XRSession session,
             XRWebGLRenderingContext context,
             optional XRWebGLLayerInit layerInit)]
interface XRWebGLLayer : XRLayer {
  readonly attribute XRWebGLRenderingContext context;
  readonly attribute boolean antialias;
  readonly attribute boolean depth;
  readonly attribute boolean stencil;
  readonly attribute boolean alpha;

  readonly attribute unsigned long framebufferWidth;
  readonly attribute unsigned long framebufferHeight;
  readonly attribute WebGLFramebuffer framebuffer;

  XRViewport? getViewport(XRView view);
  Promise<void> requestViewportScaling(double viewportScaleFactor);

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
    Promise<void> makeXRCompatible();
};

//
// RenderingContext
//
[SecureContext, Exposed=Window] interface XRPresentationContext {
  readonly attribute HTMLCanvasElement canvas;
};
```
