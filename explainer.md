# WebVR Explained

## What is WebVR?
[WebVR](https://w3c.github.io/webvr/) is an API that provides access to input and output capabilities commonly associated with Virtual Reality hardware like [Google’s Daydream](https://vr.google.com/daydream/), the [Oculus Rift](https://www3.oculus.com/rift/), the [Samsung Gear VR](http://www.samsung.com/global/galaxy/gear-vr/), the [HTC Vive](https://www.htcvive.com/), and [Windows Mixed Reality headsets](https://developer.microsoft.com/en-us/windows/mixed-reality). More simply put, it lets you create Virtual Reality web sites that you can view in a VR headset.

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

Also, while input is an important part of the full VR experience it's a large enough topic that it should be handled separately, and thus will not be covered in-depth by this document. It's worth noting, however, that it may be necessary to have a basic understanding of how VR input will be handled in order for the WebVR spec to be complete.

## Use cases
Given the marketing of early VR hardware to gamers, one may naturally assume that this API will primarily be used for development of games. While that’s certainly something we expect to see given the history of the WebGL API, which is tightly related, we’ll probably see far more “long tail”-style content than large-scale games. Broadly, VR content on the web will likely cover areas that do not cleanly fit into the app-store models being used as the primary distribution methods by all the major VR hardware providers, or where the content itself is not permitted by the store guidelines. Some high level examples are:

### Video
360° and 3D video are areas of immense interest (for example, see [ABC’s 360° video coverage](http://abcnews.go.com/US/fullpage/abc-news-vr-virtual-reality-news-stories-33768357)), and the web has proven massively effective at distributing video in the past. A VR-enabled video player would, upon detecting the presence of VR hardware, show a “View in VR” button, similar to the “Fullscreen” buttons present in today’s video players. When the user clicks that button, a video would render in the headset and respond to natural head movement. Traditional 2D video could also be presented in the headset as though the user is sitting in front of a theater-sized screen, providing a more immersive experience.

### Object/data visualization
Sites can provide easy 3D visualizations through WebVR, often as a progressive improvement to their more traditional rendering. Viewing 3D models (e.g., [SketchFab](https://sketchfab.com/)), architectural previsualizations, medical imaging, mapping, and [basic data visualization](http://graphics.wsj.com/3d-nasdaq/) can all be more impactful, easier to understand, and convey an accurate sense of scale in VR. For those use cases, few users would justify installing a native app, especially when web content is simply a link or a click away.

Home shopping applications (e.g., [Matterport](https://matterport.com/try/)) serve as particularly effective demonstrations of this. Depending on device capabilities, sites can scale all the way from a simple photo carousel to an interactive 3D model on screen to viewing the walkthrough in VR, giving users the impression of actually being present in the house. The ability for this to be a low-friction experience for users is a huge asset for both users and developers, since they don’t need to convince users to install a heavy (and possibly malicious) executable before hand.

### Artistic experiences
VR provides an interesting canvas for artists looking to explore the possibilities of a new medium. Shorter, abstract, and highly experimental experiences are often poor fits for an app-store model, where the perceived overhead of downloading and installing a native executable may be disproportionate to the content delivered. The web’s transient nature makes these types of applications more appealing, since they provide a frictionless way of viewing the experience. Artists can also more easily attract people to the content and target the widest range of devices and platforms with a single code base.

## Lifetime of a VR web app

The basic steps any WebVR application will go through are:

 1. Request a list of the available VR devices.
 2. Checks to see if the desired device supports the presentation modes the application needs.
 3. If so, application advertises VR functionality to the user.
 4. User performs an action that indicates they want to enter VR mode.
 5. Request a VR session to present VR content with.
 6. Begin a render loop that produces graphical frames to be displayed on the VR device.
 7. Continue producing frames until the user indicates that they wish to exit VR mode.
 8. End the VR session.

### Device enumeration

The first thing that any VR-enabled page will want to do is enumerate the available VR hardware and, if present, advertise VR functionality to the user.

`navigator.vr.getDevices` returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to a list of available devices. Each `VRDevice` represents a physical unit of VR hardware that can present imagery to the user somehow, referred to here as a "VR hardware device". On desktop clients this will usually be a headset peripheral; on mobile clients it may represent the mobile device itself in conjunction with a viewer harness (e.g., Google Cardboard or Samsung Gear VR). It may also represent devices without stereo presentation capabilities but more advanced tracking, such as Tango devices.

```js
let vrDevice = null;

navigator.vr.getDevices().then(devices => {
  if (devices.length > 0) {
    // Use the first device in the array if one is available. If multiple
    // devices are present, you may want to provide the user a way of choosing
    // which device to use.
    vrDevice = devices[0];
    onVRAvailable();
  } else {
    // Could not find any VR hardware connected.
  }
}, err => {
  // An error occurred querying VR hardware. May be the result of blocked
  // permissions by a parent frame.
});
```

### Sessions

A `VRDevice` indicates the presence of a VR hardware device but provides very little information about it outside of a name that could be used to select it from a list. In order to do anything that involves the hardware's presentation or tracking capabilities the application will need to request a `VRSession` from the `VRDevice`.

Sessions can be created with one of two levels of access:

**Exclusive Access**: Requested with the `exclusive: true` dictionary argument. Exclusive sessions present content directly to the `VRDevice`, enabling immersive VR presentation. Only one exclusive session per VR hardware device is allowed at a time across the entire UA. Exclusive sessions must be created within a user gesture event or within another callback that has been explicitly indicated to allow exclusive session creation.

**Non-Exclusive Access**: The default mode, but can be explicitly requested with the `exclusive: false` dictionary argument. Non-exclusive sessions do not have the ability to display immersive content on the `VRDevice` but are able to access device tracking information and use it to render content on the page. This technique, where a scene rendered to the page is responsive to device movement, is sometimes referred to as "Magic Window" mode. It's especially useful for mobile devices, where moving the device can be used to look around a scene. Devices like Tango phones and tablets with 6DoF tracking capabilities may expose them via non-exclusive sessions even if the hardware is not capable of immersive, stereo presentation. Any non-exclusive sessions are suspended when an exclusive session is active. Non-exclusive sessions are not required to be created within a user gesture event.

### Detecting and advertising VR mode

If a `VRDevice` is available and able to create an exclusive session, the application will usually want to add some UI to trigger activation of "VR Presentation Mode", where the application can begin sending imagery to the device. Testing to see if the device supports the capabilities the application needs is done via the `supportsSession` call, which takes a dictionary of the desired functionality and returns a promise which resolves if the device can create a session which supporting those properties and rejects otherwise. Querying for support this way is necessary because it allows the application to detect what VR features are available without actually engaging the sensors or beginning presentation, which can incur significant power or performance overhead on some systems and may have side effects such as launching a VR status tray or storefront.

In the following examples we will focus on using exclusive sessions, and cover non-exclusive session use in the [`Advanced Functionality`](#non-exclusive-sessions-magic-windows) section. With that in mind, we ask here if the `VRDevice` supports sessions with `exclusive` access (the default), since we want the ability to display imagery on the headset.

```js
async function onVRAvailable() {
  // Most (but not all) VRDevices are capable of granting exclusive access to
  // the device, which is necessary to show imagery in a headset. If the device
  // has that capability the page will want to add an "Enter VR" button (similar
  // to "Enter Fullscreen") that triggers the page to begin showing imagery on
  // the headset.
  vrDevice.supportsSession({ exclusive: true }).then(() => {
    var enterVrBtn = document.createElement("button");
    enterVrBtn.innerHTML = "Enter VR";
    enterVrBtn.addEventListener("click", beginVRSession);
    document.body.appendChild(enterVrBtn);
  }).catch((reason) => {
    console.log("Session not supported: " + reason);
  });
}
```

### Beginning a VR session

Clicking the "Enter VR" button in the previous sample will attempt to acquire a `VRSession` by callling `VRDevice`'s `requestSession()` method. This returns a promise that resolves to a `VRSession` upon success. When requesting a session, the capabilities that the returned session must have are passed in via a dictionary, exactly like the `supportsSession` call. If `supportsSession` resolved for a given dictionary, then calling `requestSession` with the same dictionary values should be reasonably expected to succeed, barring external factors (such as `requestSession` not being called in a user gesture for an exclusive session.) The UA is ultimately responsible for determining if it can honor the request.

```js
function beginVRSession() {
  // VRDevice.requestSession must be called within a user gesture event
  // like click or touch when requesting exclusive access.
  vrDevice.requestSession({ exclusive: true })
      .then(onSessionStarted)
      .catch(err => {
        // May fail for a variety of reasons. Probably just want to
        // render the scene normally without any tracking at this point.
        window.requestAnimationFrame(onDrawFrame);
      });
}
```
Once the session has started, some setup must be done to prepare for rendering.
- A `VRFrameOfReference` must be created to define the coordinate system in which the `VRDevicePose` objects will be defined. See the Advanced Functionality section for more details about frames of reference.
- The depth range of the session should be set to something appropriate for the application. This range will be used in the construction of the projection matricies provided by `VRPresentationFrame`.
- A `VRLayer` must be created and assigned to the `VRSession`'s `baseLayer` attribute. (`baseLayer` because future versions of the spec will likely enable multiple layers, at which point this would act like the `firstChild` attribute of a DOM element.)

```js
let vrSession = null;
let vrFrameOfRef = null;

function onSessionStarted(session) {
  // Store the session for use later.
  vrSession = session;

  // The depth range of the scene should be set so that the projection
  // matrices returned by the session are correct.
  vrSession.depthNear = 0.1;
  vrSession.depthFar = 100.0;

  // The `VRFrameOfReference` provides the coordinate system in which
  // `getViewMatrix()` and the `poseModelMatrix` are defined. For more
  // information on this see the `Advanced functionality` section
  vrSession.requestFrameOfReference("headModel")
    .then((frameOfRef) => {
      vrFrameOfRef = frameOfRef;
    })
    .then(setupWebGLLayer) // Create a compatible VRWebGLLayer.
    .then(() => {
      // Start the render loop
      vrSession.requestFrame(onDrawFrame);
    });
}
```

### Setting up a VRLayer

The content to present to the device is defined by a `VRLayer`. In the initial version of the spec only one layer type, `VRWebGLLayer`, is defined and only one layer can be used at a time. This is set via the `VRSession`'s `baseLayer` attribute. Future iterations of the spec will define new types of `VRLayer`s. For example: a new layer type would be added to enable use with any new graphics APIs that get added to the browser. The ability to use multiple layers at once and have them composited by the UA will likely also be added in a future API revision.

In order for a WebGL canvas to be used with a `VRWebGLLayer`, its context must be _compatible_ with the `VRDevice`. This can mean different things for different environments. For example, on a desktop computer this may mean the context must be created against the graphics adapter that the `VRDevice` is physically plugged into. On most mobile devices though, that's not a concern and so the context will always be compatible. In either case, the WebVR application must take steps to ensure WebGL context compatibility before using it with a `VRWebGLLayer`.

When it comes to ensuring canvas compatibility there's two broad categories that apps will fall under.

**VR Enhanced:** The app can take advantage of VR, but it's used as a progressive enhancement rather than a core part of the experience. Most users will probably not interact with the app's VR features, and as such asking them to make VR-centric decisions early in the app lifetime would be confusing and inappropriate. An example would be a news site with an embedded 360 photo gallery or video. (We expect the large majority of early WebVR content to fall into this category.)

This style of application should call `WebGLRenderingContextBase`'s `setCompatibleVRDevice()` method with the `VRDevice` in question. This will set a compatibility bit on the context that allows it to be used. Contexts without the compatibility bit will fail when attempting to create a `VRLayer` with them. In the event that a context is not already compatible with the `VRDevice` the [context will be lost and attempt to recreate itself](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13) using the compatible graphics adapter. It is the page's responsibility to handle WebGL context loss properly, recreating any necessary WebGL resources in response. If the context loss is not handled by the page, the promise returned by `setCompatibleVRDevice` will fail. The promise may also fail for a variety of other reasons, such as the context being actively used by a different, incompatible `VRDevice`.

```js
let glCanvas = document.createElement("canvas");
let gl = glCanvas.getContext("webgl");

function setupWebGLLayer() {
  // Make sure the canvas context we want to use is compatible with the device.
  return gl.setCompatibleVRDevice(vrDevice).then(() => {
    // The content that will be shown on the device is defined by the session's
    // baseLayer.
    vrSession.baseLayer = new VRWebGLLayer(vrSession, gl);
  });
}
```

**VR Centric:** The app's primary use case is VR, and as such it doesn't mind initializing resources in a VR-centric fashion, which may include asking users to select a headset as soon as the app starts. An example would be a game which is dependent on VR presentation and input. These types of applications can to avoid the need to call `setCompatibleVRDevice` and the possible context loss that it may trigger by passing the `VRDevice` that the context will be used with as a context creation argument.

```js
let gl = glCanvas.getContext("webgl", { compatibleVRDevice: vrDevice });
```

Ensuring context compatibility with a `VRDevice` through either method may have side effects on other graphics resources in the page, such as causing the entire user agent to switch from rendering using an integrated GPU to a discreet GPU.

### Main render loop

WebVR provides information about the current frame to be rendered via the `VRPresentationFrame` object which developers must examine each frame. The `VRDevicePose` contains the informaton about all views which must be rendered and targets into which this rendering must be done.

`VRWebGLLayer` objects are not updated automatically. To present new frames, developers must use `VRSession`'s `requestFrame()` method. When the callback function is run, it passes fresh rendering data that must be used to draw into the `VRWebGLLayer`'s `framebuffer` during the callback. This framebuffer is created by the UA and behaves similarly to a canvas's default framebuffer. Using framebufferTexture2D, framebufferRenderbuffer, getFramebufferAttachmentParameter, and getRenderbufferParameter will all generate an INVALID_OPERATION error. Additionally, attempting to render to this framebuffer outside of the `requestFrame()` callback will generate an INVALID_OPERATION error. 

Once drawn to, the VR device will continue displaying the contents of the `VRWebGLLayer` framebuffer, potentially reprojected to match head motion, regardless of whether or not the page continues processing new frames. Potentially future spec iterations could enable additional types of layers, such as video layers, that could automatically be synchronized to the device's refresh rate.

To get view matrices or the `poseModelMatrix` for each presentation frame, developers must call `getDevicePose()` and provide a `VRCoordinateSystem` to specify the coordinate system in which these matrices should be defined. Unless the "headModel" `VRFrameOfReference` is being used, this function is not guaranteed to return a value. For example, the most common frame of reference, "eyeLevel", will fail to return a viewMatrix or a poseModelMatrix under tracking loss conditions. In that case, the page will need to decide how to respond. It may wish to re-render the scene using an older pose, fade the scene out to prevent disorientation, fall back to a "headModel" `VRFrameOfReference`, or simply not update. For more information on this see the [`Advanced functionality`](#orientation-only-tracking) section.

```js
function onDrawFrame(vrFrame) {
  // Do we have an active session?
  if (vrSession) {
    let pose = vrFrame.getDevicePose(vrFrameOfRef);
    gl.bindFramebuffer(vrSession.baseLayer.framebuffer);

    for (let view in vrFrame.views) {
      let viewport = view.getViewport(vrSession.baseLayer);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      drawScene(view, pose);
    }

    // Request the next VR callback
    vrSession.requestFrame(onDrawFrame);
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

The UA may temporarily "suspend" a session at any time. While suspended a session has restricted or throttled access to the `VRDevice` state and may process frames slowly or not at all. Suspended sessions can be resonably be expected to be resumed at some point, usually when the user has finished performing whatever action triggered the suspension in the first place.

The UA may suspend a session if allowing the page to continue reading the headset position represents a security or privacy risk (like when the user is entering a password or URL with a virtual keyboard, in which case the head motion may infer the user's input), or if other content is obscuring the page's output. Additionally, non-exclusive sessions are suspended while an exclusive session is active.

While suspended the page may either refresh the vr device at a slower rate or not at all, and poses queried from the device may be less accurate. If the user is wearing a headset the UA is expected to present a tracked environment (a scene which remains responsive to user's head motion) when the page is being throttled to prevent user discomfort.

The application should continue requesting and drawing frames while suspended, but should not depend on them being processed at the normal VR hardware device framerate. The UA may use these frames as part of it's tracked environment or page composition, though they may be partially occluded, blurred, or otherwise manipulated. Additionally, poses queried while the session is suspended may not accurately reflect the VR hardware device's physical pose.

Some applications may wish to respond to session suspension by halting game logic, purposefully obscuring content, or pausing media. To do so, the application should listen for the `blur` and `focus` events from the `VRSession`. For example, a 360 media player would do this to pause the video/audio whenever the UA has obscured it.

```js
vrSession.addEventListener('blur', vrSessionEvent => {
  pauseMedia();
  // Allow the render loop to keep running, but just keep rendering the last frame.
  // Render loop may not run at full framerate.
});

vrSession.addEventListener('focus', vrSessionEvent => {
  resumeMedia();
});
```

### Ending the VR session

A `VRSession` is "ended" when it is no longer expected to be used. An ended session object becomes detached and all operations on the object will fail. Ended sessions cannot be restored, and if a new active session is needed it must be requested from `VRDevice.requestSession()`.

To manually end a session the application calls `VRSession`'s `end()` method. This returns a promise that, when resolved, indicates that presentation to the VR hardware device by that session has stopped. Once the session has ended any continued animation the application's requires should be done using `window.requestAnimationFrame()`.

```js
function endVRSession() {
  // Do we have an active session?
  if (vrSession) {
    // End VR mode now.
    vrSession.end().then(onSessionEnd);
  }
}

// Restore the page to normal after exclusive access has been released.
function onSessionEnd() {
  vrSession = null;

  // Ending the session stops executing callbacks passed to requestFrame().
  // To continue rendering, use the window's AnimationFrame callback
  window.requestAnimationFrame(onDrawFrame);
}
```

The UA may end a session at any time for a variety of reasons. For example: The user may forcibly end presentation via a gesture to the UA, other native applications may take exclusive access of the VR hardware device, or the VR hardware device may become disconnected from the system. Well behaved applications should monitor the `end` event on the `VRSession` to detect when that happens.

```js
vrSession.addEventListener('end', onSessionEnd);
```

If the UA needs to halt use of a session temporarily the session should be suspended instead of ended. (See previous section.)

## Rendering to the Page

There are a couple of scenarios in which developers may want to present content rendered with the WebVR API on the page instead of (or in addition to) a headset: Mirroring and "Magic Window". Both methods display WebVR content on the page via a Canvas element with a `VRPresentationContext`. Like a `WebGLRenderingContext`, developers acquire a `VRPresentationContext` by calling the `HTMLCanvasElement` or `OffscreenCanvas` `getContext()` method with the context id of "vrpresent". The returned `VRPresentationContext` is permenantly bound to the canvas.

A `VRPresentationContext` can only be supplied imagery by a `VRSession`, though the exact behavior depends on the scenario in which it's being used.

### Mirroring

On desktop devices, or any device which has an external display connected to it, it's frequently desirable to show what the user in the headset is seeing on the exernal display. This is usually referred to as mirroring.

In order to mirror WebVR content to the page, developers provide a `VRPresentationContext` as the `outputContext` in the `VRSessionCreationOptions` of an exclusive session. Once the session has started any content displayed on the headset will then be mirrored into the canvas associated with the `outputContext`. The `outputContext` remains bound to the session until the session has ended, and cannot be used with multiple `VRSession`s simultaneously.

When mirroring only one eye's content will be shown, and it should be shown without any distortion to correct for headset optics. The UA may choose to crop the image shown, display it at a lower resolution than originally rendered, and the mirror may be multiple frames behind the image shown in the headset. The mirror may include or exclude elements added by the underlying VR system (such as visualizations of room boundaries) at the UA's discretion. Pages should not rely on a particular timing or presentation of mirrored content, it's really just for the benefit of bystanders or demo operators.

The UA may also choose to ignore the `outputCanvas` on systems where mirroring is inappropriate, such as devices without an external display to mirror to like mobile or all-in-one systems.

```js
function beginVRSession() {
  let mirrorCanvas = document.createElement('canvas');
  let mirrorCtx = mirrorCanvas.getContext('vrpresent');
  document.body.appendChild(mirrorCanvas);

  vrDevice.requestSession({ exclusive: true, outputContext: mirrorCtx })
      .then(onSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

### Non-exclusive sessions ("Magic Windows")

There are several scenarios where it's beneficial to render a scene whose view is controlled by device tracking within a 2D page. For example:

 - Using phone rotation to view panoramic content.
 - Taking advantage of 6DoF tracking on devices (like [Tango](https://get.google.com/tango/) phones) with no associated headset.
 - Making use of head-tracking features for devices like [zSpace](http://zspace.com/) systems.

These scenarios can make use of non-exclusive sessions to render tracked content to the page. While `deviceorientation` events can be used to facilitate the first case the other two need the additional tracking support that WebVR provides. Also, using a non-exclusive session also enables content to use a single rendering path for both magic window and VR presentation modes and makes switching between magic window content and VR presentation of that content easier.

Similar to mirroring, to make use of this mode a `VRPresentationContext` is provided as the `outputContext` at session creation time with a non-exclusive session. At that point content rendered to the `VRSession`'s `baseLayer` will be rendered to the canvas associated with the `outputContext`. The UA is also allowed to composite in additional content if desired. In the future, if multiple `VRLayers` are used their composited result will be what is displayed in the `outputContext`. Requests to create a non-exclusive session without an output context will be rejected.

Exclusive and non-exclusive sessions can use the same render loop, but there are some differences in behavior to be aware of. The sessions may run their render loops at at different rates. During exclusive sessions the UA runs the rendering loop at the `VRDevice`'s native refresh rate. During non-exclusive sessions the UA runs the rendering loop at the refresh rate of page (aligned with `window.requestAnimationFrame`.) The method of computation of `VRView` projection and view matrices also differs between exclusive and non-exclusive sessions, with non-exclusive sessions taking into account the output canvas dimensions and possibly the position of the users head in relation to the canvas if that can be determined.

Most instances of non-exclusive sessions will only provide a single `VRView` to be rendered, but UA may request multiple views be rendered if, for example, it's detected that that output medium of the page supports stereo rendering. As a result pages should always draw every `VRView` provided by the `VRPresentationFrame` regardless of what type of session has been requested.

UAs may have different restrictions on non-exclusive contexts that don't apply to exclusive contexts. For instance, a different set of `VRFrameOfReference` types may be available with a non-exclusive session versus an exclusive session.

```js
let magicWindowCanvas = document.createElement('canvas');
let magicWindowCtx = magicWindowCanvas.getContext('vrpresent');
document.body.appendChild(magicWindowCanvas);

function beginMagicWindowVRSession() {
  // Request a non-exclusive session for magic window rendering.
  vrDevice.requestSession({ outputContext: magicWindowCtx })
      .then(OnSessionStarted)
      .catch((reason) => { console.log("requestSession failed: " + reason); });
}
```

The UA may reject requests for a non-exclusive sessions for a variety of reasons, such as the inability of the underlying hardware to provide tracking data without actively rendering to the device. Pages should be designed to robustly handle the inability to acquire non-exclusive sessions. 'VRDevice.supportsSession()` can be used if a page wants to test for non-exclusive session support before attempting to create the `VRSession`.

```js
function checkMagicWindowSupport() {
  // Check to see if the UA can support a non-exclusive sessions with the given output context.
  return vrDevice.supportsSession({ outputContext: magicWindowCtx })
      .then(() => { console.log("Magic Window content is supported!"); })
      .catch((reason) => { console.log("Magic Window content is not supported: " + reason); });
}
```

## Advanced functionality

Beyond the core APIs described above, the WebVR API also exposes several options for taking greater advantage of the VR hardware's capabilities.

### Orientation-only tracking

A viewer for 360 photos or videos should not respond to head translation, since the source material is intended to be viewed from a single point. While some headsets naturally function this way (Daydream, Gear VR, Cardboard) it can be useful for app developers to specify that they don't want any positional tracking in the matrices they receive. (This may also provide power savings on some devices, since it may allow some sensors to be turned off.) That can be accomplished by requesting a "headModel" `VRFrameOfReference`.

```js
vrSession.requestFrameOfReference("headModel").then((frameOfRef) => {
  vrFrameOfRef = frameOfRef;
});

// Use vrFrameOfRef as detailed above.
```

### Room-scale tracking and boundaries

Some VR devices have been configured with details about the area they are being used in, including things like where the floor is and what boundaries of the safe space is so that it can be communicated to the user in VR. It can be beneficial to render the virtual scene so that it lines up with the users physical space for added immersion, especially ensuring that the virtual floor and the physical floor align. This is frequently called "room scale" or "standing" VR. It helps the user feel grounded in the virtual space. WebVR refers to this type of bounded, floor relative play space as a "stage". Applications can take advantage of that space by creating a stage `VRFrameOfReference`. This will report values relative to the floor, ideally at the center of the room. (In other words the users physical floor is at Y = 0.) Not all `VRDevices` will support this mode, however. `requestFrameOfReference` will reject the promise in that case.

```js
// Try to get a frame of reference where the floor is at Y = 0
vrSession.requestFrameOfReference("stage").then((frameOfRef) => {
  vrFrameOfRef = frameOfRef;
}).catch((err) => {
  // "stage" VRFrameOfReference is not supported.

  // In this case the application will want to estimate the position of the
  // floor, perhaps by asking the user's height, and translate the reported
  // values upward by that distance so that the floor appears in approximately
  // the correct position.
  vrSession.requestFrameOfReference("eyeLevel").then((frameOfRef) => {
    vrFrameOfRef = frameOfRef;
  });
});

// Use vrFrameOfRef as detailed above, but render the floor of the virtual space at Y = 0;
```

When using a stage `VRFrameOfReference` the device will frequently have a configured "safe area" that the user can move around in without fear of bumping into real world objects. WebVR can communicate the rough boundaries of this space via the `VRFrameOfReference.bounds` attribute. It provides a polygonal boundary given in the 'geometry' point array, which represents a loop of points at the edges of the safe space. The points are given in a clockwise order as viewed from above, looking towards the negative end of the Y axis. The shape it describes is not guaranteed to be convex. The values reported are relative to the stage origin, but do not necessarily contain it. The `bounds` attribute is null if the bounds are unavailable for the current frame of reference.

If the `bounds` are available the application should try to ensure that all content the user needs to interact with can be reached while staying inside the described bounds geometry.

```js
// Demonstrated here using a fictional 3D library to simplify the example code.
function onBoundsUpdate() {
  if (vrFrameOfRef.bounds) {
    // Visualize the bounds geometry as 2 meter high quads
    boundsMesh.clear();
    let pointCount = vrFrameOfRef.bounds.geometry.length;
    for (let i = 0; i < pointCount - 1; ++i) {
      let pointA = vrFrameOfRef.bounds.geometry[i];
      let pointB = vrFrameOfRef.bounds.geometry[i+1];
      boundsMesh.addQuad(
          pointA.x, 0, pointA.z, // Quad Corner 1
          pointB.x, 2.0, pointB.z) // Quad Corner 2
    }
    // Close the loop
    let pointA = vrFrameOfRef.bounds.geometry[pointCount-1];
    let pointB = vrFrameOfRef.bounds.geometry[0];
    boundsMesh.addQuad(
          pointA.x, 0, pointA.z, // Quad Corner 1
          pointB.x, 2.0, pointB.z) // Quad Corner 2
  } else {
    // No bounds geometry to visualize
    boundsMesh.clear();
  }
}
```

Changes to the bounds while a session is active should be a relatively rare occurance, but it can be monitored by listening for the frame of reference's `boundschange` event.

```js
vrFrameOfRef.addEventListener('boundschange', onBoundsUpdate);
```

### Multiview rendering

Developers may optionally take advantage of the [WEBGL_multiview extension](https://www.khronos.org/registry/webgl/extensions/proposals/WEBGL_multiview/) to both WebGL 1.0 and WebGL 2.0 for optimized multiview rendering. The UA may not honor this request (e.g. when the supplied context does not support this extension) and the `VRWebGLLayer` will fallback to using a framebuffer that is not multiview-aware. As such, developers must query the `VRWebGLLayer.multiview` property after the `VRWebGLLayer` is constructed and respond accordingly.

When `VRWebGLLayer.multiview` is false:
- The `VRWebGLLayer`'s `framebuffer` will be created in a side-by-side configuration.
- Calling `VRView.getViewport()` with this type of `VRWebGLLayer` will return a different `VRViewport` for each `VRView`.

When `VRWebGLLayer.multiview` is true:
- The UA may decide to back the framebuffer with a texture array, side-by-side texture or another implementation of the UA's choosing. This implementation decision must not have any impact how developers author their shaders or setup the WebGL context for rendering.
- Calling `VRView.getViewport()` with this type of `VRWebGLLayer` will return the same `VRViewport` for all `VRView`s.

```js
function setupWebGLLayer() {
  return gl.setCompatibleVRDevice(vrDevice).then(() => {
    // VRWebGLLayer allows for the optional use of the WEBGL_multiview extension
    vrSession.baseLayer = new VRWebGLLayer(vrSession, gl, { multiview: true });
  });
}

function onDrawFrame(vrFrame) {
  // Do we have an active session?
  if (vrSession) {
    let pose = vrFrame.getDevicePose(vrFrameOfRef);
    gl.bindFramebuffer(vrSession.baseLayer.framebuffer);

    if (vrSession.baseLayer.multiview) {
      // When using the `WEBGL_multiview` extension, all `VRView`s return the
      // same value from `getViewport()`, so it only needs to be called once.
      let viewport = vrFrame.views[0].getViewport(vrSession.baseLayer);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      drawMultiviewScene(vrFrame.views, pose);
    } else {
      for (let view in vrFrame.views) {
        let viewport = view.getViewport(vrSession.baseLayer);
        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
        drawScene(view, pose);
      }
    }

    // Request the next VR callback
    vrSession.requestFrame(onDrawFrame);

  } else {
    // No session available, so render a default mono view.
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    drawScene();

    // Request the next window callback
    window.requestAnimationFrame(onDrawFrame);
  }
}

function drawMultiviewScene(views, pose) {
  for (let view in views) {
    let viewMatrix = pose.getViewMatrix(view);
    let projectionMatrix = view.projectionMatrix;

    // Set uniforms as appropriate for shaders being used
  }

  // Draw Scene
}
```

### High quality rendering

While in exclusive sessions, the UA is responsible for providing a framebuffer that is correctly optimized for presentation to the `VRSession` in each `VRPresentationFrame`. Developers can optionally request either the buffer size or viewport size be scaled, though the UA may not respect the request. Even when the UA honors the scaling requests, the result is not guaranteed to be the exact percentage requested.

The first scaling mechanism is done by specifying a `framebufferScaleFactor` at `VRWebGLLayer` creation time. In response, the UA may create a framebuffer that is based on the requested percentage of the maximum size supported by the `VRDevice`. On some platforms such as Daydream, the UA may set the default value of `framebufferScaleFactor` to be less 1.0 for performance reasons. Developers explicitly wishing to use the full resolution on these devices can do so by requesting the `framebufferScaleFactor` be set to 1.0.

```js
function setupWebGLLayer() {
  return gl.setCompatibleVRDevice(vrDevice).then(() => {
    vrSession.baseLayer = new VRWebGLLayer(vrSession, gl, { framebufferScaleFactor: 0.8 });
  });
```

The second scaling mechanism is to request a scaled viewport into the `VRWebGLLayer`'s `framebuffer`. For example, under times of heavy load the developer may choose to temporarily render fewer pixels. To do so, developers should call `VRWebGLLayer.requestViewportScaling()` and supply a value between 0.0 and 1.0. The UA may then respond by changing the `VRWebGLLayer`'s `framebuffer` and/or the `VRViewport` values in future VR rendering frames. It is worth noting that the UA may change the viewports for reasons other than developer request, and that not all UAs will respect requested viewport changes; as such, developers must always query the viewport values on each VR rendering frame.

```js
function onDrawFrame() {
  // Draw the current frame

  // In response to a performance dip, request the viewport be restricted
  // to a percentage (ex: 50%) of the layer's actual buffer. This change
  // will apply to subsequent rendering frames
  layer.requestViewportScaling(0.5);

  // Register for next frame callback
  vrSession.requestFrame(onDrawFrame);
}
```

### Responding to a reset pose

Most VR systems have a mechanism for allowing the user to reset which direction is "forward." For security and comfort reasons the WebVR API has no mechanism to trigger a pose reset programatically, but it can still be useful to know when it happens. Pages may want to take advantage of the visual discontinuity to reposition the user or other elements in the scene into a more natural position for the new orientation. Pages may also want to use the opportunity to clear or reset any additional transforms that have been applied if no longer needed.

A page can be notified when a pose reset happens by listening for the 'resetpose' event from the 'VRSession'.

```js
vrSession.addEventListener('resetpose', vrSessionEvent => {
  // For an app that allows artificial Yaw rotation, this would be a perfect
  // time to reset that.
  resetYawTransform();
});
```

## Appendix A: I don’t understand why this is a new API. Why can’t we use…

### `DeviceOrientation` Events
The data provided by a `VRDevicePose` instance is similar to the data provided by `DeviceOrientationEvent`, with some key differences:

* It’s an explicit polling interface, which ensures that new input is available for each frame. The event-driven `DeviceOrientation` data may skip a frame, or may deliver two updates in a single frame, which can lead to disruptive, jittery motion in a VR application.
* `DeviceOrientation` events do not provide positional data, which is a key feature of high-end VR hardware.
* More can be assumed about the intended use case of `VRDevice` data, so optimizations such as motion prediction can be applied.
* `DeviceOrientation` events are typically not available on desktops.

That being said, however, for some simple VR devices (e.g., Cardboard) `DeviceOrientation` events provide enough data to create a basic [polyfill](https://en.wikipedia.org/wiki/Polyfill) of the WebVR API, as demonstrated by [Boris Smus](https://twitter.com/borismus)’ wonderful [`webvr-polyfill` project](https://github.com/borismus/webvr-polyfill). This provides an approximation of a native implementation, allowing developers to experiment with the API even when unsupported by the user’s browser. While useful for testing and compatibility, such pure-JavaScript implementations miss out on the ability to take advantage of VR-specific optimizations available on some mobile devices (e.g., Google Daydream-ready phones or Samsung Gear VR’s compatible device lineup). A native implementation on mobile can provide a much better experience with lower latency, less jitter, and higher graphics performance than can a `DeviceOrientation`-based one.

### WebSockets
A local [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) service could be set up to relay headset poses to the browser. Some early VR experiments with the browser tried this route, and some non-VR tracking devices (most notably [Leap Motion](https://www.leapmotion.com/)) have built their JavaScript SDKs around this concept. Unfortunately, this has proven to be a high-latency route. A key element of a good VR experience is low latency. Ideally, the movement of your head should result in an update on the device (referred to as “motion-to-photons time”) in 20ms or fewer. The browser’s rendering pipeline already makes hitting this goal difficult, and adding additional overhead for communication over WebSockets only exaggerates the problem. Additionally, using such a method requires users to install a separate service, likely as a native app, on their machine, eroding away much of the benefit of having access to the hardware via the browser. It also falls down on mobile where there’s no clear way for users to install such a service.

### The Gamepad API
Some people have suggested that we try to expose VR headset data through the [Gamepad API](https://w3c.github.io/gamepad/), which seems like it should provide enough flexibility through an unbounded number of potential axes. While it would be technically possible, there are a few properties of the API that currently make it poorly suited for this use.

* Axes are normalized to always report data in a `[-1, 1]` range. That may work sufficiently for orientation reporting, but when reporting position or acceleration, you would have to choose an arbitrary mapping of the normalized range to a physical one (i.e., `1.0` is equal to 2 meters or similar). But that forces developers to make assumptions about the capabilities of future VR hardware, and the mapping makes for error-prone and unintuitive interpretation of the data.
* Axes are not explicitly associated with any given input, making it difficult for users to remember if axis `0` is a component of devices’ position, orientation, acceleration, etc.
* VR device capabilities can differ significantly, and the Gamepad API currently doesn’t provide a way to communicate a device’s features and its optical properties.
* Gamepad features such as buttons have no clear meaning when describing a VR headset and its periphery.

There is a related effort to expose motion-sensing controllers through the Gamepad API by adding a `pose` attribute and some other related properties. Although these additions would make the API more accommodating for headsets, we feel that it’s best for developers to have a separation of concerns such that devices exposed by the Gamepad API can be reasonably assumed to be gamepad-like and devices exposed by the WebVR API can be reasonably assumed to be headset-like.

### These alternatives don’t account for presentation
It’s important to realize that all of the alternative solutions offer no method of displaying imagery on the headset itself, with the exception of Cardboard-like devices where you can simply render a fullscreen split view. Even so, that doesn’t take into account how to communicate the projection or distortion necessary for an accurate image. Without a reliable presentation method the ability to query inputs from a headset becomes far less valuable.

## Appendix B: Proposed IDL

```webidl
//
// Navigator
//

partial interface Navigator {
  readonly attribute VR vr;
};

interface VR : EventTarget {
  attribute EventHandler ondeviceconnect;
  attribute EventHandler ondevicedisconnect;

  Promise<sequence<VRDevice>> getDevices();
};

//
// Device
//

interface VRDevice : EventTarget {
  readonly attribute DOMString deviceName;
  readonly attribute boolean isExternal;

  Promise<void> supportsSession(optional VRSessionCreationOptions parameters);
  Promise<VRSession> requestSession(optional VRSessionCreationOptions parameters);
};

//
// Session
//

dictionary VRSessionCreationOptions {
  boolean exclusive = false;
  VRPresentationContext outputContext;
};

interface VRSession : EventTarget {
  readonly attribute VRDevice device;
  readonly attribute boolean exclusive;
  readonly attribute VRPresentationContext outputContext;

  attribute double depthNear;
  attribute double depthFar;

  attribute VRLayer baseLayer;

  attribute EventHandler onblur;
  attribute EventHandler onfocus;
  attribute EventHandler onresetpose;
  attribute EventHandler onend;

  Promise<VRFrameOfReference> requestFrameOfReference(VRFrameOfReferenceType type);

  long requestFrame(VRFrameRequestCallback callback);
  void cancelFrame(long handle);

  Promise<void> end();
};

callback VRFrameRequestCallback = void (VRPresentationFrame frame);

//
// Frame, Device Pose, and Views
//

interface VRPresentationFrame {
  readonly attribute VRSession session;
  readonly attribute FrozenArray<VRView> views;

  VRDevicePose? getDevicePose(VRCoordinateSystem coordinateSystem);
};

enum VREye {
  "left",
  "right"
};

interface VRView {
  readonly attribute VREye eye;
  readonly attribute Float32Array projectionMatrix;

  VRViewport? getViewport(VRLayer layer);
};

interface VRViewport {
  readonly attribute long x;
  readonly attribute long y;
  readonly attribute long width;
  readonly attribute long height;
};

interface VRDevicePose {
  readonly attribute Float32Array poseModelMatrix;

  Float32Array getViewMatrix(VRView view);
};

//
// Layers
//

interface VRLayer {};

dictionary VRWebGLLayerInit {
  boolean antialias = true;
  boolean depth = true;
  boolean stencil = false;
  boolean alpha = true;
  boolean multiview = false;
  [EnforceRange] double framebufferScaleFactor;
};

typedef (WebGLRenderingContext or
         WebGL2RenderingContext) VRWebGLRenderingContext;

[Constructor(VRSession session,
             VRWebGLRenderingContext context,
             optional VRWebGLLayerInit layerInit)]
interface VRWebGLLayer : VRLayer {
  readonly attribute VRWebGLRenderingContext context;
  readonly attribute boolean antialias;
  readonly attribute boolean depth;
  readonly attribute boolean stencil;
  readonly attribute boolean alpha;
  readonly attribute boolean multiview;

  readonly attribute unsigned long framebufferWidth;
  readonly attribute unsigned long framebufferHeight;
  readonly attribute WebGLFramebuffer framebuffer;

  void requestViewportScaling(double viewportScaleFactor);
};

//
// Coordinate Systems
//

interface VRCoordinateSystem : EventTarget {
  Float32Array? getTransformTo(VRCoordinateSystem other);
};

enum VRFrameOfReferenceType {
  "headModel",
  "eyeLevel",
  "stage",
};

interface VRFrameOfReference : VRCoordinateSystem {
  readonly attribute VRStageBounds? bounds;
  attribute EventHandler onboundschange;
};

interface VRStageBounds {
  readonly attribute FrozenArray<VRStageBoundsPoint> geometry;
};

interface VRStageBoundsPoint {
  readonly attribute double x;
  readonly attribute double z;
};

//
// Events
//

[Constructor(DOMString type, VRDeviceEventInit eventInitDict)]
interface VRDeviceEvent : Event {
  readonly attribute VRDevice device;
};

dictionary VRDeviceEventInit : EventInit {
  required VRDevice device;
};

[Constructor(DOMString type, VRSessionEventInit eventInitDict)]
interface VRSessionEvent : Event {
  readonly attribute VRSession session;
};

dictionary VRSessionEventInit : EventInit {
  required VRSession session;
};

[Constructor(DOMString type, VRCoordinateSystemEventInit eventInitDict)]
interface VRCoordinateSystemEvent : Event {
  readonly attribute VRCoordinateSystem coordinateSystem;
};

dictionary VRCoordinateSystemEventInit : EventInit {
  required VRCoordinateSystem coordinateSystem;
};

//
// WebGL
//
partial dictionary WebGLContextAttributes {
    VRDevice compatibleVRDevice = null;
};

partial interface WebGLRenderingContextBase {
    Promise<void> setCompatibleVRDevice(VRDevice device);
};

//
// RenderingContext
//
interface VRPresentationContext {
  readonly attribute HTMLCanvasElement canvas;
};
```
