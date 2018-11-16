# WebXR Device API - Input
This document is a subsection of the main WebXR Device API explainer document which can be found [here](explainer.md).  The main explainer contains all the information you could possibly want to know about setting up a WebXR session, the render loop, and more.  In contrast, this document covers how to manage input across the range of XR hardware.

## Usage

XR hardware provides a wide variety of input mechanisms, ranging from single state buttons to fully tracked controllers with multiple buttons, joysticks, triggers, or touchpads. While the intent is to eventually support the full range of available hardware, for the initial version of the WebXR Device API the focus is on enabling a more universal "point and click" style system that can be supported in some capacity by any known XR device and in inline mode.

In this model every input source has a ray that indicates what is being pointed at, called the "Target Ray", and reports when the primary action for that device has been triggered, surfaced as a "select" event. When the select event is fired the XR application can use the target ray of the input source that generated the event to determine what the user was attempting to interact with and respond accordingly. Additionally, if the input source represents a tracked device a "Grip" matrix will also be provided to indicate where a mesh should be rendered to align with the physical device.

### Enumerating input sources

Calling the `getInputSources()` function on an `XRSession` will return a list of all `XRInputSource`s that the user agent considers active. An `XRInputSource` may represent a tracked controller, inputs built into the headset itself, or more ephemeral input mechanism like tracking of hand gestures. When input sources are added to or removed from the list of available input sources the `inputsourceschange` event will be fired on the `XRSession` object to indicate that any cached copies of the list should be refreshed.

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

Each input source can query a `XRInputPose` using the `getInputPose()` function of any `XRFrame`. Getting the pose requires passing in the `XRInputSource` you want the pose for, as well as the `XRReferenceSpace` the pose values should be given in, just like `getViewerPose()`. `getInputPose()` may return `null` in cases where tracking has been lost (similar to `getViewerPose()`), or the given `XRInputSource` instance is no longer connected or available.

The `gripMatrix` is a transform into a space where if the user was holding a straight rod in their hand it would be aligned with the negative Z axis (forward) and the origin rests at their palm. This enables developers to properly render a virtual object held in the user's hand. For example, a sword would be positioned so that the blade points directly down the negative Z axis and the center of the handle is at the origin.

If the input source has only 3DOF, the grip matrix may represent only a translation or rotation based on tracking capability. An example of this case is for physical hands on some AR devices which only have a tracked position. The `gripMatrix` will be `null` if the input source isn't trackable. 

An input source will also provide its preferred pointing ray, given by the `XRInputPose`'s `targetRay`. The ray, which is an `XRRay` object, includes both an `origin` and `direction`, both given as `DOMPointReadOnly`s. The `origin` represents a 3D coordinate in space with a `w` component that must be 1, and the `direction` represents a normalized 3D directional vector with a `w` component that must be 0. The `XRRay` also defines a `transformMatrix` which represents the transform from a ray originating at `[0, 0, 0]` and extending down the negative Z axis to the ray described by the `XRRay`'s `origin` and `direction`. This is useful for positioning graphical representations of the ray.

The `targetRay` will never be `null`. It's value will differ based on the type of input source that produces it, which is represented by the `targetRayMode` attribute:

  * `'gaze'` indicates the target ray will originate at the user's head and follow the direction they are looking (this is commonly referred to as a "gaze input" device). While it may be possible for these devices to be tracked (and have a grip matrix), the head gaze is used for targeting. Example devices: 0DOF clicker, regular gamepad, voice command, tracked hands.
  * `'tracked-pointer'` indicates that the target ray originates from either a handheld device or other hand-tracking mechanism and represents that the user is using their hands or the held device for pointing. The exact orientation of the ray relative to a given device should follow platform-specific guidelines if there are any. In the absence of platform-specific guidance or a physical device, the target ray should most likely point in the same direction as the user's index finger if it was outstretched.
  * `'screen'` indicates that the input source was an interaction with a session's output context canvas element, such as a mouse click or touch event. Only applicable for inline sessions or an immersive AR session being displayed on a 2D screen. See [Screen Input](#screen_input) for more details.

