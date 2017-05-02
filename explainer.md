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

[`navigator.vr.getDevices`](https://w3c.github.io/webvr/#navigator-getvrdevices-attribute) returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves to a list of available devices. Each [`VRDevice`](https://w3c.github.io/webvr/#interface-vrdevice) represents a physical unit of VR hardware that can present imagery to the user somehow. On desktops this will usually be a headset peripheral; on mobile devices it may represent the device itself in conjunction with a viewer harness (e.g., Google Cardboard or Samsung Gear VR). It may also represent devices without stereo presentation capabilities but more advanced tracking, such as Tango devices.

```js
let vrDevice = null;

navigator.vr.getDevices().then(devices => {
  if (devices.length > 0) {
    // Use the first device in the array if one is available. If multiple
    // devices are present, you may want to provide the user a way of choosing
    // which device to use.
    vrDevice = devices[0];
    OnVRAvailable();
  } else {
    // Could not find any VR hardware connected.
  }
}, err => {
  // An error occurred querying VR hardware. May be the result of blocked
  // permissions by a parent frame.
});
```
### Detecting and advertising VR mode

If a VRDevice is available and has the appropriate capabilities the page will usually want to add some UI to trigger activation of "VR Presentation Mode", where the page can begin sending imagery to the device. Testing to see if the device supports the capabilities the page needs is done via the `supportsSession` call, which takes a dictionary of the desired functionality and returns whether or not the device can create a session supporting them. Querying for support this way is necessary because it allows the application to detect what VR features are available without actually engaging the sensors or beginning presentation, which can incur significant power or performance overhead on some systems and may have side effects such as launching a VR status tray or storefront.

In this case, we only ask if the ability to have `exclusive` access (Which includes the ability to display imagery on the headset). Note that `exclusive: true` is actually the dictionary default, and so does not need to be specified here. It’s made explicit in this example for clarity.

```js
async function OnVRAvailable() {
  // Most (but not all) VRDevices are capable of granting exclusive access to
  // the device, which is necessary to show imagery in a headset. If the device
  // has that capability the page will want to add an "Enter VR" button (similar
  // to "Enter Fullscreen") that triggers the page to begin showing imagery on
  // the headset.
  let exclusiveMode = await vrDevice.supportsSession({ exclusive: true });
  if (exclusiveMode) {
    var enterVrBtn = document.createElement("button");
    enterVrBtn.innerHTML = "Enter VR";
    enterVrBtn.addEventListener("click", BeginVRSession());
    document.body.appendChild(enterVrBtn);
  }
}
```

### Beginning a VR session

Clicking that button will attempt to initiate a [`VRSession`](https://w3c.github.io/webvr/#interface-vrsession), which manages input and output for the display. When creating a session with `VRDevice.requestSession` the capabilities that the returned session must have are passed in via a dictionary, exactly like the `supportsSession` call. If `supportsSession` returned true for a given dictionary then calling `requestSession` with the same dictionary values should be reasonably expected to succeed, barring external factors (such as `requestSession` not being called in a user gesture for an exclusive session or another page currently having an exclusive session for the same device.)

The page may also want to create a session that doesn't need exclusive access to the device for tracking purposes. Since the `VRSession` is also what provides access to the device's position and orientation data requesting a non-exclusive session enables what's referred to as "Magic Window" use cases, where the scene is rendered on the page normally but is responsive to device movement. This is especially useful for mobile devices, where moving the device can be used to look around a scene. Devices with Tango tracking capabilities may also expose 6DoF tracking this way, even when the device itself is not capable of stereo presentation.

Requesting a new type of session will end any previously active ones.

```js
function BeginVRSession(isExclusive) {
  // VRDevice.requestSession must be called within a user gesture event
  // like click or touch when requesting exclusive access.
  vrDevice.requestSession({ exclusive: isExclusive })
      .then(OnSessionStarted)
      .catch(err => {
        // May fail for a variety of reasons, including another page already
        // having exclusive access to the device. Probably just want to render
        // the scene normally without any tracking at this point.
        window.requestAnimationFrame(OnDrawFrame);
      });
}
```

Once the session is started some setup must be done to prepare for rendering. The content to present to the device is defined by a [`VRLayer`](https://w3c.github.io/webvr/#interface-vrlayer). In the initial version of the spec only one layer type, `VRCanvasLayer`, is defined and only one layer can be used at a time. This is set via the `VRSession.baseLayer` attribute. (`baseLayer` because future versions of the spec will likely enable multiple layers, at which point this would act like the `firstChild` attribute of a DOM element.)

In order for a canvas to be used with a WebVR layer, it's context must be _compatible_ with the `VRDevice`. This can mean different things for different environments. For example, on a desktop computer this means that the context should be created against the graphics adapter that the `VRDevice` is physically plugged into. On most mobile devices though, that's not a concern and so the context will always be compatible. In either case, the WebVR application should call `VRDisplay.ensureContextCompatibility` with the WebGL context before using it with a `VRLayer`. This will set a compatibility bit on the context that allows it to be used. Contexts without the compatibility bit will fail when attempting to create a `VRLayer` with them.

In the event that a context is not already compatible with the `VRDisplay` the [context will be lost and attempt to recreate itself](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13) using the compatible graphics adapter. The page must handle WebGL context creation loss properly for this to work. If the context loss is not properly handled the promise returned by `ensureContextCompatibility` will fail.

```js
// Initially only canvases with WebGL contexts will be supported.
let glCanvas = document.createElement("canvas");
let gl = glCanvas.getContext("webgl");

let vrSession = null;
let vrLayer = null;

function OnSessionStarted(session) {
  // Store the session for use later.
  vrSession = session;

  if (vrSession.createParameters.exclusive) {
    // In order to ensure the canvas renders at an appropriate size for the
    // device the preferred canvas size should be queried from the session.
    let sourceProperties = vrSession.getSourceProperties();
    glCanvas.width = sourceProperties.width;
    glCanvas.height = sourceProperties.height;
  }

  // The depth range of the scene should be set so that the projection
  // matrices returned by the session are correct.
  vrSession.depthNear = 0.1;
  vrSession.depthFar = 100.0;

  // Make sure the canvas context we want to use is compatible with the device.
  vrDevice.ensureContextCompatibility(gl).then(() => {
    // The content that will be shown on the device is defined by the session's
    // baseLayer. In non-exclusive The baseLayer is not used for presentation, but
    // the canvas dimensions are used to construct the projection matrices.
    vrLayer = new VRCanvasLayer(vrSession, glCanvas);
    vrSession.baseLayer = vrLayer;

    // Start the render loop
    vrSession.commit().then(OnFirstVRFrame);
  });
}
```

Alternately, to avoid the need to call `ensureContextCompatibility` and the possible context loss that it may trigger, if the developer knows which `VRDevice` a context will be used with when the context is created it can be passed in as a context creation argument.

```js
let gl = glCanvas.getContext("webgl", { compatibleVrDevice: vrDevice });
```

### Main render loop

WebVR provides tracking information via the [`VRSession.getDevicePose`](https://w3c.github.io/webvr/#dom-vrsession-getdevicepose) method, which developers can poll each frame to get the view and projection matrices for each eye. The matrices provided by the [`VRDevicePose`](https://w3c.github.io/webvr/#interface-vrdevicepose) can be used to render the appropriate viewpoint of the scene for both eyes.

In order to poll the pose, developers must indicate what frame of reference should be used, which determines what the returned pose is relative to. This is supplied as a `VRFrameOfReference` object, which can be created once a `VRSession` has been acquired. The most common type is an "eyeLevel" frame of referencem which indicates that the headsets orientation and position are reported relative to the first sensor readings received from the device (or the last time the user manually reset the orientation.)

```js
let vrFrameOfRef = null;

async function OnFirstVRFrame() {
  // The Frame of Reference indicates what the matrices and coordinates the
  // VRDevice returns are relative to. An "eyeLevel" VRFrameOfReference reports
  // values relative to the orientation and position where the device first
  // began tracking.
  vrFrameOfRef = await vrSession.createFrameOfReference("eyeLevel");

  OnDrawFrame();
}
```

Unless a ["headModel"](#orientation-only-tracking) Frame of Reference is being used, the session is not guaranteed to return a pose. (It may have lost tracking, for instance.) In that case the app will need to decide how to respond. It may wish to re-render the scene using an older pose, fade the scene out to prevent disorientation, fall back to a headModel Frame of Reference, or simply not update.

The UA maintains a VR compositor behind the scenes that is always active during an exclusive session. It runs a tight rendering loop, presenting the imagery defined by the session's layers to the VR device at as close to the device's native framerate as possible. Potentially future spec iterations could enable video layers that would automatically be synchronized to the compositor, but images from a canvas layer are not updated automatically. Once rendering is complete [`VRCanvasLayer.commit`](https://w3c.github.io/webvr/#dom-vrcanvaslayer-commit) must be called to send the current contents of the canvas backbuffer to the VR compositor. The compositor will continue presenting that content to the user, reprojected, each frame until a new one is provided via `commit`.

`VRCanvasLayer.commit` returns a promise, which resolves when the VR compositor is ready draw a new frame. This enables it to act as an analog for requestAnimationFrame which runs at the device's refresh rate. If the layer's source is not dirty when `commit()` is called no new imagery is sent to the compositor but a valid promise is still returned. If `commit()` is called on a canvas layer multiple times in the course of a single frame only the image from the first commit is used, and the subsequent ones are discarded but a valid promise is still returned.

Calling `commit()` on a layer attached to an exclusive session has the same effect on the canvas as normal composition within the page. If the WebGL context was created with `preserveDrawingBuffer: false` the canvas contents will be discarded. When used with a non-exclusive session `commit()` doesn't alter the source canvas contents, but the promise for the next frame is still returned. Frame promises returned by a non-exclusive session resolve at the same rate as `window.requestAnimationFrame` callbacks.

```js
function OnDrawFrame() {
  // Do we have an active session?
  if (vrSession) {
    let pose = vrSession.getDevicePose(vrFrameOfRef);

    // Only render if a new pose is available
    if (pose) {
      // Do we have exclusive access to the device? If so draw the in stereo.
      if (vrSession.createParameters.exclusive) {
        // Draw the left eye's view to the left half of the canvas.
        gl.viewport(0, 0, glCanvas.width*0.5, glCanvas.height);
        drawScene(pose.leftProjectionMatrix, pose.leftViewMatrix);

        // Draw the right eye's view to the right half of the canvas.
        gl.viewport(glCanvas.width*0.5, 0, glCanvas.width*0.5, glCanvas.height);
        drawScene(pose.rightProjectionMatrix, pose.rightViewMatrix);
      } else {
        // If not an exclusive session, draw a tracked mono view of the scene.
        // Use only either the left or right matrices.
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        drawScene(pose.leftProjectionMatrix, pose.leftViewMatrix);
      }
    }

    // VRCanvasLayer.commit() indicates that rendering has completed and the
    // current canvas contents should be shown on the headest. This should
    // ideally be called immediately after the app is finished submitting draw
    // commands to reduce latency. The promise it returns resolves when the
    // frame has been submitted and the next frame is ready to be drawn, which
    // allows it to function as a requestAnimationFrame analog that runs at the
    // appropriate framerate for the output device (whether that's a VRDisplay
    // or the main monitor).
    vrLayer.commit().then(OnDrawFrame);
  } else {
    // No session available, so render a default mono view.
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    drawScene(defaultProjectionMatrix, defaultViewMatrix);

    window.requestAnimationFrame(OnDrawFrame);
  }
}
```

> **Note: Why have `VRCanvasLayer.commit()` instead of using `CanvasRenderingContext.commit()`?**
>
> While it's not included in the initial version of the feature we do intend to support multiple layers in a future iteration of WebVR. In that scenario it would be useful to have the same canvas bound to two different layers, since it would allow the same GL resources (meshes, textures, shaders) to be used when rendering both. The rendering pattern would then be:
>
> ```js
> let canvasLayerA = new VRCanvasLayer(session, canvas);
> let canvasLayerB = new VRCanvasLayer(session, canvas);
>
> // In the render loop
> drawLayerA(gl);
> canvasLayerA.commit();
> drawLayerB(gl);
> canvasLayerB.commit().then(OnDrawFrame);
> ```

### Ending the VR session

To stop presenting to the `VRDevice`, the page calls [`VRSession.endSession`](https://w3c.github.io/webvr/#dom-vrsession-endsession). Once the session has ended the page's animation loop should be started up again if necessary and any canvas used as a layer source should be resized to fit the page again.

```js
function EndVRSession() {
  // Do we have an active session?
  if (vrDevice.activeSession) {
    // End VR mode now.
    vrDevice.activeSession.endSession().then(OnSessionEnded);
  }
}

// Restore the page to normal after exclusive access has been released.
function OnSessionEnded() {
  // Restore the canvas to it's original resolution.
  glCanvas.width = defaultCanvasWidth;
  glCanvas.height = defaultCanvasHeight;

  // Ending the session will reject any outstanding commit promises, so if you
  // want the animation loop to continue running you'll need to manually queue
  // up the next frame.
  window.requestAnimationFrame(OnDrawFrame);
}
```

In addition to the application ending the session manually, the UA may force the session to end at any time for a variety of reasons. Well behaved applications should monitor the `sessionchange` event on the `VRDevice` to detect when that happens.

```js
vrDevice.addEventListener('sessionchange', vrDeviceEvent => {
  // Check to see if the vrDevice no longer has an active session.
  if (!vrDevice.activeSession) {
    OnSessionEnded();
  }
});

```

## Advanced functionality

Beyond the core APIs described above, the WebVR API also exposes several options for taking greater advantage of the VR hardware's capabilities.

### Orientation-only tracking

A viewer for 360 photos or videos should not respond to head translation, since the source material is intended to be viewed from a single point. While some headsets naturally function this way (Daydream, Gear VR, Cardboard) it can be useful for app developers to specify that they don't want any positional tracking in the matrices they receive. (This may also provide power savings on some devices, since it may allow some sensors to be turned off.) That can be accomplished by requesting a "headModel" `VRFrameOfReference`.

```js
let frameOfRef = await vrSession.createFrameOfReference("headModel");

// Use frameOfRef as detailed above.
```

### Room-scale tracking and boundaries

Some VR devices have been configured with details about the area they are being used in, including things like where the floor is and what boundaries of the safe space is so that it can be communicated to the user in VR. It can be beneficial to render the virtual scene so that it lines up with the users physical space for added immersion, especially ensuring that the virtual floor and the physical floor align. This is frequently called "room scale" or "standing" VR. It helps the user feel grounded in the virtual space. WebVR refers to this type of bounded, floor relative play space as a "stage". Applications can take advantage of that space by creating a stage `VRFrameOfReference`. This will report values relative to the floor, ideally at the center of the room. (In other words the users physical floor is at Y = 0.) Not all `VRDevices` will support this mode, however. `createFrameOfReference` will reject the promise in that case.

```js
// Try to get a frame of reference where the floor is at Y = 0
vrSession.createFrameOfReference("stage").then(frame => {
  frameOfRef = frame;
}).catch(err => {
  // "stage" VRFrameOfReference is not supported.

  // In this case the application will want to estimate the position of the
  // floor, perhaps by asking the user's height, and translate the reported
  // values upward by that distance so that the floor appears in approximately
  // the correct position.
  frameOfRef = await vrSession.createFrameOfReference("eyeLevel");
});

// Use frameOfRef as detailed above, but render the floor of the virtual space at Y = 0;
```

When using a stage `VRFrameOfReference` the device will frequently have a configured "safe area" that the user can move around in without fear of bumping into real world objects. WebVR can communicate the rough boundaries of this space via the `VRFrameOfReference.bounds` attribute. It describes an axis-aligned bounding rectangle which represents the known safe space with the `minX`, `maxX`, `minZ`, and `maxZ` values. The values reported are relative to the stage origin, but do not necessarily contain it. (Future iterations of the API may include more detailed polygonal bounds as well.) The `bounds` attribute is null if the bounds are unavailable for the current frame of reference.

If the `bounds` are available the application should try to ensure that all content the user needs to interact with can be reached while staying inside the described bounds.

```js
if(frameOfRef.bounds) {
  // Reposition the scene to match the reported bounds. Assumes a scene with a
  // floor whose left back corner is at (0, 0, 0) and is 1 meter square.
  scene.translateX(frameOfRef.bounds.minX);
  scene.translateZ(frameOfRef.bounds.minZ);
  scene.scaleX(frameOfRef.bounds.maxX - frameOfRef.bounds.minX);
  scene.scaleZ(frameOfRef.bounds.maxZ - frameOfRef.bounds.minZ);
} else {
  // Use default bounds. (2 meters square, centered at the origin)
  scene.translateX(-1.0);
  scene.translateZ(-1.0);
  scene.scaleX(2.0);
  scene.scaleZ(2.0);
}
```

### High quality rendering

In general `vrSession.getSourceProperties()` will report a resolution that is deemed by the UA to be a good balance between performance and quality. This may mean that it reports a resolution lower than necessary to get a 1:1 pixel ratio at the center of the users vision post-distortion, especially on mobile devices. For the majority of applications that's probably the right call, but some applications will want to ensure their output is as high quality as possible for the device. These will usually be simpler scenes with detailed textures, like a photo viewer or text-heavy experiences. To accomplish this the application can explicitly request a 1:1 pixel ratio from `getSourceProperties`

```js
vrDevice.requestSession().then(session => {
  // Request dimensions needed for 1:1 output pixel ratio. 0.5 would request a
  // half resolution buffer, values greater than 1.0 request a resolution that
  // will be super-sampled. Passing 0.0 or leaving to optional scale factor off
  // lets the UA decide what scale factor to use.
  let sourceProperties = session.getSourceProperties(1.0);

  glCanvas.width = sourceProperties.width;
  glCanvas.height = sourceProperties.height;

  // Do any other necessary setup

  // Start render loop
  vrSession.commit().then(OnFirstVRFrame);
});
```

### Presenting automatically when the user interacts with the headset

Many VR devices have some way of detecting when the user has put the headset on or is otherwise trying to use the hardware. For example: an Oculus Rift or Vive have proximity sensors that indicate when the headset is being worn. And a Daydream device uses NFC tags to inform the phone when it's been placed in a headset. In both of these cases the user is showing a clear intent to begin using VR. A well behaved WebVR application should ideally begin presenting automatically in these scenarios. The `activate` event fired from the `VRDevice` can be used to accomplish that.

```js
vrDevice.addEventListener('activate', vrDeviceEvent => {
  // The activate event acts as a user gesture, so exclusive access can be
  // requested in the even handler.
  vrDevice.requestSession().then(OnSessionStarted);
});
```

Similarly, the `deactivate` event can be used to detect when the user removes the headset, at which point the application may want to end the session.

```js
vrDevice.addEventListener('deactivate', vrDeviceEvent => {
  if (vrDevice.activeSession) {
    vrDevice.activeSession.endSession().then(OnSessionEnded);
  }
});
```

### Responding to a suspended session

The UA may temporarily suspend a session if allowing the page to continue reading the headset position represents a security risk (like when the user is entering a password or URL with a virtual keyboard, in which case the head motion may infer the user's input), or if other content is obscuring the page's output. While suspended the page may either resolve commits at a slower rate or not at all, and poses queried from the headset may be less accurate. The UA is expected to present a tracked environment to the user when the page is being throttled to prevent user discomfort.

In general the page should continue producing frames like normal whenever `commit()` resolves. The UA may use these frames as part of it's tracked environment, though they may be partially occluded, blurred, or otherwise manipulated. Still, some applications may wish to respond to this suspension by halting game logic, purposefully obscuring content, or pausing media. To do so, the application should listen for the `blur` and `focus` events from the `VRSession`. For example, a 360 media player would do this to pause the video/audio whenever the UA has obscured it.

```js
vrSession.addEventListener('blur', vrSessionEvent => {
  PauseMedia();
  // Allow the render loop to keep running, but just keep rendering the last frame.
  // Render loop may not run at full framerate.
});

vrSession.addEventListener('focus', vrSessionEvent => {
  ResumeMedia();
});
```

### Responding to a reset pose

Most VR systems have a mechanism for allowing the user to reset which direction is "forward." For security and comfort reasons the WebVR API has no mechanism to trigger a pose reset programatically, but it can still be useful to know when it happens. Pages may want to take advantage of the visual discontinuity to reposition the user or other elements in the scene into a more natural position for the new orientation. Pages may also want to use the opportunity to clear or reset any additional transforms that have been applied if no longer needed.

A page can be notified when a pose reset happens by listening for the 'resetpose' event from the 'VRSession'.

```js
vrSession.addEventListener('resetpose', vrSessionEvent => {
  // For an app that allows artificial Yaw rotation, this would be a perfect
  // time to reset that.
  ResetYawTransform();
});
```

### Page navigation

WebVR applications can, like any web page, link to other pages. In the context of a VR scene this is handled by setting `window.location` to the desired URL when the user performs some action. If the page being linked to is not VR-capable the user will either have to remove the VR device to view it (which the UA should explicitly instruct them to do) or the page could be shown as a 2D page in a VR browser.

If the page being navigated to is VR capable, however, it's frequently desirable to allow the user to immediately begin using a VR session for that page as well, so that the user feels as though they are navigating through a single continuous VR experience. To achieve this the page can handle the `navigate` event, fired on the `navigator.vr` object. This event provides a `VRSession` for the `VRDevice` that the previous page was presenting to.

The `VRDevice` and `VRSession` must not retain any state set by the previous page, and need not make any guarantees about consistency of pose data between pages. They should maintain the same general implementation between pages for basic usage consistency. For example: The user agent should not switch users from the Oculus SDK to OpenVR between pages, or from Daydream to Cardboard, even though in both cases the users device could technically be used with either.

To indicate to indicate that you wish to continue presenting VR content on this page the handler must call `event.preventDefault()`.

```js
navigator.vr.addEventListener('navigate', vrSessionEvent => {
  vrSessionEvent.preventDefault();
  vrSession = vrSessionEvent.session;
  vrDevice = vrSession.device;

  // Ensure content is loaded and begin drawing.
  OnDrawFrame();
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
  attribute EventHandler onnavigate;

  Promise<sequence<VRDevice>> getDevices();
};

//
// Device
//

interface VRDevice : EventTarget {
  readonly attribute DOMString deviceName;
  readonly attribute boolean isExternal;

  attribute VRSession? activeSession;

  attribute EventHandler onsessionchange;
  attribute EventHandler onactivate;
  attribute EventHandler ondeactivate;

  Promise<boolean> supportsSession(VRSessionCreateParametersInit parameters);
  Promise<VRSession> requestSession(VRSessionCreateParametersInit parameters);

  Promise<void> ensureContextCompatibility(WebGLRenderingContext context);
};

//
// Session
//

dictionary VRSessionCreateParametersInit {
  boolean exclusive = true;
};

interface VRSessionCreateParameters {
  readonly boolean exclusive;
};

interface VRSourceProperties {
  readonly attribute double scale;
  readonly attribute unsigned long width;
  readonly attribute unsigned long height;
};

interface VRSession : EventTarget {
  readonly attribute VRDevice device;
  readonly attribute VRSessionCreateParameters createParameters;

  attribute double depthNear;
  attribute double depthFar;

  attribute VRLayer baseLayer;

  attribute EventHandler onblur;
  attribute EventHandler onfocus;
  attribute EventHandler onresetpose;

  VRSourceProperties getSourceProperties(optional double scale);

  Promise<VRFrameOfReference> createFrameOfReference(VRFrameOfReferenceType type);
  VRDevicePose? getDevicePose(VRCoordinateSystem coordinateSystem);

  Promise<void> endSession();
};

//
// Pose
//

interface VRDevicePose {
  readonly attribute Float32Array leftProjectionMatrix;
  readonly attribute Float32Array leftViewMatrix;

  readonly attribute Float32Array rightProjectionMatrix;
  readonly attribute Float32Array rightViewMatrix;

  readonly attribute Float32Array poseModelMatrix;
};

//
// Layers
//

interface VRLayer {};

typedef (HTMLCanvasElement or
         OffscreenCanvas) VRCanvasSource;

[Constructor(VRSession session, optional VRCanvasSource source)]
interface VRCanvasLayer : VRLayer {
  attribute VRCanvasSource source;

  void setLeftBounds(double left, double bottom, double right, double top);
  FrozenArray<double> getLeftBounds();

  void setRightBounds(double left, double bottom, double right, double top);
  FrozenArray<double> getRightBounds();

  Promise<DOMHighResTimeStamp> commit();
};

//
// Coordinate Systems
//

interface VRCoordinateSystem {
  Float32Array? getTransformTo(VRCoordinateSystem other);
};

enum VRFrameOfReferenceType {
  "headModel",
  "eyeLevel",
  "stage",
};

interface VRFrameOfReference : VRCoordinateSystem {
  readonly attribute VRStageBounds? bounds;
};

interface VRStageBounds {
  readonly attribute double minX;
  readonly attribute double maxX;
  readonly attribute double minZ;
  readonly attribute double maxZ;
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

//
// WebGL
//
partial dictionary WebGLContextAttributes {
    VRDevice compatibleVrDevice = null;
};
```
