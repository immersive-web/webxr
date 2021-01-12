# WebXR Device API - Spatial Tracking
This document explains the technology and portion of the WebXR APIs used to track users' movement for a stable, comfortable, and predictable experience that works on the widest range of XR hardware. For context, it may be helpful to have first read about [WebXR Session Establishment](explainer.md), and [Input Mechanisms](input-explainer.md).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Contents

- [Introduction](#introduction)
- [Reference spaces](#reference-spaces)
  - [Bounded reference space](#bounded-reference-space)
  - [Unbounded reference space](#unbounded-reference-space)
  - [Local reference spaces](#local-reference-spaces)
    - [Eye-level local reference space](#eye-level-local-reference-space)
    - [Floor-level local reference space](#floor-level-local-reference-space)
  - [Viewer reference space](#viewer-reference-space)
- [Spatial relationships](#spatial-relationships)
  - [Rigid Transforms](#rigid-transforms)
  - [Poses](#poses)
    - [Tracking loss](#tracking-loss)
    - [Tracking recovery](#tracking-recovery)
  - [Application-supplied transforms](#application-supplied-transforms)
  - [Relating between reference spaces](#relating-between-reference-spaces)
    - [Inline to Immersive](#inline-to-immersive)
    - [Unbounded to Bounded](#unbounded-to-bounded)
  - [Click-and-drag view controls](#click-and-drag-view-controls)
- [Practical-usage guidelines](#practical-usage-guidelines)
  - [Inline sessions](#inline-sessions)
  - [Ensuring hardware compatibility](#ensuring-hardware-compatibility)
  - [Floor Alignment](#floor-alignment)
  - [Reference space reset event](#reference-space-reset-event)
- [Appendix A : Miscellaneous](#appendix-a--miscellaneous)
  - [Tracking systems overview](#tracking-systems-overview)
  - [Decision flow chart](#decision-flow-chart)
  - [Reference space examples](#reference-space-examples)
  - [XRReferenceSpace availability](#xrreferencespace-availability)
- [Appendix B: Proposed partial IDL](#appendix-b-proposed-partial-idl)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Introduction
A big differentiating aspect of XR, as opposed to standard 3D rendering, is that users control the view of the experience via their body motion.  To make this possible, XR hardware needs to be capable of tracking the user's motion in 3D space.  Within the XR ecosystem there is a wide range of hardware form factors and capabilities which have historically only been available to developers through device-specific SDKs and app platforms. To ship software in a specific app store, developers optimize their experiences for specific VR hardware (HTC Vive, GearVR, Mirage Solo, etc) or AR hardware (HoloLens, ARKit, ARCore, etc).  WebXR  development is fundamentally different in that regard; the Web gives developers broader reach, with the consequence that they no longer have predictability about the capability of the hardware their experiences will be running on.

## Reference spaces
The wide range of hardware form factors makes it impractical and unscalable to expect developers to reason directly about the tracking technology their experience will be running on.  Instead, the WebXR Device API is designed to have developers think upfront about the mobility needs of the experience they are building which is communicated to the User Agent by explicitly requesting an appropriate `XRReferenceSpace`.  The `XRReferenceSpace` object acts as a substrate for the XR experience being built by establishing guarantees about supported motion and providing a space in which developers can retrieve `XRViewerPose` and its view matrices.  The critical aspect to note is that the User Agent (or underlying platform) is responsible for providing consistently behaved lower-capability `XRReferenceSpace` objects even when running on a higher-capability tracking system. 

There are several types of reference spaces: `viewer`, `local`, `local-floor`, `bounded-floor`, and `unbounded`, each mapping to a type of XR experience an app may wish to build.  A _bounded_ experience (`bounded-floor`) is one in which the user will move around their physical environment to fully interact, but will not need to travel beyond a fixed boundary defined by the XR hardware.  An _unbounded_ experience (`unbounded`) is one in which a user is able to freely move around their physical environment and travel significant distances.  A _local_ experience is one which does not require the user to move around in space, and may be either a "seated" (`local`) or "standing" (`local-floor`) experience. Finally, the `viewer` reference space can be used for experiences that function without any tracking (such as those that use click-and-drag controls to look around) or in conjunction with another reference space to track head-locked objects. Examples of each of these types of experiences can be found in the detailed sections below.

It is worth noting that not all experiences will work on all XR hardware and not all XR hardware will support all experiences (see [Appendix A: XRReferenceSpace Availability](#xrreferencespace-availability)).  For example, it's impossible to build an experience which requires the user to walk around on a device like GearVR. In the spirit of [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), it's strongly recommended that developers select the least capable `XRReferenceSpace` that suffices for the experience they are building. Requesting a more capable reference space will artificially restrict the set of XR devices their experience will otherwise be viewable from.

### Bounded reference space
A _bounded_ experience is one in which a user moves around their physical environment to fully interact, but will not need to travel beyond a pre-established boundary. A bounded experience is similar to an unbounded experience in that both rely on XR hardware capable of tracking a users' locomotion. However, bounded experiences are explicitly focused on nearby content which allows them to target XR hardware that requires a pre-configured play area as well as XR hardware able to track location freely.

Bounded experiences use an `XRReferenceSpaceType` of `bounded-floor`.

Some example use cases: 
* VR painting/sculpting tool
* Training simulators
* Dance games
* Previewing of 3D objects in the real world

The origin of a `bounded-floor` reference space will be initialized at a position on the floor for which a boundary can be provided to the app, defining an empty region where it is safe for the user to move around. The y value will be 0 at floor level, while the exact x, z, and orientation values will be initialized based on the conventions of the underlying platform for room-scale experiences. Platforms where the user defines a fixed room-scale origin and boundary may initialize the remaining values to match the room-scale origin. Users with fixed-origin systems are familiar with this behavior, however developers may choose to be extra resilient to this situation by building UI to guide users back to the origin if they are too far away. Platforms that generally allow for unbounded movement may display UI to the user during the asynchronous request, asking them to define or confirm such a floor-level boundary near the user's current location.

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestReferenceSpace('bounded-floor')
  .then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

The `bounded-floor` reference space also reports geometry within which the application should try to ensure that all content the user needs to interact with can be reached. This polygonal boundary represents a loop of points at the edges of the safe space. The points are given in a clockwise order as viewed from above, looking towards the negative end of the Y axis. The shape it describes is not guaranteed to be convex. The values reported are relative to the reference space origin, and must have a `y` value of `0` and a `w` value of `1`.

```js
// Demonstrated here using a fictional 3D library to simplify the example code.
function createBoundsMesh() {
  boundsMesh.clear();
  
  // Visualize the bounds geometry as 2 meter high quads
  let pointCount = xrReferenceSpace.boundsGeometry.length;
  for (let i = 0; i < pointCount - 1; ++i) {
    let pointA = xrReferenceSpace.boundsGeometry[i];
    let pointB = xrReferenceSpace.boundsGeometry[i+1];
    boundsMesh.addQuad(
        pointA.x, 0, pointA.z, // Quad Corner 1
        pointB.x, 2.0, pointB.z) // Quad Corner 2
  }
  // Close the loop
  let pointA = xrReferenceSpace.boundsGeometry[pointCount-1];
  let pointB = xrReferenceSpace.boundsGeometry[0];
  boundsMesh.addQuad(
        pointA.x, 0, pointA.z, // Quad Corner 1
        pointB.x, 2.0, pointB.z) // Quad Corner 2
  }
}
```

### Unbounded reference space
A _unbounded_ experience is one in which the user is able to freely move around their physical environment. These experiences explicitly require that the user be unbounded in their ability to walk around, and the unbounded reference space will adjust its origin as needed to maintain optimal stability for the user, even if the user walks many meters from the origin. In doing so, the origin may drift from its original physical location. The origin will be initialized at a position near the user's head at the time of creation. The exact `x`, `y`, `z`, and orientation values will be initialized based on the conventions of the underlying platform for unbounded experiences.

Unbounded experiences use an `XRReferenceSpaceType` of `unbounded`.

Some example use cases: 
* Campus tour
* Renovation preview

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestReferenceSpace('unbounded')
  .then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

There is no mechanism for getting a floor-relative _unbounded_ reference space. This is because the user may move through a variety of elevations (via stairs, hills, etc), making identification of a single floor plane impossible.

### Local reference spaces
A _local_ experience is one which does not require the user to move around in space.  There are two kinds of local experiences, eye-level local experiences and floor-level local experiences.

#### Eye-level local reference space
_Eye-level_ local experiences, sometimes referred to as "seated" experiences, initialize their origin at a position near the viewer's position at the time of creation. The exact `x`, `y`, `z`, and orientation values will be initialized based on the conventions of the underlying platform for local experiences. Some platforms may initialize these values to the viewer's exact position/orientation at the time of creation. Other platforms that allow users to reset a common local origin shared across multiple apps may use that origin instead.

Eye-level local experiences use an `XRReferenceSpaceType` of `local`.

Some example use cases: 
* Immersive 2D video viewer
* Racing simulator
* Solar system explorer

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestReferenceSpace('local')
  .then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

Orientation-only experiences such as 360 photo/video viewers can also be created with an `local` reference space by either explicitly ignoring the pose's positional data or displaying the media "infinitely" far away from the viewer. If such position mitigation steps are not taken the user may perceive the geometry the media is displayed on, leading to discomfort.

It is important to note that `XRViewerPose` objects retrieved using a `local` reference space may include position information as well as rotation information.  For example, hardware which does not support 6DOF tracking (ex: GearVR) may still use neck-modeling to improve user comfort. Similarly, a user may lean side-to-side on a device with 6DOF tracking (ex: HTC Vive). The result is that local experiences must be resilient to position changes despite not being dependent on receiving them. Experiences are encouraged to fully support head movement in a typical seated range.

For some hardware the poses may even include substantial position offsets, for example if the user stands up from their seated position and walks around. The experience can choose to react to this appropriately, for example by fading out the rendered view when intersecting geometry. Overriding the pose's reported head position, for example clamping to stay within an expected volume, can be very uncomfortable to users and should be avoided.

#### Floor-level local reference space
_Floor-level_ local experiences, which do not require the user to move around in space but wish to provide the user with a floor plane, initialize their origin at a position on the floor where it is safe for the user to engage in a "standing" experience, with a `y` value of `0` at floor level. The exact `x`, `z`, and orientation values will be initialized based on the conventions of the underlying platform for standing experiences. Some platforms may initialize these values to the viewer's exact position/orientation at the time of creation. Other platforms may place this floor-level standing origin at the viewer's chosen floor-level origin for bounded experiences. It is also worth noting that some XR hardware will be unable to determine the actual floor level and will instead use an emulated or estimated floor.

Floor-level local experiences use an `XRReferenceSpaceType` of `local-floor`.

Some example use cases: 
* VR chat "room"
* Fallback for Bounded experience that relies on teleportation instead

```js
let xrSession = null;
let xrReferenceSpace = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestReferenceSpace('local-floor')
  .then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

As with `local` reference spaces, `XRViewerPose` objects retrieved using `local-floor` reference spaces may include position information as well as rotation information and as such must be resilient to position changes despite not being dependent on receiving them. For example, if a teleport is intended to place the user's feet at a chosen virtual world location, the calculated offset must take into account that the user's current tracked position may be a couple of steps away from the floor-level origin.

### Viewer reference space
A _viewer_ reference space's origin is always at the position and orientation of the viewer device, and as such calling `getViewerPose()` with a `viewer` reference space gives the appearance of having no tracking at all. This type of reference space is primarily used for creating inline experiences that do not respond to device motion. Instead, developers may use `XRReferenceSpace.getOffsetReferenceSpace()` which is described in the [Application supplied transforms section](#application-supplied-transforms). An example usage of an _viewer_ reference space is a furniture viewer that will use [click-and-drag controls](#click-and-drag-view-controls) to rotate the furniture. It also supports cases where the developer wishes to avoid displaying any type of tracking consent prompt to the user prior while displaying inline content.

This type of reference space is requested with a type of `viewer` and returns a basic `XRReferenceSpace`. `XRViewerPose` objects retrieved with this reference space will have an identity `transform` (plus an offset if the reference space was created by calling `getOffsetReferenceSpace()`). `XRView`s populated from a `viewer` reference space will still be offset from the `XRViewerPose`'s `transform` in the same manner as all other reference spaces.

```js
let xrSession = null;
let xrViewerReferenceSpace = null;

// Create a 'viewer' reference space
function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestReferenceSpace('viewer')
  .then((referenceSpace) => {
    xrViewerReferenceSpace = referenceSpace;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

The `viewer` reference space is also useful when the developer wants to compare the viewer's location against other `XRSpace` objects.

```js
  let pose = xrFrame.getPose(preferredInputSource.gripSpace, xrViewerReferenceSpace);
  if (pose) {
    // Calculate how far the motion controller is from the user's head
  }
```

## Spatial relationships
One of the core features of any XR platform is its ability to track spatial relationships. Tracking the position and orientation, referred to together as a "pose", of the viewer is perhaps the simplest example, but many other XR platform features, such as hit testing or anchors, are rooted in understanding the space the XR system is operating in. In WebXR any feature that tracks spatial relationships is built on top of the `XRSpace` interface. Each `XRSpace` represents something being tracked by the XR system, such as an `XRReferenceSpace`, and each has a "native origin" that represents its position and orientation in the XR tracking system. It is only possible to know the location of one `XRSpace` relative to another `XRSpace` on a frame-by-frame basis.

### Rigid Transforms
Coordinates accepted as input or provided as output from WebXR are always expressed within a specific `XRSpace` chosen by the developer. When working with real-world spaces, it is important to be able to express transforms exclusively in terms of position and orientation. In WebXR this is done through the `XRRigidTransform` which contains a `position` vector and an `orientation` quaternion. When interpreting an `XRRigidTransform` the `orientation` is applied prior to the `position`. This means that, for example, a transform that indicates a quarter rotation to the right and a 1-meter translation along -Z would place a transformed object at `[0, 0, -1]` facing to the right. `XRRigidTransform`s also have a `matrix` attribute that reports the same transform as a 4×4 matrix when needed. By definition, the matrix of a rigid transform cannot contain scale or skew.

### Poses
On a frame-by-frame basis, developers can query the location of any `XRSpace` within another `XRSpace` via the `XRFrame.getPose()` function. This function takes the `space` parameter which is the `XRSpace` to locate and the `baseSpace` parameter which defines the coordinate system in which the resulting `XRPose` should be returned. The `transform` attribute of `XRPose` is an `XRRigidTransform` representing the location of `space` within `baseSpace`. 

While the `baseSpace` parameter may be any `XRSpace`, developers will often choose to supply their primary `XRReferenceSpace` as the `baseSpace` parameter so that coordinates will be consistent with those used for rendering. For more information on rendering, see the main [WebXR explainer](explainer.md).

```js
  let pose = xrFrame.getPose(xrSpace, xrReferenceSpace);
  if (pose) {
    // Do a thing
  }
```

#### Tracking loss
Developers should check initially that the result from `getPose()` is not null, as the pose of `space` within `baseSpace` may not have been established yet. For example, a viewer may not yet have been tracked within the application's primary reference space, or a motion controller may not yet have been observed after the user turned it on.

However, once a pose is initially established for a space (e.g. a `viewer` reference space or an input source's `gripSpace`), pose matrices should continue to be provided even during tracking loss. The `emulatedPosition` attribute of `XRPose` indicates that the position component of the retrieved pose matrix does not represent an actively tracked position. There are a number of reasons this might be the case. For example:
* A viewer with orientation-only tracking, whose position within a `local` reference space represents neck modeling.
* A viewer that has temporarily lost positional tracking, whose position within a reference space represents the viewer's last-known position in that space, plus inertial dead reckoning and/or neck modeling to continue providing a position.
* A motion controller with orientation-only tracking, which is positioned at an assumed position, e.g. by the user's hip.
* A motion controller that has temporarily lost positional tracking but is still held, whose orientation continues to update at the last-known position relative to the viewer.

This base tracking loss behavior enables developers to then build whatever tracking loss behavior their scenario requires.

For example, it is common in VR experiences to let the world drag along with the user during positional tracking loss, as this can be preferable to halting the experience. By continuing to render the experience when `XRViewerPose.emulatedPosition` is reporting true, this behavior can be obtained easily. In contrast, when building an experience where anchoring of rendered objects to the real world is more critical, developers can detect that `XRViewerPose.emulatedPosition` is reporting false and stop rendering the main scene, falling back to an orientation-only warning.

In contrast, many motion controllers have their own inertial tracking that can continue updating orientation while positional tracking is lost. If using a controller primarily to target distant objects, developers may choose to simply ignore `XRPose.emulatedPosition` and continue to point using each frame's updated target ray as the user rotates the controller. If using a controller to do fine operations, such as painting at the controller's tip, developers may instead choose to stop painting when `XRPose.emulatedPosition` becomes false, ensuring that only high-quality paint strokes are drawn.

#### Tracking recovery
As discussed above, during tracking loss, the viewer's pose will remain at their last-known position within each reference space, while continuing to incorporate orientation updates and any slight adjustments due to neck modeling. If the application continues to render during this time, the world will appear to drag along as the viewer moves around.

When the viewer then recovers positional tracking, the origin of each `local`, `local-floor`, `bounded-floor` and `unbounded` reference space will continue to track the same physical location as it did before tracking was lost. Therefore, in the first frame where the viewer pose's `emulatedPosition` is false again, the developer will observe an abrupt jump in the viewer pose back to its tracked position.

For experiences without a "teleportation" mechanic, this is generally the desired behavior. For example, a seated VR racing experience may align the driver seat's head position to the eye-level origin of its `local` reference space, centering the user in the driver seat when they are centered in their physical chair. By snapping the viewer pose back into position after tracking recovery, the experience remains centered around the user's physical chair.

However, if an experience does provide a "teleportation" mechanic, where the user can move through the virtual world without moving physically, it may be needlessly jarring to jump the user's position back after tracking recovery, since the exact mapping of the bounded reference space to the real world quickly becomes arbitrary anyway. Instead, when such an experience recovers tracking, it can simply resume the experience from the user's current position in the virtual world by absorbing that sudden jump into its teleportation offset. To do so, the developer detects that tracking was recovered this frame by observing a viewer pose where the `emulatedPosition` value is once again false, and then calls `getOffsetReferenceSpace()` to create a replacement reference space with its `originOffset` adjusted by the amount that the viewer's position jumped since the previous frame. `originOffset` is described in the [Application supplied transforms section](#application-supplied-transforms).

One exception to a reference space origin continuing to track its previous physical location is when the viewer regains positional tracking in a new area where the reference space's original physical origin can no longer be located. This may occur for a few reasons:
* For a `bounded-floor` reference space, the user may walk far enough to transition from the bounds of one user-defined playspace to another. In this case, the origin of the `bounded-floor` reference space will snap to the defined origin of the new playspace bounds.
* For an `unbounded` reference space, the user may walk through a dark hallway and regain tracking in a new room, with the system not knowing the spatial relationship between the two rooms. In this case, the origin of the `unbounded` reference space will end up at an arbitrary position in the new room, perhaps resetting the viewer's pose to be identity in that reference space.

In both cases above, the `onreset` event will fire for each affected reference space, indicating that the physical location of its origin has experienced a sudden discontinuity. Note that the `onreset` event fires only when the origin of the reference space itself jumps in the physical world, not when the viewer pose jumps within a stable reference space.

When an input source recovers positional tracking, its pose will instantly jump back into position. If the device tracks the input source relative to the viewer (e.g. a motion controller tracked by headset cameras) and the viewer itself still does not have positional tracking, the input source pose will continue to have an `emulatedPosition` value of true in any base space other than the `viewer` reference space. Once the input source's position in the requested space is known again, `emulatedPosition` will become false.

### Application-supplied transforms
Frequently developers will want to provide an additional, artificial transform on top of the user's tracked motion to allow the user to navigate larger virtual scenes than their tracking systems or physical space allows. This effect is traditionally accomplished by mathematically combining the API-provided transform with the desired additional application transforms. WebXR offers developers a simplification to ensure that all tracked values, such as viewer and input poses, are transformed consistently.

Developers can specify application-specific transforms by calling the `getOffsetReferenceSpace()` method of any `XRReferenceSpace`. This returns a new `XRReferenceSpace` where the `XRRigidTransform` passed to `getOffsetReferenceSpace()` describes the position and orientation of the offset space's origin in relation to the base reference space's origin. Specifically, the `originOffset` contains the pose of the new origin relative to the base reference space's origin. If the base reference space was also created with `getOffsetReferenceSpace()`, the overall offset is the combination of both transforms.

A common use case for this attribute would be for a "teleportation" mechanic, where the user "jumps" to a new point in the virtual scene, after which the selected point is treated as the new virtual origin which all tracked motion is relative to.

```js
// Teleport the user a certain number of meters along the X, Y, and Z axes,
// for example deltaX=1 means the virtual world view changes as if the user had
// taken a 1m step to the right, so the new reference space pose should
// have its X value increased by 1m.
function teleportRelative(deltaX, deltaY, deltaZ) {
  // Move the user by moving the reference space in the opposite direction,
  // adjusting originOffset's position by the inverse delta.
  xrReferenceSpace = xrReferenceSpace.getOffsetReferenceSpace(
      new XRRigidTransform({ x: -deltaX, y: -deltaY, z: -deltaZ });
}
```

### Relating between reference spaces
There are several circumstances in which developers may choose to relate content in different reference spaces.

#### Inline to Immersive
It is expected that developers will often choose to preview `immersive` experiences with a similar experience `inline`. In this situation, users often expect to see the scene from the same perspective when they make the transition from `inline` to `immersive`. To accomplish this, developers should grab the `transform` of the last `XRViewerPose` retrieved using the `inline` session's `XRReferenceSpace` and pass it to `getOffsetReferenceSpace()` on the `immersive` session's `XRReferenceSpace` to produce an appropriately offset reference space. The same logic applies in the reverse when exiting `immersive`.

#### Unbounded to Bounded 
When building an experience that is predominantly based on an `unbounded` reference space, developers may occasionally choose to switch to a `bounded-floor` reference space. For example, a whole-home renovation experience might choose to switch to a `bounded-floor` reference space for reviewing a furniture selection library.  If necessary to continue displaying content belonging to the previous reference space, developers may call the `XRFrame`'s `getPose()` method to re-parent nearby virtual content to the new reference space.

### Click-and-drag view controls
Frequently with inline sessions it's desirable to have the view rotate when the user interacts with the inline canvas. This is useful on devices without tracking capabilities to allow users to still view the full scene, but can also be desirable on devices with some tracking capabilities, such as a mobile phone or tablet, as a way to adjust the users view without requiring them to physically turn around.

By calling `getOffsetReferenceSpace()` in response to pointer events, pages can provide basic click-and-drag style controls to allow the user to pan the view around the immersive scene.

```js
// Amount to rotate, in radians, per CSS pixel of pointer movement.
const RAD_PER_PIXEL = Math.PI / 180.0; // (1 degree)

// Pan the view any time pointer move events happen over the canvas.
function onPointerMove(event) {
  // Computes a quaternion to rotate around the Y axis.
  let s = Math.sin(event.movementX * RAD_PER_PIXEL * 0.5);
  let c = Math.cos(event.movementX * RAD_PER_PIXEL * 0.5);
  xrReferenceSpace = xrReferenceSpace.getOffsetReferenceSpace(
    new XRRigidTransform(null, { x: 0, y: s, z: 0, w: c }));
}
inlineCanvas.addEventListener('pointermove', onPointerMove);
```

It should be noted that by repeatedly applying new offsets to previously offset reference spaces, numerical errors may accumulate over time. Whether that is problematic or not depends on the application, but when precision is necessary a better pattern would be to always call `getOffsetReferenceSpace()` on the original base space with the full offset computed by the application.

## Practical-usage guidelines

### Inline sessions
Inline sessions, by definition, do not require a user gesture or user permission to create, and as a result there must be strong limitations on the pose data that can be reported for privacy and security reasons. Requests for `viewer` reference spaces will always succeed. Requests for a `bounded-floor` or an `unbounded` reference space will always be rejected on inline sessions. Requests for an `local` or `local-floor` reference space may succeed but may also be rejected if the UA is unable provide any tracking information such as for an inline session on a desktop PC or a 2D browser window in a headset. The UA is also allowed to request the user's consent prior to returning an `local` or `local-floor` reference space.

### Ensuring hardware compatibility
Immersive sessions will always be able to provide `viewer`, `local`, and `local-floor` reference spaces, but may not support other `XRReferenceSpace` types due to hardware limitations.  Developers are strongly encouraged to follow the spirit of [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) and provide a reasonable fallback behavior if their desired `bounded-floor` or `unbounded` reference space is unavailable.  In many cases it will be adequate for this fallback to behave similarly to an inline preview experience.

```js
let xrSession = null;
let xrReferenceSpace = null;

function onButtonClick() {
  navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['bounded-floor'] })
    .then(onSessionStarted)
    .catch(err => {
      window.requestAnimationFrame(onDrawFrame);
    });
}

function onSessionStarted(session) {
  xrSession = session;
  // First request an bounded-floor frame of reference.
  xrSession.requestReferenceSpace('bounded-floor').then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
  }).catch(() => {
    // If a bounded-floor reference space isn't available, request a local
    // reference space as a fallback and adjust the experience as necessary.
    return xrSession.requestReferenceSpace('local').then((referenceSpace) => {
      xrReferenceSpace = referenceSpace;
    });
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

While many sites will be able to provide this fallback, for some sites this will not be possible.  Under these circumstances, it is instead preferable for session creation to reject rather than spin up immersive display/tracking systems only to immediately exit the session. To make session creation contingent on support for a specific reference space types, add them to `XRSessionInit.requiredFeatures`. For more information, see [Feature dependencies](explainer.md#feature-dependencies)

```js
let xrSession = null;
let xrReferenceSpace = null;

function beginXRSession() {
  navigator.xr.requestSession('immersive-vr', { requiredFeatures: ['unbounded'] })
    .then(onSessionStarted)
    .catch(err => {
      // Display message to the user explaining that the experience could not
      // be started.
    });
}
```

### Floor Alignment
Some XR hardware with inside-out tracking has users establish "known spaces" that can be used to easily provide `bounded-floor` and `local-floor` reference spaces.  On inside-out XR hardware which does not intrinsically provide these known spaces, the User Agent must still provide `local-floor` reference spaces. It may do so by estimating a floor level, but may not present any UI at the time the reference space is requested.  

Additionally, XR hardware with orientation-only tracking may also provide an emulated value for the floor offset of a `local-floor` reference space. On these devices, it is recommended that the User Agent or underlying platform provide a setting for users to customize this value.

### Reference space reset event
The `XRReferenceSpace` type has an event, `onreset`, that is fired when there is a discontinuity of the location of the reference space's origin in the physical world.  This discontinuity may be caused for different reasons for each type, but the result is essentially the same, the perception of the user's location will have changed.  In response, pages may wish to reposition virtual elements in the scene or clear any additional transforms, such as teleportation transforms, that may no longer be needed.  The `onreset` event will fire prior to any poses being delivered with the new origin/direction, and all poses queried following the event must be relative to the reset origin/direction. The `transform` value in the `onreset` event data indicates the specific jump of the reference space origin in the physical world, if known.

```js
xrReferenceSpace.addEventListener('reset', xrReferenceSpaceEvent => {
  // Check for the transformation between the previous origin and the current origin
  // This will not always be available, but if it is, developers may choose to use it
  let transform = xrReferenceSpaceEvent.transform;

  // For an app that allows artificial Yaw rotation, this would be a perfect
  // time to reset that.
  resetYawTransform(transform);

  // For an app using a bounded reference space, this would be a perfect time to
  // re-layout content intended to be reachable within the bounds
  createBoundsMesh(transform);
});
```

Example reasons `onreset` may fire:
* For a `local` or `local-floor` reference space, some XR systems have a mechanism for allowing the user to reset which direction is "forward" or re-center the scene's origin at their current location.
* For a `bounded-floor` reference space, a user steps outside the bounds of a "known" playspace and enters a different "known" playspace
* For an `unbounded` reference space, an inside-out based tracking system is temporarily unable to locate the user (e.g. due to poor lighting conditions in a dark hallway) and then recovers tracking in a new map fragment that cannot be related to the previous map fragment
* For an `unbounded` reference space, when the user has travelled far enough from the origin of the reference space that floating point error would become problematic

The `onreset` event will **NOT** fire when a reference space regains tracking of its previous physical origin, even if the viewer's pose suddenly jumps back into position, as the origin itself did not experience a discontinuity. The `onreset` event will also **NOT** fire as an `unbounded` reference space makes small changes to its origin as part of maintaining space stability near the user; these are considered minor corrections rather than a discontinuity in the origin.

## Appendix A : Miscellaneous

### Tracking systems overview
In the context of XR, the term _tracking system_ refers to the technology by which an XR device is able to determine a user's motion in 3D space.  There is a wide variance in the capability of tracking systems.

**Orientation-only** tracking systems typically use accelerometers to determine the yaw, pitch, and roll of a user's head.  This is often paired with a technique known as _neck-modeling_ that adds simulated position changes based on an estimation of the orientation changes originating from a point aligned with a simulated neck position.

**Outside-in** tracking systems involve setting up external sensors (i.e. sensors not built into the HMD) to locate a user in 3D space.  These sensors form a bounded area in which the user can reasonably expect be tracked.

**Inside-out** tracking systems typically use cameras and computer vision technology to locate a user in 3D space.  This same technique is also used to "lock" virtual content at specific physical locations.

### Decision flow chart

How to pick a reference space:
![Flow chart](images/frame-of-reference-flow-chart.jpg)

### Reference space examples

| Type                | Examples                                      |
| ------------        | --------------------------------------------- |
| `viewer`            | - In-page content preview<br>- Click/Drag viewing |
| `local`             | - Immersive 2D video viewer<br>- Racing simulator<br>- Solar system explorer |
| `local-floor`       | - VR chat "room"<br>- Action game where you duck and dodge in place<br>- Fallback for Bounded experience that relies on teleportation instead |
| `bounded-floor`     | - VR painting/sculpting tool<br>- Training simulators<br>- Dance games<br>- Previewing of 3D objects in the real world |
| `unbounded`         | - Campus tour<br>- Renovation preview |

### XRReferenceSpace availability

**Guaranteed** The UA will always be able to provide this reference space 

**Hardware-dependent** The UA will only be able to supply this reference space if running on XR hardware that supports it

**Rejected** The UA will never provide this reference space

| Type                | Inline             | Immersive  |
| ------------        | ------------------ | ---------- |
| `viewer`            | Guaranteed         | Guaranteed |
| `local`             | Hardware-dependent | Guaranteed |
| `local-floor`       | Hardware-dependent | Guaranteed |
| `bounded-floor`     | Rejected           | Hardware-dependent |
| `unbounded`         | Rejected           | Hardware-dependent |

## Appendix B: Proposed partial IDL
This is a partial IDL and is considered additive to the core IDL found in the main [explainer](explainer.md).

```webidl
//
// Session
//

partial dictionary XRSessionCreationOptions {
  XRReferenceSpaceType requiredReferenceSpaceType;
};

partial interface XRSession {
  Promise<XRReferenceSpace> requestReferenceSpace(XRReferenceSpaceType type);
};

//
// Rigid Transforms and Rays
//

[SecureContext, Exposed=Window,
 Constructor(optional DOMPointInit position, optional DOMPointInit orientation)]
interface XRRigidTransform {
  readonly attribute DOMPointReadOnly position;
  readonly attribute DOMPointReadOnly orientation;
  readonly attribute Float32Array matrix;
  [SameObject] readonly attribute XRRigidTransform inverse;
};

//
// Frames and Poses
//

partial interface XRFrame {
  XRPose? getPose(XRSpace space, XRSpace relativeTo);
};

[SecureContext, Exposed=Window]
interface XRPose {
  readonly attribute XRRigidTransform transform;
  readonly attribute boolean emulatedPosition;
};

//
// Space
//

[SecureContext, Exposed=Window] interface XRSpace : EventTarget {
  // Interface is intentionally opaque
};

//
// Reference Space
//

enum XRReferenceSpaceType {
  "viewer",
  "local",
  "local-floor",
  "bounded-floor",
  "unbounded"
};

[SecureContext, Exposed=Window] interface XRReferenceSpace : XRSpace {
  XRReferenceSpace getOffsetReferenceSpace(XRRigidTransform originOffset);

  attribute EventHandler onreset;
};

//
// Bounded Reference Space
//

[SecureContext, Exposed=Window]
interface XRBoundedReferenceSpace : XRReferenceSpace {
  readonly attribute FrozenArray<DOMPointReadOnly> boundsGeometry;
};

//
// Events
//

[SecureContext, Exposed=Window,
 Constructor(DOMString type, XRReferenceSpaceEventInit eventInitDict)]
interface XRReferenceSpaceEvent : Event {
  readonly attribute XRReferenceSpace referenceSpace;
  readonly attribute XRRigidTransform? transform;
};

dictionary XRReferenceSpaceEventInit : EventInit {
  required XRReferenceSpace referenceSpace;
  XRRigidTransform transform? = null;
};
```