```js
// Loop over every input source and get their pose for the current frame.
for (let inputSource of xrInputSources) {
  let inputPose = xrFrame.getInputPose(inputSource, xrReferenceSpace);

  // Check to see if the pose is valid
  if (inputPose) {
    // Render a visualization of the input source (see next section).
    renderInputSource(session, inputSource, inputPose);

    // Highlight any objects that the target ray intersects with.
    let ray = inputPose.targetRay;
    let hoveredObject = scene.getObjectIntersectingRay(ray.origin, ray.direction);
    if (hoveredObject) {
      // Render a visualization of the object that is highlighted (see below).
      drawHighlightFrom(hoveredObject, inputSource);
    }
  }
}
```

Some platforms may support both tracked and non-tracked input sources concurrently (such as a pair of `'tracked-pointer'` 6DOF controllers plus a regular `'gaze'` clicker). Since `xrSession.getInputSources()` returns all connected input sources, an application should take into consideration the most recently used input sources when rendering UI hints, such as a cursor, ray or highlight.

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
    // 'screen' over 'tracked-pointer' over 'gaze'.
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
    let inputPose = xrFrame.getInputPose(lastInputSource, xrReferenceSpace);
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

All three events are `XRInputSourceEvent` events. When fired the event's `inputSource` attribute must contain the `XRInputSource` that produced the event. The event's `frame` attribute must contain a valid `XRFrame` that can be used to query the input and device poses at the time the selection event occurred. The `XRViewerPose`'s `views` array must be empty.

In most cases applications will only need to listen for the `select` event for basic interactions like clicking on buttons.

```js
function onSessionStarted(session) {
  session.addEventListener("select", onSelect);

  // Remainder of session initialization logic.
}

function onSelect(event) {
  let inputPose = event.frame.getInputPose(event.inputSource, xrReferenceSpace);
  if (inputPose) {
    // Ray cast into scene to determine if anything was hit.
    let ray = inputPose.targetRay;
    let selectedObject = scene.getObjectIntersectingRay(ray.origin, ray.direction);
    if (selectedObject) {
      selectedObject.onSelect();
    }
  }
}
```

Some input sources (such as those with a `targetRayMode` of `screen`) will be only be added to the list of input sources whilst a primary action is occurring. In these cases, the `inputsourceschange` event will fire just prior to the `selectstart` event, then again when the input source is removed after the `selectend` event.

`selectstart` and `selectend` can be useful for handling dragging, painting, or other continuous motions.

In some cases tracked input sources cannot accurately track their position in space, and provides an estimated position based on the sensor data available to it. This is the case, for example, for the Daydream and GearVR 3DoF controllers, which use an arm model to approximate controller position based on rotation. In these cases the `emulatedPosition` attribute of the `XRInputPose` should be set to `true` to indicate that the translation components of the pose matrices may not be accurate.

While most applications will wish to use a targeting ray from the input source pose, it is possible to support only gaze and commit interactions such that the targeting ray always matches the head pose even if trackable controllers are connected. In this case, the `select` event should still be used to handle interaction events, but the device pose can be used to create the targeting ray.

```js
function onSelect(event) {
  // Use the viewer pose to create a ray from the head, regardless of whether controllers are connected.
  let viewerPose = event.frame.getViewerPose(xrReferenceSpace);

  // Ray cast into scene with the viewer pose to determine if anything was hit.
  // Assumes the use of a fictionalized math and scene library.
  let rayOrigin = getTranslation(viewerPose.poseMatrix);
  let rayDirection = applyRotation(scene.forwardVector, viewerPose.poseMatrix);
  let selectedObject = scene.getObjectIntersectingRay(rayOrigin, rayDirection);
  if (selectedObject) {
    selectedObject.onSelect();
  }
}
```

### Rendering input sources

