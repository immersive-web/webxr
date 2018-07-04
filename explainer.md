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

* Detect available VR/AR devices.
* Query the devices capabilities.
* Poll the device’s position and orientation.
* Display imagery on the device at the appropriate frame rate.

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

 1. Request an XR device.
 1. If a device is available, application advertises XR functionality to the user.
 1. Request an immersive XR session from the device in response to a [user-activation event](https://html.spec.whatwg.org/multipage/interaction.html#activation).
 1. Use the session to run a render loop that produces graphical frames to be displayed on the XR device.
 1. Continue producing frames until the user indicates that they wish to exit XR mode.
 1. End the XR session.

### Acquiring a Device

The first thing that any XR-enabled page will want to do is request an `XRDevice` and, if one is available, advertise XR functionality to the user. (For example, by adding a button to the page that the user can click to start XR content.)

`navigator.xr.requestDevice` returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to an `XRDevice` if one is available. If no `XRDevice` is available, it will reject with a "NotFoundError". The promise will also be rejected with an appropriate error if an error occurs during the device query. For example, if the page does not have the appropriate permissions to access XR capabilities it would reject with a "NotAllowedError".

A `XRDevice` represents a physical unit of XR hardware that can present imagery to the user somehow, referred to here as an "XR hardware device". On desktop clients this will usually be a headset peripheral; on mobile clients it may represent the mobile device itself in conjunction with a viewer harness (e.g., Google Cardboard/Daydream or Samsung Gear VR). It may also represent devices without stereo-presentation capabilities but with more advanced tracking, such as ARCore/ARKit-compatible devices.

```js
function checkForXR() {
  navigator.xr.requestDevice().then(device => {
    onXRAvailable(device);
  }, err => {
    if (err.name === 'NotFoundError') {
      // No XRDevices available.
      console.error('No XR devices available:', err);
    } else {
      // An error occurred while requesting an XRDevice.
      console.error('Requesting XR device failed:', err);
    }
  });
}
```

Future revisions of the API may add filter criteria to `navigator.xr.requestDevice`.

> **Non-normative Note:** If there are multiple XR devices available, the UA will need to pick which one to return. The UA is allowed to use any criteria it wishes to select which device is returned, including settings UI that allows users to manage device priority. Calling `navigator.xr.requestDevice` should not trigger device-selection UI, however, as this would cause many sites to display XR-specific dialogs early in the document lifecycle without user activation.

It's possible that even if no XR device is available initially, one may become available while the application is running, or that a previously available device becomes unavailable. This will be most common with PC peripherals that can be connected or disconnected at any time. Pages can listen to the `devicechange` event emitted on `navigator.xr` to respond to changes in device availability after the page loads. (XR devices already available when the page loads will not cause a `devicechange` event to be fired.)

```js
navigator.xr.addEventListener('devicechange', checkForXR);
```

### Sessions

A `XRDevice` indicates only the availability of an XR device. In order to do anything that involves the device's presentation or tracking capabilities, the application will need to request an `XRSession` from the `XRDevice`.

There are two primary classes of session that can be created:

**Immersive**: Requested with the `immersive: true` dictionary argument. Immersive sessions present content directly to the `XRDevice`, enabling immersive presentation. Only one immersive session per XR hardware device is allowed at a time across the entire UA. Immersive sessions must be created within a user activation event or within another callback that has been explicitly indicated to allow immersive session creation.

**Non-Immersive (in-page)**: The default mode, but can be explicitly requested with the `immersive: false` dictionary argument. Non-immersive sessions do not have the ability to display immersive content on the `XRDevice` but are able to access device tracking information and use it to render content on the page. This technique, where a scene rendered to the page is responsive to device movement, is sometimes referred to as "Magic Window" mode. It's especially useful for mobile devices, where moving the device can be used to look around a scene. Devices like Tango phones and tablets with 6DoF tracking capabilities may expose them via non-immersive sessions even if the hardware is not capable of immersive, stereo presentation. Any non-immersive sessions are suspended when an immersive session is active. Non-immersive sessions are not required to be created within a user activation event unless paired with another option that explicitly does require it.

### Detecting and advertising XR mode

If an `XRDevice` is available and able to create an immersive session, the application will usually want to add some UI to trigger activation of "XR Presentation Mode", where the application can begin sending imagery to the device. Testing to see if the device supports the capabilities the application needs is done via the `supportsSession` call, which takes a dictionary of the desired functionality and returns a promise which resolves if the device can create a session which supporting those properties and rejects otherwise. Querying for support this way is necessary because it allows the application to detect what XR features are available without actually engaging the sensors or beginning presentation, which can incur significant power or performance overhead on some systems and may have side effects such as launching a status tray or storefront.

In the following examples we will focus on using immersive sessions, and cover non-immersive session use in the [`Advanced Functionality`](#non-immersive-sessions-magic-windows) section. With that in mind, we ask here if the `XRDevice` supports immersive sessions, since we want the ability to display imagery on the headset.

```js
let xrDevice = null;

async function onXRAvailable(device) {
  xrDevice = device;

  // Many XRDevices are capable of immersive presentation to
  // the device, which is necessary to show imagery in a headset. If the device
  // has that capability the page will want to add an "Enter VR" button (similar
  // to "Enter Fullscreen") that triggers the page to begin showing imagery on
  // the headset.
  xrDevice.supportsSession({ immersive: true }).then(() => {
    var enterXrBtn = document.createElement("button");
    enterXrBtn.innerHTML = "Enter VR";
    enterXrBtn.addEventListener("click", beginXRSession);
    document.body.appendChild(enterXrBtn);
  }).catch((reason) => {
    console.log("Session not supported: " + reason);
  });
}
```

### Beginning an XR session

Clicking the button in the previous sample will attempt to acquire an `XRSession` by callling `XRDevice`'s `requestSession()` method. This returns a promise that resolves to an `XRSession` upon success. When requesting a session, the capabilities that the returned session must have are passed in via a dictionary, exactly like the `supportsSession` call. If `supportsSession` resolved for a given dictionary, then calling `requestSession` with the same dictionary values should be reasonably expected to succeed, barring external factors (such as `requestSession` not being called in a user activation event for an immersive session.) The UA is ultimately responsible for determining if it can honor the request.

```js
function beginXRSession() {
  // requestSession must be called within a user gesture event
  // like click or touch when requesting an immersive session.
  xrDevice.requestSession({ immersive: true })
      .then(onSessionStarted)
      .catch(err => {
        // May fail for a variety of reasons. Probably just want to
        // render the scene normally without any tracking at this point.
        window.requestAnimationFrame(onDrawFrame);
      });
}
```
Once the session has started, some setup must be done to prepare for rendering.
- A `XRFrameOfReference` must be created to define the coordinate system in which the `XRDevicePose` objects will be defined. See the Advanced Functionality section for more details about frames of reference.
- The depth range of the session should be set to something appropriate for the application. This range will be used in the construction of the projection matrices provided by `XRFrame`.
- A `XRLayer` must be created and assigned to the `XRSession`'s `baseLayer` attribute. (`baseLayer` because future versions of the spec will likely enable multiple layers, at which point this would act like the `firstChild` attribute of a DOM element.)

```js
let xrSession = null;
let xrFrameOfRef = null;

function onSessionStarted(session) {
  // Store the session for use later.
  xrSession = session;

  // The `XRFrameOfReference` provides the coordinate system in which
  // `getViewMatrix()` and the `poseModelMatrix` are defined. For more
  // information on this see the `Advanced functionality` section
  xrSession.requestFrameOfReference("head-model")
    .then((frameOfRef) => {
      xrFrameOfRef = frameOfRef;
    })
    .then(setupWebGLLayer) // Create a compatible XRWebGLLayer.
    .then(() => {
      // Start the render loop
      xrSession.requestAnimationFrame(onDrawFrame);
    });
}
```

### Setting up an XRLayer

The content to present to the device is defined by an `XRLayer`. In the initial version of the spec only one layer type, `XRWebGLLayer`, is defined and only one layer can be used at a time. This is set via the `XRSession`'s `baseLayer` attribute. Future iterations of the spec will define new types of `XRLayer`s. For example: a new layer type would be added to enable use with any new graphics APIs that get added to the browser. The ability to use multiple layers at once and have them composited by the UA will likely also be added in a future API revision.

In order for a WebGL canvas to be used with an `XRWebGLLayer`, its context must be _compatible_ with the `XRDevice`. This can mean different things for different environments. For example, on a desktop computer this may mean the context must be created against the graphics adapter that the `XRDevice` is physically plugged into. On most mobile devices though, that's not a concern and so the context will always be compatible. In either case, the WebXR application must take steps to ensure WebGL context compatibility before using it with an `XRWebGLLayer`.

When it comes to ensuring canvas compatibility there's two broad categories that apps will fall under.

**XR Enhanced:** The app can take advantage of XR hardware, but it's used as a progressive enhancement rather than a core part of the experience. Most users will probably not interact with the app's XR features, and as such asking them to make XR-centric decisions early in the app lifetime would be confusing and inappropriate. An example would be a news site with an embedded 360 photo gallery or video. (We expect the large majority of early WebXR content to fall into this category.)

This style of application should call `WebGLRenderingContextBase`'s `setCompatibleXRDevice()` method with the `XRDevice` in question. This will set a compatibility bit on the context that allows it to be used. Contexts without the compatibility bit will fail when attempting to create an `XRLayer` with them. In the event that a context is not already compatible with the `XRDevice` the [context will be lost and attempt to recreate itself](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13) using the compatible graphics adapter. It is the page's responsibility to handle WebGL context loss properly, recreating any necessary WebGL resources in response. If the context loss is not handled by the page, the promise returned by `setCompatibleXRDevice` will fail. The promise may also fail for a variety of other reasons, such as the context being actively used by a different, incompatible `XRDevice`.

```js
let glCanvas = document.createElement("canvas");
let gl = glCanvas.getContext("webgl");

function setupWebGLLayer() {
  // Make sure the canvas context we want to use is compatible with the device.
  return gl.setCompatibleXRDevice(xrDevice).then(() => {
    // The content that will be shown on the device is defined by the session's
    // baseLayer.
    xrSession.baseLayer = new XRWebGLLayer(xrSession, gl);
  });
}
```

**XR Centric:** The app's primary use case is displaying XR content, and as such it doesn't mind initializing resources in an XR-centric fashion, which may include asking users to select a headset as soon as the app starts. An example would be a game which is dependent on XR presentation and input. These types of applications can avoid the need to call `setCompatibleXRDevice` and the possible context loss that it may trigger by passing the `XRDevice` that the context will be used with as a context creation argument.

```js
let gl = glCanvas.getContext("webgl", { compatibleXRDevice: xrDevice });
```

Ensuring context compatibility with an `XRDevice` through either method may have side effects on other graphics resources in the page, such as causing the entire user agent to switch from rendering using an integrated GPU to a discrete GPU.

### Main render loop

The WebXR Device API provides information about the current frame to be rendered via the `XRFrame` object which developers must examine each iteration of the render loop. The `XRDevicePose` contains the information about all views which must be rendered and targets into which this rendering must be done.

`XRWebGLLayer` objects are not updated automatically. To present new frames, developers must use `XRSession`'s `requestAnimationFrame()` method. When the callback function is run, it is passed both a timestamp and an `XRFrame` containing fresh rendering data that must be used to draw into the `XRWebGLLayer`'s `framebuffer` during the callback. (Timestamp is given for compatibility with `window.requestAnimationFrame()`. Reserved for future use and will be `0` until that time.) This framebuffer is created by the UA and behaves similarly to a canvas's default framebuffer. Using `framebufferTexture2D`, `framebufferRenderbuffer`, `getFramebufferAttachmentParameter`, and `getRenderbufferParameter` will all generate an INVALID_OPERATION error. Additionally, outside of an `XRSession`'s `requestAnimationFrame()` callback the framebuffer will be considered incomplete, reporting FRAMEBUFFER_UNSUPPORTED when calling `checkFramebufferStatus`. Attempts to draw to it, clear it, or read from to generate an INVALID_FRAMEBUFFER_OPERATION error as indicated by the WebGL specification.

Once drawn to, the XR device will continue displaying the contents of the `XRWebGLLayer` framebuffer, potentially reprojected to match head motion, regardless of whether or not the page continues processing new frames. Potentially future spec iterations could enable additional types of layers, such as video layers, that could automatically be synchronized to the device's refresh rate.

To get view matrices or the `poseModelMatrix` for each `XRFrame`, developers must call `getDevicePose()` and provide an `XRCoordinateSystem` to specify the coordinate system in which these matrices should be defined. Unless the "head-model" `XRFrameOfReference` is being used, this function is not guaranteed to return a value. For example, the most common frame of reference, "eye-level", will fail to return a `viewMatrix` or a `poseModelMatrix` under tracking loss conditions. In that case, the page will need to decide how to respond. It may wish to re-render the scene using an older pose, fade the scene out to prevent disorientation, fall back to a "head-model" `XRFrameOfReference`, or simply not update. For more information on this see the [`Advanced functionality`](#orientation-only-tracking) section.

```js
function onDrawFrame(timestamp, xrFrame) {
  // Do we have an active session?
  if (xrSession) {
    let pose = xrFrame.getDevicePose(xrFrameOfRef);
    gl.bindFramebuffer(gl.FRAMEBUFFER, xrSession.baseLayer.framebuffer);

    for (let view of xrFrame.views) {
      let viewport = xrSession.baseLayer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      drawScene(view, pose);
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

function drawScene(view, pose) {
  let viewMatrix = null;
  let projectionMatrix = null;
  if (view) {
    viewMatrix = pose.getViewMatrix(view);
    projectionMatrix = view.projectionMatrix;
  } else {
    viewMatrix = defaultViewMatrix;
    projectionMatrix = defaultProjectionMatrix;
  }

  // Set uniforms as appropriate for shaders being used

  // Draw Scene
}
```

### Handling suspended sessions

The UA may temporarily "suspend" a session at any time. While suspended a session has restricted or throttled access to the `XRDevice` state and may process frames slowly or not at all. Suspended sessions can be reasonably be expected to be resumed at some point, usually when the user has finished performing whatever action triggered the suspension in the first place.

The UA may suspend a session if allowing the page to continue reading the headset position represents a security or privacy risk (like when the user is entering a password or URL with a virtual keyboard, in which case the head motion may infer the user's input), or if other content is obscuring the page's output. Additionally, non-immersive sessions are suspended while an immersive session is active.

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

A `XRSession` is "ended" when it is no longer expected to be used. An ended session object becomes detached and all operations on the object will fail. Ended sessions cannot be restored, and if a new active session is needed it must be requested from `XRDevice.requestSession()`.

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

The UA may end a session at any time for a variety of reasons. For example: The user may forcibly end presentation via a gesture to the UA, other native applications may take exclusive access of the XR hardware device, or the XR hardware device may become disconnected from the system. Well behaved applications should monitor the `end` event on the `XRSession` to detect when that happens.

```js
xrSession.addEventListener('end', onSessionEnd);
```

If the UA needs to halt use of a session temporarily the session should be suspended instead of ended. (See previous section.)

## Rendering to the Page

There are a couple of scenarios in which developers may want to present content rendered with the WebXR Device API on the page instead of (or in addition to) a headset: Mirroring and "Magic Window". Both methods display WebXR content on the page via a Canvas element with an `XRPresentationContext`. Like a `WebGLRenderingContext`, developers acquire an `XRPresentationContext` by calling the `HTMLCanvasElement` or `OffscreenCanvas` `getContext()` method with the context id of "xrpresent". The returned `XRPresentationContext` is permenantly bound to the canvas.

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

  xrDevice.requestSession({ immersive: true, outputContext: mirrorCtx })
      .then(onSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

### Non-immersive sessions ("Magic Windows")

There are several scenarios where it's beneficial to render a scene whose view is controlled by device tracking within a 2D page. For example:

 - Using phone rotation to view panoramic content.
 - Taking advantage of 6DoF tracking on devices (like [Tango](https://get.google.com/tango/) phones) with no associated headset.
 - Making use of head-tracking features for devices like [zSpace](http://zspace.com/) systems.

These scenarios can make use of non-immersive sessions to render tracked content to the page. Using a non-immersive session also enables content to use a single rendering path for both magic window and immersive presentation modes and makes switching between magic window content and immersive presentation of that content easier.

The [`RelativeOrientationSensor`](https://w3c.github.io/orientation-sensor/#relativeorientationsensor) and [`AbsoluteOrientationSensor`](https://w3c.github.io/orientation-sensor/#absoluteorientationsensor) interfaces (see [Motion Sensors Explainer](https://w3c.github.io/motion-sensors/)) can be used to polyfill the first case.

Similar to mirroring, to make use of this mode an `XRPresentationContext` is provided as the `outputContext` at session creation time with a non-immersive session. At that point content rendered to the `XRSession`'s `baseLayer` will be rendered to the canvas associated with the `outputContext`. The UA is also allowed to composite in additional content if desired. In the future, if multiple `XRLayers` are used their composited result will be what is displayed in the `outputContext`. Requests to create a non-immersive session without an output context will be rejected.

Immersive and non-immersive sessions can use the same render loop, but there are some differences in behavior to be aware of. The sessions may run their render loops at at different rates. During immersive sessions the UA runs the rendering loop at the `XRDevice`'s native refresh rate. During non-immersive sessions the UA runs the rendering loop at the refresh rate of page (aligned with `window.requestAnimationFrame`.) The method of computation of `XRView` projection and view matrices also differs between immersive and non-immersive sessions, with non-immersive sessions taking into account the output canvas dimensions and possibly the position of the users head in relation to the canvas if that can be determined.

Most instances of non-immersive sessions will only provide a single `XRView` to be rendered, but UA may request multiple views be rendered if, for example, it's detected that that output medium of the page supports stereo rendering. As a result pages should always draw every `XRView` provided by the `XRFrame` regardless of what type of session has been requested.

UAs may have different restrictions on non-immersive contexts that don't apply to immersive contexts. For instance, a different set of `XRFrameOfReference` types may be available with a non-immersive session versus an immersive session.

```js
let magicWindowCanvas = document.createElement('canvas');
let magicWindowCtx = magicWindowCanvas.getContext('xrpresent');
document.body.appendChild(magicWindowCanvas);

function beginMagicWindowXRSession() {
  // Request a non-immersive session for magic window rendering.
  xrDevice.requestSession({ outputContext: magicWindowCtx })
      .then(OnSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

The UA may reject requests for a non-immersive sessions for a variety of reasons, such as the inability of the underlying hardware to provide tracking data without actively rendering to the device. Pages should be designed to robustly handle the inability to acquire non-immersive sessions. `XRDevice.supportsSession()` can be used if a page wants to test for non-immersive session support before attempting to create the `XRSession`.

```js
function checkMagicWindowSupport() {
  // Check to see if the UA can support a non-immersive sessions with the given output context.
  return xrDevice.supportsSession({ outputContext: magicWindowCtx })
      .then(() => { console.log("Magic Window content is supported!"); })
      .catch((reason) => { console.log("Magic Window content is not supported: " + reason); });
}
```

## Input

XR hardware provides a wide variety of input mechanisms, ranging from single state buttons to fully tracked controllers with multiple buttons, joysticks, triggers, or touchpads. While the intent is to eventually support the full range of available hardware, for the initial version of the WebXR Device API the focus is on enabling a more universal "point and click" style system that can be supported in some capacity by any known XR device and in magic window mode.

In this model every input source has a ray that indicates what is being pointed at, called the "Target Ray", and reports when the primary action for that device has been triggered, surfaced as a "select" event. When the select event is fired the XR application can use the target ray of the input source that generated the event to determine what the user was attempting to interact with and respond accordingly. Additionally, if the input source represents a tracked device a "Grip" matrix will also be provided to indicate where a mesh should be rendered to align with the physical device.

### Enumerating input sources

Calling the `getInputSources()` function on an `XRSession` will return a list of all `XRInputSource`s that the user agent considers active. An `XRInputSource` may represent a tracked controller, inputs built into the headset itself, or more ephemeral input mechanims like tracking of hand gestures. When input sources are added to or removed from the list of available input sources the `inputsourceschange` event will be fired on the `XRSession` object to indicate that any cached copies of the list should be refreshed.

```js
// Get the current list of input sources.
let xrInputSources = xrSession.getInputSources();

// Update the list of input sources if it ever changes.
xrSession.addEventListener('inputsourceschange', (ev) => {
  xrInputSources = xrSession.getInputSources();
});
```

The properties of an XRInputSource object are immutable. If a device can be manipulated in such a way that these properties can change, the `XRInputSource` will be removed and recreated.

### Input poses

Each input source can query a `XRInputPose` using the `getInputPose()` function of any `XRFrame`. Getting the pose requires passing in the `XRInputSource` you want the pose for, as well as the `XRCoordinateSystem` the pose values should be given in, just like `getDevicePose()`. `getInputPose()` may return `null` in cases where tracking has been lost (similar to `getDevicePose()`), or the given `XRInputSource` instance is no longer connected or available.

The `gripMatrix` is a transform into a space where if the user was holding a straight rod in their hand it would be aligned with the negative Z axis (forward) and the origin rests at their palm. This enables developers to properly render a virtual object held in the user's hand. For example, a sword would be positioned so that the blade points directly down the negative Z axis and the center of the handle is at the origin.

If the input source has only 3DOF, the grip matrix may represent only a translation or rotation based on tracking capability. An example of this case is for physical hands on some AR devices which only have a tracked position. The `gripMatrix` will be `null` if the input source isn't trackable. 

An input source will also provide its preferred target ray on its pose, which is defined as a ray originating at `[0, 0, 0]` and extending down the negative Z axis, transformed by the `targetRayMatrix` attribute of an `XRInputPose` object. `targetRayMatrix` will never be `null`. The value will differ based on the type of input source that produces it, which is represented by the `targetRayMode` attribute:

  * `'gazing'` indicates the target ray will originate at the user's head and follow the direction they are looking (this is commonly referred to as a "gaze input" device). While it may be possible for these devices to be tracked (and have a grip matrix), the head gaze is used for targeting. Example devices: 0DOF clicker, regular gamepad, voice command, tracked hands.
  * `'pointing'` indicates that the target ray originates from a handheld device and represents that the user is using that device for pointing. The exact orientation of the ray relative to the device should follow platform-specific guidelines if there are any. In the absence of platform-specific guidance, the target ray should most likely point in the same direction as the user's index finger if it was outstretched while holding the controller.
  * `'tapping'` indicates that the input source was an interaction with the 2D canvas of a non-immersive session, such as a mouse click or touch event. See [Magic Window Input](#magic_window_input) for more details.

```js
// Loop over every input source and get their pose for the current frame.
for (let inputSource of xrInputSources) {
  let inputPose = xrFrame.getInputPose(inputSource, xrFrameOfRef);

  // Check to see if the pose is valid
  if (inputPose) {
    // Render a visualization of the input source (see next section).
    renderInputSource(session, inputSource, inputPose);

    // Highlight any objects that the target ray intersects with
    let hoveredObject = scene.getObjectIntersectingRay(inputPose.targetRayMatrix);
    if (hoveredObject) { 
      // Render a visualization of the object that is highlighted (see below).
      drawHighlightFrom(hovered, inputSource);
    }
  }
}
```

Some platforms may support both tracked and non-tracked input sources concurrently (such as a pair of tracked `'pointing'` 6DOF controllers plus a regular `'gazing'` clicker). Since `xrSession.getInputSources()` returns all connected input sources, an application should take into consideration the most recently used input sources when rendering UI hints, such as a cursor, ray or highlight.

```js
// Keep track of the last-used input source
var lastInputSource = null;

function onSessionStarted(session) {
  session.addEventListener("selectstart", event => {
    // Update the last-used input source
    lastInputSource = event.inputSource;
  });
  session.addEventListener("inputsourceschange", ev => {
    // Choose an appropriate default from available inputSources, such as prioritizing based on the value of targetRayMode:
    // 'tapping' over 'pointing' over 'gazing'.
    lastInputSource = computePreferredInputSource(session.getInputSources());
  });

  // Remainder of session initialization logic.
}

function drawHighlightFrom(hoveredObject, inputSource) {
  // Only highlight meshes that are targeted by the last used input source.
  if (inputSource == lastInputSource) {
    // Render a visualization of the highlighted object. (see next section)
    renderer.drawHighlightFrom(hoveredObject);
  }
}

// Called by the fictional app/middleware
function drawScene() {
  // Display only a single cursor or ray, on the most recently used input source.
  if (lastInputSource) {
    let inputPose = xrFrame.getInputPose(lastInputSource, xrFrameOfRef);
    if (inputPose) {
      // Render a visualization of the target ray/cursor of the active input source. (see next section)
      renderCursor(lastInputSource, inputPose)
    }
  }
}
```

### Selection event handling

The initial version of the WebXR Device API spec is limited to only recognizing when an input source's primary action has occurred. The primary action differs based on the hardware, and may indicate (but is not limited to):

  * Pressing a trigger
  * Clicking a touchpad
  * Tapping a button
  * Making a hand gesture
  * Speaking a command
  * Clicking or touching a canvas.

Three events are fired on the `XRSession` related to these primary actions: `selectstart`, `selectend`, and `select`.

A `selectstart` event indicates that the primary action has been initiated. It will most commonly be associated with pressing a button or trigger.

A `selectend` event indicates that the primary action has ended. It will most commonly be associated with releasing a button or trigger. A `selectend` event must also be fired if the input source is disconnected after a primary action has been initiated, or the primary action has otherwise been cancelled. In that case an associated `select` event will not be fired.

A `select` event indicates that a primary action has been completed. `select` events are considered to be [triggered by user activation](https://html.spec.whatwg.org/multipage/interaction.html#triggered-by-user-activation) and as such can be used to begin playing media or other trusted interactions.

For primary actions that are instantaneous without a clear start and end point (such as a verbal command), all three events should still fire in the sequence `selectstart`, `selectend`, `select`.

All three events are `XRInputSourceEvent` events. When fired the event's `inputSource` attribute must contain the `XRInputSource` that produced the event. The event's `frame` attribute must contain a valid `XRFrame` that can be used to query the input and device poses at the time the selection event occured. The `XRFrame`'s `views` array must be empty.

In most cases applications will only need to listen for the `select` event for basic interactions like clicking on buttons.

```js
function onSessionStarted(session) {
  session.addEventListener("select", onSelect);

  // Remainder of session initialization logic.
}

function onSelect(event) {
  let inputPose = event.frame.getInputPose(event.inputSource, xrFrameOfRef);
  if (inputPose) {
    // Ray cast into scene to determine if anything was hit.
    let selectedObject = scene.getObjectIntersectingRay(inputPose.targetRayMatrix);
    if (selectedObject) {
      selectedObject.onSelect();
    }
  }
}
```

Some input sources (such as those with a `targetRayMode` of `tapping`) will be only be added to the list of input sources whilst a primary action is occuring. In these cases, the `inputsourceschange` event will fire just prior to the `selectstart` event, then again when the input source is removed after the `selectend` event.

`selectstart` and `selectend` can be useful for handling dragging, painting, or other continuous motions.

In some cases tracked input sources cannot accurately track their position in space, and provides an estimated position based on the sensor data available to it. This is the case, for example, for the Daydream and GearVR 3DoF controllers, which use an arm model to approximate controller position based on rotation. In these cases the `emulatedPosition` attribute of the `XRInputPose` should be set to `true` to indicate that the translational components of the pose matrices may not be accurate.

While most applications will wish to use a targeting ray from the input source pose, it is possible to support only gaze and commit interactions such that the targeting ray always matches the head pose even if trackable controllers are connected. In this case, the `select` event should still be used to handle interaction events, but the device pose can be used to create the targeting ray.

```js
function onSelect(event) {
  // Use the device pose to create a ray from the head, regardless of whether controllers are connected.
  let devicePose = event.frame.getDevicePose(xrFrameOfRef);

  // Ray cast into scene with the device pose to determine if anything was hit.
  // Assumes the use of a fictionalized math and scene library.
  let rayOrigin = getTranslation(devicePose.poseModelMatrix);
  let rayDirection = applyRotation(scene.forwardVector, devicePose.poseModelMatrix);
  let selectedObject = scene.getObjectIntersectingRay(rayOrigin, rayDirection);
  if (selectedObject) {
    selectedObject.onSelect();
  }
}
```

### Rendering input sources

Most applications will want to visually represent the input sources somehow. The appropriate type of visualization to be used depends on the value of the `targetRayMode` attribute:

  * `'gazing'`: A cursor should be drawn at some distance down the target ray, ideally at the depth of the first surface it intersects with, so the user can identify what will be interacted with when a select event is fired. It's not appropriate to draw a controller or ray in this case, since they may obscure the user's vision or be difficult to visually converge on.
  * `'pointing'`: If the `gripMatrix` in not `null` an application-appropriate controller model should be drawn using that matrix as the transform. If appropriate for the experience, the a visualization of the target ray and a cursor as described in the `'gazing'` should also be drawn.
  * `'tapping'`: In all cases the point of origin of the target ray is obvious and no visualization is needed.

```js
// These methods presumes the use of a fictionalized rendering library.

// Render a visualization of the input source - eg. a controller mesh.
function renderInputSource(session, inputSource, inputPose) {
  // FIXME: Using a fictional isDisplayOpaque() method to state that controller meshes should not be rendered
  // on transparent displays (AR).
  if (isDisplayOpaque(session) && inputPose.gripMatrix) {
    // Render a controller mesh if the using the gripMatrix as a transform.
    let controllerMesh = getControllerMesh(inputSource);
    renderer.drawMeshWithTransform(controllerMesh, inputPose.gripMatrix);
  }
}

// Render a visualization of target ray of the input source - eg. a line or cursor.
// Presumes the use of a fictionalized rendering library.
function renderCursor(inputSource, inputPose) {
  // Only render a target ray if this was the most recently used input source.
  if (inputSource.targetRayMode == "pointing") {
    // Draw targeting rays for pointing devices only.
    renderer.drawRay(inputPose.targetRayMatrix);
  }

  if (inputSource.targetRayMode != "tapping") {
    // Draw a cursor for gazing and pointing devices only.
    let cursorPosition = scene.getIntersectionPoint(inputPose.targetRayMatrix);
    if (cursorPosition) {
      renderer.drawCursor(cursorPosition);
    }
  }
}
```

### Grabbing and dragging

While the primary motivation of this input model is a compatible "target and click" interface, more complex interactions such as grabbing and dragging with input sources can also be achieved using only the `select` events.

```js
// Stores details of an active drag interaction, is any
let activeDragInteraction = null;

function onSessionStarted(session) {
  session.addEventListener('selectstart', onSelectStart);
  session.addEventListener('selectend', onSelectEnd);

  // Remainder of session initialization logic.
}

function onSelectStart(event) {
  // Ignore the event if we are already dragging
  if (activeDragInteraction)
    return;
  
  let inputPose = event.frame.getInputPose(event.inputSource, xrFrameOfRef);
  // Ignore the event if this input source is not capable of tracking.
  if (!inputPose || !inputPose.gripMatrix)
    return;

  // Use the input source target ray to find a draggable object in the scene
  let hitResult = scene.hitTest(inputPose.targetRayMatrix)
  if (hitResult && hitResult.draggable) {
    // Use the gripMatrix translation to drag the intersected object, rather than the target ray.
    activeDragInteraction = {
      target: hitResult,
      targetStartPosition: hitResult.position,
      inputSource: event.inputSource,
      inputSourceStartPosition: getTranslation(inputPose.gripMatrix);
    };
  }
}

// Only end the drag when the input source that started dragging releases the select action
function onSelectEnd(event) {
  if (activeDragInteraction && event.inputSource == activeDragInteraction.inputSource)
    activeDragInteraction = null;
}

// Called by the fictional app/middleware every frame
function onUpdateScene() {
  if (activeDragInteraction) {
    let inputPose = frame.getInputPose(activeDragInteraction.inputSource, xrFrameOfRef);
    if (inputPose && inputPose.gripMatrix) {
      // Determine the vector from the start of the drag to the input source's current position
      // and position the draggable object accordingly
      let inputSourcePosition = getTranslation(inputPose.gripMatrix);
      let deltaPosition = Vector3.subtract(inputSourcePosition, activeDragInteraction.inputSourceStartPosition);
      let newPosition = Vector3.add(activeDragInteraction.targetStartPosition, deltaPosition);
      activeDragInteraction.target.setPosition(newPosition);
    }
  }
}
```

The above sample is optimized for dragging items in the scene around using input sources that have a gripMatrix. It would also be possible to add further script logic to use the target ray properties to position items in the world - this is left as an exercise for the reader.

### Magic Window Input

When using a non-immersive session, pointer events on the canvas that created the `outputContext` passed during the session request are monitored. `XRInputSource`s are generated in response to allow unified input handling with immersive mode controller or gaze input.

When the canvas receives a `pointerdown` event an `XRInputSource` is created with a `targetRayMode` of `'tapping'` and added to the array returned by `getInputSources()`. A `selectstart` event is then fired on the session with the new `XRInputSource`. The `XRInputSource`'s pointing ray should be updated with every `pointermove` event the canvas receives until a `pointerup` event is received. A `selectend` event is then fired on the session and the `XRInputSource` is removed from the array returned by `getInputSources()`. When the canvas receives a `click` event a `select` event is fired on the session with the appropriate `XRInputSource`.

For each of these events the `XRInputSource`'s pointing ray must be updated to originate at the point that was interacted with on the canvas, projected onto the near clipping plane (defined by the `depthNear` attribute of the `XRSession`) and extending out into the scene along that projected vector.

## Advanced functionality

Beyond the core APIs described above, the WebXR Device API also exposes several options for taking greater advantage of the XR hardware's capabilities.

### Orientation-only tracking

Some headsets (Daydream, Gear VR, Cardboard), are naturally limited to only tracking a user's head rotation. This is known as "3 Degree of Freedom" tracking, or "3DoF". For this type of device, a small amount of simulated translation is usually applied to the returned matrices by estimating the motion of the user's neck based on the device rotation. If the translation portions of the matrices provided by an `XRDevicePose` do not reflect a real position in space, that must be indicated by setting the `emulatedPosition` attribute to `true`.

For devices that are not naturally limited to orientation-only tracking, it can still be useful for app developers to explicitly specify that they don't want any positional tracking in the matrices they receive. This is primarily necessary when viewing 360 photos or videos, since the source material is intended to be viewed from a single point. (This may also provide power savings on some devices, since it may allow some sensors to be turned off.) That can be accomplished by requesting a "head-model" `XRFrameOfReference`.

```js
xrSession.requestFrameOfReference("head-model").then((frameOfRef) => {
  xrFrameOfRef = frameOfRef;
});

// Use xrFrameOfRef as detailed above.
```

Any `XRDevicePose`s queried with a "head-model" `XRFrameOfReference` must have their `emulatedPosition` attributes set to `true`. Any `XRInputPose`s queried with a "head-model" `XRFrameOfReference` must provide positions relative to the head's emulated position, so that the input devices appear in the correct location from the user's point of view.

### Room-scale tracking and boundaries

Some XR devices have been configured with details about the area they are being used in, including things like where the floor is and what boundaries of the safe space is so that it can be communicated to the user in XR. It can be beneficial to render the virtual scene so that it lines up with the users physical space for added immersion, especially ensuring that the virtual floor and the physical floor align. This is frequently called "room scale" or "standing space". It helps the user feel grounded in the virtual space. WebXR refers to this type of bounded, floor-relative play space as a "stage". Applications can take advantage of that space by creating a stage `XRFrameOfReference`. This will report values relative to the floor, ideally at the center of the room. (In other words the users physical floor is at Y = 0.) Not all `XRDevices` will support this mode, however. `requestFrameOfReference` will reject the promise in that case.

```js
// Try to get a frame of reference where the floor is at Y = 0
xrSession.requestFrameOfReference("stage").then((frameOfRef) => {
  // Will always succeed due to stage emulation. See the section titled
  // "Emulated stage frame of reference" for details.
  xrFrameOfRef = frameOfRef;
});

// Use xrFrameOfRef as detailed above, but render the floor of the virtual space at Y = 0;
```

When using a stage `XRFrameOfReference` the device will frequently have a configured "safe area" that the user can move around in without fear of bumping into real world objects. WebXR can communicate the rough boundaries of this space via the `XRFrameOfReference.bounds` attribute. It provides a polygonal boundary given in the 'geometry' point array, which represents a loop of points at the edges of the safe space. The points are given in a clockwise order as viewed from above, looking towards the negative end of the Y axis. The shape it describes is not guaranteed to be convex. The values reported are relative to the stage origin, but do not necessarily contain it. The `bounds` attribute is null if the bounds are unavailable for the current frame of reference.

If the `bounds` are available the application should try to ensure that all content the user needs to interact with can be reached while staying inside the described bounds geometry.

```js
// Demonstrated here using a fictional 3D library to simplify the example code.
function onBoundsUpdate() {
  if (xrFrameOfRef.bounds) {
    // Visualize the bounds geometry as 2 meter high quads
    boundsMesh.clear();
    let pointCount = xrFrameOfRef.bounds.geometry.length;
    for (let i = 0; i < pointCount - 1; ++i) {
      let pointA = xrFrameOfRef.bounds.geometry[i];
      let pointB = xrFrameOfRef.bounds.geometry[i+1];
      boundsMesh.addQuad(
          pointA.x, 0, pointA.z, // Quad Corner 1
          pointB.x, 2.0, pointB.z) // Quad Corner 2
    }
    // Close the loop
    let pointA = xrFrameOfRef.bounds.geometry[pointCount-1];
    let pointB = xrFrameOfRef.bounds.geometry[0];
    boundsMesh.addQuad(
          pointA.x, 0, pointA.z, // Quad Corner 1
          pointB.x, 2.0, pointB.z) // Quad Corner 2
  } else {
    // No bounds geometry to visualize
    boundsMesh.clear();
  }
}
```

Changes to the bounds while a session is active should be a relatively rare occurrence, but it can be monitored by listening for the frame of reference's `boundschange` event.

```js
xrFrameOfRef.addEventListener('boundschange', onBoundsUpdate);
```

### Emulated stage frame of reference

Often times content designed to be used with a `stage` `XRFrameOfReference` (that is, the physical floor is at Y=0) can still be used with headsets that don't have appropriate knowledge of the user's physical space. For example the headset may only support 3DoF tracking, or 6DoF tracking without floor detection. In these case as a matter of developer convenience an emulated `stage` frame of reference is provided by default as a fallback.

An emulated `stage` frame or reference is functionally identical to an `eye-level` frame of reference with an offset applied along the Y axis to place the user's head at an estimated height. The default estimated height is determined by the UA, and can be an aritrary or user configurable value. If the platform APIs provide a user configured height that should be taken into consideration when determining the emulated height. Note that the floor's location will almost certainly not match up with the user's physical floor when using `stage` emulation, the intent is just to get it "close enough" that the user doesn't overtly feel like they are stuck in the ground or floating. No bounds are reported for an emulated `stage`.

Using an emulated `stage` as a fallback prevents the need for additional state tracking and matrix transforms on the developer's part in order to render the same content on a wide range of devices. To detect if the stage is using an emulated height or not after creation developers can check the `XRFrameOfReference`'s `emulatedHeight` attribute. A non-zero value indicates that the `stage` is being emulated.

If the system is capable of providing native `stage` tracking it must do so instead of providing an emulated `stage` frame of reference. Some applications may require a non-emulated `stage`, however, so the application is allowed to opt-out of emulation by setting the `disableStageEmulation` dictionary option to `true` when calling `requestFrameOfReference()`. 

```js
// Get a native stage frame of reference if one is available, fail otherwise.
xrSession.requestFrameOfReference("stage", { disableStageEmulation: true })
    .then((frameOfRef) => {
      xrFrameOfRef = frameOfRef;
    }).catch(() => {
      // No stage frame of reference available for this device. Fall back to
      // using a different frame of reference type of provide an appropriate
      // error to the user.
    });
```

Some experiences that use a `stage` frame of reference may assume that the user will be sitting, kneeling, or assuming some pose other than standing for the majority of the experience, such as a racing game or a meditation application. To accommodate these types of non-standing `stage` experiences a preferred height can also be provided to the `requestFrameOfReference()` options dictionary via the `stageEmulationHeight` option, given in meters. When `stageEmulationHeight` is not `0` it must be used in favor of UA provided default values while emulating.

```js
// Get a stage frame of reference, emulating one defaulting to 1.2 meters high
// if necessary.
xrSession.requestFrameOfReference("stage", { stageEmulationHeight: 1.2 })
    .then((frameOfRef) => {
      // Will always succeed.
      xrFrameOfRef = frameOfRef;
    });
```   

### Multiview rendering

Developers may optionally take advantage of the [WEBGL_multiview extension](https://www.khronos.org/registry/webgl/extensions/WEBGL_multiview/) to both WebGL 1.0 and WebGL 2.0 for optimized multiview rendering. The WEBGL_multiview extension must be successfully queried from the supplied context prior to the creation of the `XRWebGLLayer` or it will fall back to using a framebuffer that is not multiview-aware. Additionally, the UA may choose to not honor the multiview request for any reason, which will also fall back to using a framebuffer that is not multiview-aware. As such, developers must query the `XRWebGLLayer.multiview` property after the `XRWebGLLayer` is constructed and respond accordingly.

When `XRWebGLLayer.multiview` is false:
- The `XRWebGLLayer`'s `framebuffer` will be created in a side-by-side configuration.
- Calling `XRWebGLLayer.getViewport()` will return a different `XRViewport` for each `XRView`.

When `XRWebGLLayer.multiview` is true:
- The UA may decide to back the framebuffer with a texture array, side-by-side texture or another implementation of the UA's choosing. This implementation decision must not have any impact how developers author their shaders or setup the WebGL context for rendering.
- Calling `XRWebGLLayer.getViewport()` will return the same `XRViewport` for all `XRView`s.

```js
function setupWebGLLayer() {
  return gl.setCompatibleXRDevice(xrDevice).then(() => {
    // XRWebGLLayer allows for the optional use of the WEBGL_multiview extension
    xrSession.baseLayer = new XRWebGLLayer(xrSession, gl, { multiview: true });
  });
}

function onDrawFrame(xrFrame) {
  // Do we have an active session?
  if (xrSession) {
    let pose = xrFrame.getDevicePose(xrFrameOfRef);
    gl.bindFramebuffer(xrSession.baseLayer.framebuffer);

    if (xrSession.baseLayer.multiview) {
      // When using the `WEBGL_multiview` extension, all `XRView`s return the
      // same value from `getViewport()`, so it only needs to be called once.
      let viewport = xrSession.baseLayer.getViewport(xrFrame.views[0]);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      drawMultiviewScene(xrFrame.views, pose);
    } else {
      for (let view of xrFrame.views) {
        let viewport = xrSession.baseLayer.getViewport(view);
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        drawScene(view, pose);
      }
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

function drawMultiviewScene(views, pose) {
  for (let view of views) {
    let viewMatrix = pose.getViewMatrix(view);
    let projectionMatrix = view.projectionMatrix;

    // Set uniforms as appropriate for shaders being used
  }

  // Draw Scene
}
```

### Controlling rendering quality

While in immersive sessions, the UA is responsible for providing a framebuffer that is correctly optimized for presentation to the `XRSession` in each `XRFrame`. Developers can optionally request either the buffer size or viewport size be scaled, though the UA may not respect the request. Even when the UA honors the scaling requests, the result is not guaranteed to be the exact percentage requested.

The first scaling mechanism is done by specifying a `framebufferScaleFactor` at `XRWebGLLayer` creation time. Each `XRDevice` has a default framebuffer size, which corresponds to a `framebufferScaleFactor` of `1.0`. This default size is determined by the UA and should represent a reasonable balance between rendering quality and performance. It may not be the 'native' size for the device (that is, a buffer which would match the native screen resolution 1:1 at point of highest magnification). For example, mobile platforms such as GearVR or Daydream frequently suggest using lower resolutions than their screens are capable of to ensure consistent performance.

If the `framebufferScaleFactor` is set to a number higher or lower than `1.0` the UA should create a framebuffer that is the default resolution multiplied by the given scale factor. So a `framebufferScaleFactor` of `0.5` would specify a framebuffer with 50% the default height and width, and so on. The UA may clamp the scale factor however it sees fit, or may round it to a desired increment if needed (for example, fitting the buffer dimensions to powers of two if that is known to increase performance.)

```js
function setupWebGLLayer() {
  return gl.setCompatibleXRDevice(xrDevice).then(() => {
    // Create a WebGL layer with a slightly lower than default resolution.
    xrSession.baseLayer = new XRWebGLLayer(xrSession, gl, { framebufferScaleFactor: 0.8 });
  });
```

In some cases the developer may want to ensure that their application is rendering at the 'native' size for the device. To do this the developer can query the scale factor that should be passed during layer creation with the `XRWebGLLayer.getNativeFramebufferScaleFactor()` function. (Note that in some cases the native scale may actually be less than the recommended scale of `1.0` if the system is configured to render "superscaled" by default.)

```js
function setupNativeScaleWebGLLayer() {
  return gl.setCompatibleXRDevice(xrDevice).then(() => {
    // Create a WebGL layer that matches the device's native resolution.
    let nativeScaleFactor = XRWebGLLayer.getNativeFramebufferScaleFactor(xrSession);
    xrSession.baseLayer = new XRWebGLLayer(xrSession, gl, { framebufferScaleFactor: nativeScaleFactor });
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

### Responding to a reset pose

Many XR systems have a mechanism for allowing the user to reset which direction is "forward." For security and comfort reasons the WebXR Device API has no mechanism to trigger a pose reset programmatically, but it can still be useful to know when it happens. Pages may want to take advantage of the visual discontinuity to reposition the user or other elements in the scene into a more natural position for the new orientation. Pages may also want to use the opportunity to clear or reset any additional transforms that have been applied if no longer needed.

A page can be notified when a pose reset happens by listening for the 'resetpose' event from the 'XRSession'.

```js
xrSession.addEventListener('resetpose', xrSessionEvent => {
  // For an app that allows artificial Yaw rotation, this would be a perfect
  // time to reset that.
  resetYawTransform();
});
```

### Controlling depth precision

The projection matrices given by the `XRView`s take into account not only the field of view of presentation medium but also the depth range for the scene, defined as a near and far plane. WebGL fragments rendered closer than the near plane or further than the far plane are discarded. By default the near plane is 0.1 meters away from the user's viewpoint and the far plane is 1000 meters away.

Some scenes may benefit from changing that range to better fit the scene's content. For example, if all of the visible content in a scene is expected to remain within 100 meters of the user's viewpoint, and all content is expected to appear at least 1 meter away, reducing the range of the near and far plane to `[1, 100]` will lead to more accurate depth precision. This reduces the occurence of z fighting, an artifact which manifests as a flickery, shifting pattern when closely overlapping surfaces are rendered. Conversely, if the visible scene extends for long distances you'd want to set the far plane far enough away to cover the entire visible range to prevent clipping, with the tradeoff being that further draw distances increase the occurence of z fighting artifacts. The best practice is to always set the near and far planes to as tight of a range as your content will allow.

To adjust the near and far plane distance, set the `XRSession`'s `depthNear` and `depthFar` values respectively. These values are given in meters and changes to them will take affect with the next `XRFrame` provided.

```js
// This reduces the depth range of the scene to [1, 100] meters.
// The change will take effect on the next XRSession requestAnimationFrame callback.
xrSession.depthNear = 1.0;
xrSession.depthFar = 100.0;
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
The data provided by an `XRDevicePose` instance is similar to the data provided by the non-standard `DeviceOrientationEvent`, with some key differences:

* It’s an explicit polling interface, which ensures that new input is available for each frame. The event-driven `DeviceOrientation` data may skip a frame, or may deliver two updates in a single frame, which can lead to disruptive, jittery motion in an XR application.
* `DeviceOrientation` events do not provide positional data, which is a key feature of high-end XR hardware.
* More can be assumed about the intended use case of `XRDevice` data, so optimizations such as motion prediction can be applied.
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
  Promise<XRDevice> requestDevice();
};

//
// Device
//

[SecureContext, Exposed=Window] interface XRDevice {
  Promise<void> supportsSession(optional XRSessionCreationOptions parameters);
  Promise<XRSession> requestSession(optional XRSessionCreationOptions parameters);
};

//
// Session
//

dictionary XRSessionCreationOptions {
  boolean immersive = false;
  XRPresentationContext outputContext;
};

[SecureContext, Exposed=Window] interface XRSession : EventTarget {
  readonly attribute XRDevice device;
  readonly attribute boolean immersive;
  readonly attribute XRPresentationContext outputContext;
  readonly attribute XREnvironmentBlendMode environmentBlendMode;

  attribute double depthNear;
  attribute double depthFar;

  attribute XRLayer baseLayer;

  attribute EventHandler onblur;
  attribute EventHandler onfocus;
  attribute EventHandler onresetpose;
  attribute EventHandler onend;

  attribute EventHandler onselect;
  attribute EventHandler onselectstart;
  attribute EventHandler onselectend;
  attribute EventHandler oninputsourceschange;

  Promise<XRFrameOfReference> requestFrameOfReference(XRFrameOfReferenceType type, optional XRFrameOfReferenceOptions options);

  long requestAnimationFrame(XRFrameRequestCallback callback);
  void cancelAnimationFrame(long handle);

  FrozenArray<XRInputSource> getInputSources();

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

//
// Frame, Device Pose, and Views
//

[SecureContext, Exposed=Window] interface XRFrame {
  readonly attribute XRSession session;
  readonly attribute FrozenArray<XRView> views;

  XRDevicePose? getDevicePose(XRCoordinateSystem coordinateSystem);
  XRInputPose? getInputPose(XRInputSource inputSource, XRCoordinateSystem coordinateSystem);
};

enum XREye {
  "left",
  "right"
};

[SecureContext, Exposed=Window] interface XRView {
  readonly attribute XREye eye;
  readonly attribute Float32Array projectionMatrix;
};

[SecureContext, Exposed=Window] interface XRViewport {
  readonly attribute long x;
  readonly attribute long y;
  readonly attribute long width;
  readonly attribute long height;
};

[SecureContext, Exposed=Window] interface XRDevicePose {
  readonly attribute boolean emulatedPosition;
  readonly attribute Float32Array poseModelMatrix;

  Float32Array getViewMatrix(XRView view);
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
  boolean multiview = false;
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
  readonly attribute boolean multiview;

  readonly attribute unsigned long framebufferWidth;
  readonly attribute unsigned long framebufferHeight;
  readonly attribute WebGLFramebuffer framebuffer;

  XRViewport? getViewport(XRView view);
  void requestViewportScaling(double viewportScaleFactor);

  static double getNativeFramebufferScaleFactor(XRSession session);
};

//
// Coordinate Systems
//

[SecureContext, Exposed=Window] interface XRCoordinateSystem : EventTarget {
  Float32Array? getTransformTo(XRCoordinateSystem other);
};

enum XRFrameOfReferenceType {
  "head-model",
  "eye-level",
  "stage",
};

dictionary XRFrameOfReferenceOptions {
  boolean disableStageEmulation = false;
  double stageEmulationHeight = 0.0;
};

[SecureContext, Exposed=Window] interface XRFrameOfReference : XRCoordinateSystem {
  readonly attribute XRStageBounds? bounds;
  readonly attribute double emulatedHeight;

  attribute EventHandler onboundschange;
};

[SecureContext, Exposed=Window] interface XRStageBounds {
  readonly attribute FrozenArray<XRStageBoundsPoint> geometry;
};

[SecureContext, Exposed=Window] interface XRStageBoundsPoint {
  readonly attribute double x;
  readonly attribute double z;
};

//
// Input
//

enum XRHandedness {
  "",
  "left",
  "right"
};

enum XRTargetRayMode {
  "gazing",
  "pointing",
  "tapping"
};

interface XRInputSource {
  readonly attribute XRHandedness handedness;
  readonly attribute XRTargetRayMode targetRayMode;
};

interface XRInputPose {
  readonly attribute boolean emulatedPosition;
  readonly attribute Float32Array targetRayMatrix;
  readonly attribute Float32Array? gripMatrix;
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

[SecureContext, Exposed=Window,
 Constructor(DOMString type, XRCoordinateSystemEventInit eventInitDict)]
interface XRCoordinateSystemEvent : Event {
  readonly attribute XRCoordinateSystem coordinateSystem;
};

dictionary XRCoordinateSystemEventInit : EventInit {
  required XRCoordinateSystem coordinateSystem;
};

[SecureContext, Exposed=Window,
 Constructor(DOMString type, XRInputSourceEventInit eventInitDict)]
interface XRInputSourceEvent : Event {
  readonly attribute XRFrame frame;
  readonly attribute XRInputSource inputSource;
};

dictionary XRInputSourceEventInit : EventInit {
  required XRFrame frame;
  required XRInputSource inputSource;
};

//
// WebGL
//
partial dictionary WebGLContextAttributes {
    XRDevice compatibleXRDevice = null;
};

partial interface WebGLRenderingContextBase {
    Promise<void> setCompatibleXRDevice(XRDevice device);
};

//
// RenderingContext
//
[SecureContext, Exposed=Window] interface XRPresentationContext {
  readonly attribute HTMLCanvasElement canvas;
};
```
