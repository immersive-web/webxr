WebVR to WebXR Migration Guide
==============================

This guide is intended to help developers that have created content with the now deprecated WebVR API migrate to the WebXR API that replaced it. For simplicity this document is going to primarily focus on the differences between how WebVR and WebXR presenting VR content to a headset, since that’s the primary draw of the API. Differences in displaying inline content are not covered.

Hardware enumeration
--------------------
WebVR applications start by calling `navigator.getVRDisplays()`, which returns a list of connected VR hardware. The developer then chooses a `VRDisplay` from the list and keeps a reference to it. This object is what almost all further interaction is done with for the remainder of the application. Changes to the available set of VR hardware is indicated with the `vrdisplayconnect` and `vrdisplaydisconnect` events on the `Window` object.

In WebXR a list of connected hardware cannot be retrieved to avoid fingerprinting. Instead a single active “XR device” is implicitly picked by the UA and all operations are performed against it. (System support for multiple XR devices at once is almost unheard of, so this isn’t problematic for most any real world scenario.) Changes to the available VR hardware are indicated by the [`devicechange`](https://immersive-web.github.io/webxr/#eventdef-xr-devicechange) event of the [`navigator.xr`](https://immersive-web.github.io/webxr/#navigator-xr-attribute) object.

Testing for support
-------------------
Both WebVR and WebXR applications have a need to advertise to users that VR content can be shown, usually by enabling a button that will be used to initiate the VR content’s presentation to the display.

WebVR applications test to see if the `VRDisplay` will allow VR content to be shown on it by checking the `vrDisplay.capabilities.canPresent` boolean attribute.

WebXR applications call [`navigator.xr.isSessionSupported()`](https://immersive-web.github.io/webxr/#dom-xr-issessionsupported) with the desired [`XRSessionMode`](https://immersive-web.github.io/webxr/#xrsessionmode-enum) (which indicates the type of content they want to display, such as [`“immersive-vr”`](https://immersive-web.github.io/webxr/#dom-xrsessionmode-immersive-vr)) and check the resolved boolean to see if the implicit XR Device supports it.

**WebVR**
```js
// All code samples will omit error checking for clarity.
let displays = await navigator.getVRDisplays();
let vrDisplay = displays[0];
if (vrDisplay.capabilities.canPresent) {
  ShowEnterVRButton();
}
```

**WebXR**
```js
let supported = await navigator.xr.isSessionSupported('immersive-vr');
if (supported) {
  ShowEnterVRButton();
}
});
```

Starting VR presentation
------------------------
WebVR applications begin presenting VR content by calling `vrDisplay.requestPresent()`.

WebXR applications begin presenting VR content by calling [`navigator.xr.requestSession()`](https://immersive-web.github.io/webxr/#dom-xr-requestsession) with the [`XRSessionMode`](https://immersive-web.github.io/webxr/#xrsessionmode-enum) of [`“immersive-vr”`](https://immersive-web.github.io/webxr/#dom-xrsessionmode-immersive-vr). This returns a promise that resolves to an [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface), which the developer keeps a reference to. This object is what almost all further interaction is done with for the remainder of the VR content presentation.

Both methods must be called during a user activation event.

Rendering Setup
---------------
Both APIs render VR content using WebGL, though the way that imagery is supplied to the API differs.

WebVR applications pass an `HTMLCanvasElement`, expected to have an attached `WebGLRenderingContext`. as the `source` of a `VRLayerInit` dictionary, which is then passed to `vrDisplay.requestPresent()`. From then on any content rendered to the canvas’ WebGL context’s backbuffer is presented to the VR hardware. For best results, it is expected that the application will resize the canvas to match the combined `renderWidth` and `renderHeight` reported by the `VREyeParameters` for both eyes, reported by calling `vrDisplay.getEyeParameters()` with the desired `VREye`.

WebXR applications must first make the WebGL context compatible with the active XR device. This ensures that the WebGL resources reside on the GPU that is optimal for VR rendering (for example, the one that the headset is physically connected to on a multi-GPU desktop PC). This is done by either setting the [`xrCompatible`](https://immersive-web.github.io/webxr/#dom-webglcontextattributes-xrcompatible) key to `true` in the [`WebGLContextCreationAttributes`](https://immersive-web.github.io/webxr/#contextcompatibility) when creating the context _or_ calling [`gl.makeXRCompatible()`](https://immersive-web.github.io/webxr/#dom-webglrenderingcontextbase-makexrcompatible) on the context after it’s been created (which may trigger a context loss). Then the developer constructs a new [`XRWebGLLayer`](https://immersive-web.github.io/webxr/#xrwebgllayer-interface), passing in both the [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface) and an XR compatible `WebGLRenderingContext`. This layer is then set as the source of the content the VR hardware will display by passing it to [`xrSession.updateRenderState()`](https://immersive-web.github.io/webxr/#dom-xrsession-updaterenderstates) as the [`baseLayer`](https://immersive-web.github.io/webxr/#dom-xrrenderstateinit-baselayer) of the [`XRRenderStateInit`](https://immersive-web.github.io/webxr/#dictdef-xrrenderstateinit) dictionary. The canvas _does not_ need to be resized for best results.

**WebVR**
```js
let glCanvas = document.createElement('canvas');
let gl = document.getContext('webgl');

await vrDisplay.requestPresent([{ source: glCanvas }]);
let leftEye = vrDisplay.getEyeParameters("left");
let rightEye = vrDisplay.getEyeParameters("right");

glCanvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
glCanvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);

// Now presenting to the headset.
```

**WebXR**
```js
let glCanvas = document.createElement('canvas');
let gl = document.getContext('webgl', { xrCompatible: true });

let xrSession = await navigator.xr.requestSession('immersive-vr');
let xrLayer = new XRWebGLLayer(session, gl);
session.updateRenderState({ baseLayer: xrLayer });

// Now presenting to the headset.
```

Tracking Setup
--------------
WebVR has a single implicit tracking environment that all poses are delivered in. In order to allow the user to feel like the floor of their virtual environment aligns with the floor of their physical environment they must transform all poses by the `sittingToStandingTransform` matrix that’s reported by the `vrDisplay.stageParameters` attribute. If the developers wants to know the boundaries of the user’s play space they can look at the `sizeX` and `sizeZ` attributes of the `vrDisplay.stageParameters`, which describe an axis aligned rectangle centered on the origin defined by the `sittingToStandingTransform`. (This limited form of boundaries reporting may force the reported size to be significantly smaller than the actual boundaries the user configured.)

WebXR requires the developer to define the tracking environment they want poses communicated in. This is both to enable a wider range of hardware (like AR devices) and to simplify the creation of floor-aligned content by removing much of the matrix math that WebVR required. The tracking space is specified by calling [`xrSession.requestReferenceSpace()`](https://immersive-web.github.io/webxr/#dom-xrsession-requestreferencespace) with the desired [`XRReferenceSpaceType`](https://immersive-web.github.io/webxr/#enumdef-xrreferencespacetype), which returns a promise that resolves to an [`XRReferenceSpace`](https://immersive-web.github.io/webxr/#xrreferencespace). The developer will supply this object any time poses are requested. A [`“local”`](https://immersive-web.github.io/webxr/#dom-xrreferencespacetype-local) reference space closely aligns with WebVR’s implicit tracking environment, while a [`“local-floor”`](https://immersive-web.github.io/webxr/#dom-xrreferencespacetype-local-floor) reference space aligns the virtual environment with the floor of the user’s physical environment similar to WebVR’s `sittingToStandingTransform` (but with less math expected of the developer in order to make it work.) A [`“bounded-floor”`](https://immersive-web.github.io/webxr/#dom-xrreferencespacetype-bounded-floor) reference space also aligns with the user’s physical floor, with the addition of reporting [`boundsGeometry`](https://immersive-web.github.io/webxr/#dom-xrboundedreferencespace-boundsgeometry), which gives a full polygonal boundary that’s more flexible/accurate than WebVR’s rectangular equivalent.

**WebVR**
```js
// No equivalent
```

**WebXR**
```js
xrReferenceSpace = await xrSession.requestReferenceSpace("local");
```

If the developer wants to use reference spaces other than [`"local"`](https://immersive-web.github.io/webxr/#dom-xrreferencespacetype-local) during an [`"immersive-vr"`] session they must also request consent to use it at session creation time by passing the desired type to either the [`requiredFeatures`](https://immersive-web.github.io/webxr/#dom-xrsessioninit-requiredfeatures) or [`optionalFeatures`](https://immersive-web.github.io/webxr/#dom-xrsessioninit-optionalfeatures) members of the [`XRSessionInit`](https://immersive-web.github.io/webxr/#dictdef-xrsessioninit) dictionary passed to [`navigator.xr.requestSession()`](https://immersive-web.github.io/webxr/#dom-xr-requestsession). This will cause the UA to prompt the user for their consent to use the more detailed levels of tracking if necessary.

**WebVR**
```js
// No equivalent
```

**WebXR**
```js
let xrSession = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ["local-floor"]
});

let xrReferenceSpace = await xrSession.requestReferenceSpace("local-floor");
```

Animation Loop
--------------
Both `VRDisplay` and [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface) have a [`requestAnimationFrame`](https://immersive-web.github.io/webxr/#dom-xrsession-requestanimationframe) function that is called to process rendering callbacks at the appropriate refresh rate for the VR hardware.

In WebVR during the `vrDisplay.requestAnimationFrame()` callback the user’s pose is queried by calling `vrDisplay.getFrameData()`, which is passed an application-allocated `VRFrameData` object to populate with the current pose data. The `VRFrameData` contains projection and view matrices for the user’s left and right eyes, as well as a `VRPose` that describes the position, orientation, velocity, and acceleration of the user at the time of the frame. The application is expected to use the projection and view matrices as-is, even though it may appear they could be computed from the `VRPose` and values given in the `VREyeParameters`.

In WebXR an XRFrame is passed into the callback provided to [`xrSession.requestAnimationFrame()`](https://immersive-web.github.io/webxr/#dom-xrsession-requestanimationframe). The user’s pose is queried from the XRFrame by calling [`xrFrame.getViewerPose()`](https://immersive-web.github.io/webxr/#dom-xrframe-getviewerpose) with the [`XRReferenceSpace`](https://immersive-web.github.io/webxr/#xrreferencespace-interface) the developer wants the pose reported in. The [`XRViewerPose`](https://immersive-web.github.io/webxr/#xrviewerpose-interface) that’s returned contains an array of [`XRView`](https://immersive-web.github.io/webxr/#xrview-interface)s, each of which reports a [`projectionMatrix`](https://immersive-web.github.io/webxr/#dom-xrview-projectionmatrix) and a transform that indicates the required position of the “camera” for that view. The [`projectionMatrix`](https://immersive-web.github.io/webxr/#dom-xrview-projectionmatrix) is expected to be used as-is, but the [`transform`](https://immersive-web.github.io/webxr/#dom-xrview-transform) (which is an [`XRRigidTransform`](https://immersive-web.github.io/webxr/#xrrigidtransform-interface)) providing a [`position`](https://immersive-web.github.io/webxr/#dom-xrrigidtransform-position) vector and [`orientation`](https://immersive-web.github.io/webxr/#dom-xrrigidtransform-orientation) quaternion, as well as a [`matrix`](https://immersive-web.github.io/webxr/#dom-xrrigidtransform-matrix) representation of the same transform.) The [`XRViewerPose`](https://immersive-web.github.io/webxr/#xrviewerpose-interface) also has a top-level [`transform`](https://immersive-web.github.io/webxr/#dom-xrpose-transform) that gives the position and orientation for the VR hardware. No velocity or acceleration is exposed by WebXR at this time.

In WebVR the application is always expected to render the scene twice, once for the left eye to the left half of the default WebGL framebuffer, and once for the right eye to the right half of the default WebGL framebuffer. The resolution that the app renders at can be controlled two ways: By resizing the WebGL backbuffer (with the canvas width and height attributes) or by changing the left and right viewports by setting the `leftBounds` and `rightBounds` of the `VRLayerInit` when calling `vrDisplay.requestPresent()`.

In WebXR the application renders the scene N times, once for each [`XRView`](https://immersive-web.github.io/webxr/#xrview-interface) that’s reported by the [`XRViewerPose`](https://immersive-web.github.io/webxr/#xrviewerpose-interface). The number of views reported may change from frame to frame. Content is rendered into the [`framebuffer`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-framebuffer) of the [`XRWebGLLayer`](https://immersive-web.github.io/webxr/#xrwebgllayer-interface), which is allocated by the UA to match the VR hardware's needs. (The default WebGL framebuffer is not used by WebXR for `"immersive-vr"` sessions, and can be rendered into for display on the page as usual during VR presentation.) The viewport for each view is determined by passing the [`XRView`](https://immersive-web.github.io/webxr/#xrview-interface) into [`xrWebGLLayer.getViewport()`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-getviewport). The size of the [`XRWebGLLayer`](https://immersive-web.github.io/webxr/#xrwebgllayer-interface) [`framebuffer`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-framebuffer) is determined by the VR hardware (and reported on the layer as [`framebufferWidth`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-framebufferwidth) and [`framebufferHeight`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-framebufferheight)) but can be scaled at layer creation time by setting the [`framebufferScaleFactor`](https://immersive-web.github.io/webxr/#dom-xrwebgllayerinit-framebufferscalefactor) in the [`XRWebGLLayerInit`](https://immersive-web.github.io/webxr/#dictdef-xrwebgllayerinit) dictionary.

When a WebVR application is done rendering it must call `vrDevice.submitFrame()` to capture the content rendered to the WebGL context’s default framebuffer and display it on the VR hardware.

WebXR automatically presents the content of the [`XRWebGLLayer`](https://immersive-web.github.io/webxr/#xrwebgllayer-interface)’s [`framebuffer`](https://immersive-web.github.io/webxr/#dom-xrwebgllayer-framebuffer) to the VR hardware when the [`xrSession.requestAnimationFrame()`](https://immersive-web.github.io/webxr/#dom-xrsession-requestanimationframe) callback returns.

**WebVR**
```js
let vrFrameData = new VRFrameData();
function onFrame (t) {
  // Queue a request for the next frame to keep the animation loop going.
  vrDisplay.requestAnimationFrame(onFrame);

  // Get the frame data, which contains the required matrices.
  vrDisplay.getFrameData(frameData);

  // Ensure we're rendering to the default backbuffer.
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Set the default left eye viewport, assuming that it wasn't changed during 
  // the call to vrDisplay.requestPresent().
  gl.viewport(0, 0, webglCanvas.width * 0.5, webglCanvas.height);

  // Render the scene using a fictional rendering library with the left eye's
  // projection and view matrix.
  scene.setProjectionMatrix(frameData.leftProjectionMatrix);
  scene.setViewMatrix(frameData.leftViewMatrix);
  scene.render();

  // Set the default right eye viewport.
  gl.viewport(webglCanvas.width * 0.5, 0, webglCanvas.width * 0.5, webglCanvas.height);

  // Render the scene using a fictional rendering library with the right eye's
  // projection and view matrix.
  scene.setProjectionMatrix(frameData.rightProjectionMatrix);
  scene.setViewMatrix(frameData.rightViewMatrix);
  scene.render();

  vrDisplay.submitFrame();
}
```

**WebXR**
```js
function onFrame(t, frame) {
  let session = frame.session;
  // Queue a request for the next frame to keep the animation loop going.
  session.requestAnimationFrame(onXRFrame);

  // Get the XRDevice pose relative to the Reference Space we created
  // earlier. The pose may not be available for a variety of reasons, so
  // we'll exit the callback early if it comes back as null.
  let pose = frame.getViewerPose(xrReferenceSpace);
  if (!pose) {
    return;
  }

  // Ensure we're rendering to the layer's backbuffer.
  let layer = session.renederState.baseLayer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);

  // Loop through each of the views reported by the viewer pose.
  for (let view of pose.views) {
    // Set the viewport required by this view.
    let viewport = layer.getViewport(view);
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

    // Render the scene using a fictional rendering library with the view's
    // projection matrix and view transform.
    scene.setProjectionMatrix(view.projectionMatrix);
    scene.setCameraTransform(view.transform.position, view.transform.orientation);
    // Alternatively, the view matrix can be retrieved directly like so:
    // scene.setViewMatrix(view.transform.inverse.matrix);
    scene.render(view.projectionMatrix, view.transform);
  }
}
```

Input
-----
WebVR applications receive VR controller input from the `navigator.getGamepads()` API. Some of the `Gamepad` objects returned will have a non-zero `displayId`, which indicates they are associated with a `VRDisplay`. The `buttons` and `axes` arrays indicate input states as usual, while a non-standard `pose` attribute on the `Gamepad` indicates the `VRPose` of the controller in WebVR’s implicit tracking space. If the developer wants the controller’s pose relative to the user’s floor it must be manually transformed with the `vrDisplay.stageParameters.sittingToStandingTransform`. A non-standard  `hand` attribute on the `Gamepad` indicates which hand the controller is associated with, if known. The `id` attribute of the `Gamepad` indicates the name of the controller, and can be used to load an appropriate mesh to represent the device in the virtual scene.

WebXR applications surface input from multiple sources through [`xrSession.inputSources`](https://immersive-web.github.io/webxr/#dom-xrsession-inputsources), which is an array of [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) objects. The [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) contains a [`targetRaySpace`](https://immersive-web.github.io/webxr/#dom-xrinputsource-targetrayspace) (for point and click tracking) and optional [`gripSpace`](https://immersive-web.github.io/webxr/#dom-xrinputsource-gripspace) (for handheld objects) which can be passed to the [`xrFrame.getPose()`](https://immersive-web.github.io/webxr/#dom-xrframe-getpose) method along with the tracking space they should be reported relative to in order to get the [`XRPose`](https://immersive-web.github.io/webxr/#xrpose-interface) of the input source. The [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) also has a [`handedness`](https://immersive-web.github.io/webxr/#dom-xrinputsource-handedness) attribute to indicate which hand the input source is associated with, if known. For button and axis state the [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) has an optional [`gamepad`](https://immersive-web.github.io/webxr-gamepads-module/#dom-xrinputsource-gamepad) attribute, which is a `Gamepad` object (that notably lacks the non-standard extensions used by WebVR and does not appear in the array returned by `navigator.getGamepads()`). The [`profiles`](https://immersive-web.github.io/webxr/#dom-xrinputsource-profiles) attribute of the [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) contains an array of strings that indicate, with decreasing specificity, the type of input device and can be used to load an appropriate mesh to represent the device in the virtual scene.

It is not possible to trigger user activation events with WebVR input.

The [`selectstart`](https://immersive-web.github.io/webxr/#eventdef-xrsession-selectstart), [`select`](https://immersive-web.github.io/webxr/#eventdef-xrsession-select), and [`selectend`](https://immersive-web.github.io/webxr/#eventdef-xrsession-selectend) events fired on an [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface) indicate when the primary trigger, button, or gesture of an [`XRInputSource`](https://immersive-web.github.io/webxr/#xrinputsource-interface) is being interacted with, and can be used to facilitate basic interaction without the need to observe the [`gamepad`](https://immersive-web.github.io/webxr-gamepads-module/#dom-xrinputsource-gamepad) state. The [`select`](https://immersive-web.github.io/webxr/#eventdef-xrsession-select) event is a user activation event and can be used to begin media playback, among other things.

There is also a corresponding set of [`squeezestart`](https://immersive-web.github.io/webxr/#eventdef-xrsession-squeezestart), [`squeeze`](https://immersive-web.github.io/webxr/#eventdef-xrsession-squeeze), and [`squeezeend`](https://immersive-web.github.io/webxr/#eventdef-xrsession-squeezeend) events that are fired when either a grip button or squeeze gesture is being interacted with. The [`squeeze`](https://immersive-web.github.io/webxr/#eventdef-xrsession-squeeze) event also is a user activation event.

**WebVR**
```js
function onFrame (t) {
  // Queue a request for the next frame to keep the animation loop going.
  vrDisplay.requestAnimationFrame(onFrame);

  // Loop through all gamepads and identify the ones that are associated with
  // the vrDisplay.
  let gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; ++i) {
    let gamepad = gamepads[i];
    // The array may contain undefined gamepads, so check for that as
    // well as a non-null pose.
    if (gamepad && gamepad.displayId && gamepad.pose) {
      scene.showControllerAtTransform(gamepad.pose.position, gamepad.pose.orientation, gamepad.hand);
    }
  }

  // Handle rendering as shown above...
}
```

**WebXR**
```js
function onFrame(t, frame) {
  // Queue a request for the next frame to keep the animation loop going.
  xrSession.requestAnimationFrame(onXRFrame);

  // Loop through all input sources.
  for (let inputSource of xrSession.inputSources) {
    // Show the input source if it has a grip space
    if (inputSource.gripSpace) {
      let inputPose = frame.getPose(inputSource.gripSpace, xrReferenceSpace);
      scene.showControllerAtTransform(inputPose.position, inputPose.orientation, inputSource.handedness);
    }
  }

  // Handle rendering as shown above...
);
```

Ending VR presentation
----------------------
Both WebVR and WebXR may have their presentation of VR content ended by the UA at any time.

WebVR applications may explicitly end the presentation of VR content by calling `vrDisplay.exitPresent()`. A `vrdisplaypresentchange` event is fired on the `Window` object when presentation is started or ended by either the application or the UA. The presentation state is determined by checking the `vrDisplay.isPresenting` boolean attribute.

WebXR applications may explicitly end the presentation of VR content by calling [`xrSession.end()`](https://immersive-web.github.io/webxr/#dom-xrsession-end), at which point the [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface) object becomes unusable. An [`end`](https://immersive-web.github.io/webxr/#eventdef-xrsession-end) event is fired on the [`XRSession`](https://immersive-web.github.io/webxr/#xrsession-interface) when it is ended by either the application or UA.

**WebVR**
```js
window.addEventListener("vrdisplaypresentchange", () => {
  if (!vrDisplay.isPresenting) {
    // VR presentation has ended. Do any necessary cleanup.
  }
});
```

**WebXR**
```js
xrSession.addEventListener("end", () => {
  // VR presentation has ended. Do any necessary cleanup.
});
```

Misc
----
WebXR currently has no equivalent for the `vrdisplayactivate`, `vrdisplaydeactivate`, `vrdisplaypointerrestricted`, and `vrdisplaypointerunrestricted` events. WebXR events also have no equivalent of the `reason` enum reported for `VRDisplayEvent` types.

WebXR currently has no equivalent for the `VRDisplayCapabilities.hasExternalDisplay` attribute.

WebXR has no method for reporting projection parameters in terms of field of view.

Additional Resources
--------------------
Developers looking for more information about how to use WebXR can also refer to the following resources:

  - [WebXR Samples](https://immersive-web.github.io/webxr-samples/)
  - [WebXR Spec](https://immersive-web.github.io/webxr/)
  - [WebXR Core Explainer](https://github.com/immersive-web/webxr/blob/master/explainer.md)
  - [WebXR Spatial Tracking Explainer](https://github.com/immersive-web/webxr/blob/master/spatial-tracking-explainer.md)
  - [WebXR Input Explainer](https://github.com/immersive-web/webxr/blob/master/input-explainer.md)
  - [WebXR Gamepad Module Explainer](https://github.com/immersive-web/webxr-gamepads-module/blob/master/gamepads-module-explainer.md)