Most applications will want to visually represent the input sources somehow. The appropriate type of visualization to be used depends on the value of the `targetRayMode` attribute:

  * `'gaze'`: A cursor should be drawn at some distance down the target ray, ideally at the depth of the first surface it intersects with, so the user can identify what will be interacted with when a select event is fired. It's not appropriate to draw a controller or ray in this case, since they may obscure the user's vision or be difficult to visually converge on.
  * `'tracked-pointer'`: If the `gripMatrix` in not `null` an application-appropriate controller model should be drawn using that matrix as the transform. If appropriate for the experience, the a visualization of the target ray and a cursor as described in the `'gaze'` should also be drawn.
  * `'screen'`: In all cases the point of origin of the target ray is obvious and no visualization is needed.

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
  if (inputSource.targetRayMode == "tracked-pointer") {
    // Draw targeting rays for tracked-pointer devices only.
    let ray = inputPose.targetRay;
    renderer.drawRay(ray.origin, ray.direction);
  }

  if (inputSource.targetRayMode != 'screen') {
    // Draw a cursor for gazing and tracked-pointer devices only.
    let ray = inputPose.targetRay;
    let cursorPosition = scene.getIntersectionPoint(ray.origin, ray.direction);
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
  
  let inputPose = event.frame.getInputPose(event.inputSource, xrReferenceSpace);
  // Ignore the event if this input source is not capable of tracking.
  if (!inputPose || !inputPose.gripMatrix)
    return;

  // Use the input source target ray to find a draggable object in the scene
  let ray = inputPose.targetRay;
  let hitResult = scene.hitTest(ray.origin, ray.direction);
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
    let inputPose = frame.getInputPose(activeDragInteraction.inputSource, xrReferenceSpace);
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

### Screen Input

When using an inline session or an immersive AR session on a 2D screen, pointer events on the canvas that created the session's `outputContext` are monitored. `XRInputSource`s are generated in response to allow unified input handling with immersive mode controller or gaze input.

When the canvas receives a `pointerdown` event an `XRInputSource` is created with a `targetRayMode` of `'screen'` and added to the array returned by `getInputSources()`. A `selectstart` event is then fired on the session with the new `XRInputSource`. The `XRInputSource`'s target ray should be updated with every `pointermove` event the canvas receives until a `pointerup` event is received. A `selectend` event is then fired on the session and the `XRInputSource` is removed from the array returned by `getInputSources()`. When the canvas receives a `click` event a `select` event is fired on the session with the appropriate `XRInputSource`.

For each of these events the `XRInputSource`'s target ray must be updated to originate at the point that was interacted with on the canvas, projected onto the near clipping plane (defined by the `depthNear` attribute of the `XRSession`) and extending out into the scene along that projected vector.

## Appendix A: Proposed partial IDL
This is a partial IDL and is considered additive to the core IDL found in the main [explainer](explainer.md).
```webidl
//
// Session
//

partial interface XRSession {
  FrozenArray<XRInputSource> getInputSources();
  
  attribute EventHandler onselect;
  attribute EventHandler onselectstart;
  attribute EventHandler onselectend;
  attribute EventHandler oninputsourceschange;
};

//
// Frame
//

partial interface XRFrame {
  // Also listed in the spatial-tracking-explainer.md
  XRInputPose? getInputPose(XRInputSource inputSource, optional XRReferenceSpace referenceSpace);
};

//
// Input
//

[SecureContext, Exposed=Window]
interface XRRay {
  readonly attribute DOMPointReadOnly origin;
  readonly attribute DOMPointReadOnly direction;
  readonly attribute Float32Array transformMatrix;
};

enum XRHandedness {
  "",
  "left",
  "right"
};

enum XRTargetRayMode {
  "gaze",
  "tracked-pointer",
  "screen"
};

[SecureContext, Exposed=Window]
interface XRInputSource {
  readonly attribute XRHandedness handedness;
  readonly attribute XRTargetRayMode targetRayMode;
};

[SecureContext, Exposed=Window]
interface XRInputPose {
  readonly attribute boolean emulatedPosition;
  readonly attribute XRRay targetRay;
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
 Constructor(DOMString type, XRInputSourceEventInit eventInitDict)]
interface XRInputSourceEvent : Event {
  readonly attribute XRFrame frame;
  readonly attribute XRInputSource inputSource;
};

dictionary XRInputSourceEventInit : EventInit {
  required XRFrame frame;
  required XRInputSource inputSource;
};
```