# WebXR Device API - Spatial Tracking
This document is a subsection of the main WebXR Device API explainer document which can be found [here](explainer.md).  The main explainer contains all the information you could possibly want to know about setting up a WebXR session, the render loop, and more.  In contrast, this document covers the technology and APIs for tracking users' movement for a stable, comfortable, and predictable experience that works on the widest range of XR hardware.

## Introduction
A big differentiating aspect of XR, as opposed to standard 3D rendering, is that users control the view of the experience via their body motion.  To make this possible, XR hardware needs to be capable of tracking the user's motion in 3D space.  Within the XR ecosystem there is a wide range of hardware form factors and capabilities which have historically only been available to developers through device-specific SDKs and app platforms. To ship software in a specific app store, developers optimize their experiences for specific VR hardware (HTC Vive, GearVR, Mirage Solo, etc) or AR hardware (HoloLens, ARKit, ARCore, etc).  WebXR  development is fundamentally different in that regard; the Web gives developers broader reach, with the consequence that they no longer have predictability about the capability of the hardware their experiences will be running on.

## Frames of Reference
The wide range of hardware form factors makes it impractical and unscalable to expect developers to reason directly about the tracking technology their experience will be running on.  Instead, the WebXR Device API is designed to have developers think upfront about the mobility needs of the experience they are building which is communicated to the User Agent by explicitly requesting an appropriate `XRFrameOfReference`.  The `XRFrameOfReference` object acts as a substrate for the XR experience being built by establishing guarantees about supported motion and providing a coordinate system in which developers can retrieve `XRViewerPose` and it's view matrices.  The critical aspect to note is that the User Agent (or underlying platform) is responsible for providing consistently behaved lower-capability `XRFrameOfReference` objects even when running on a higher-capability tracking system. 

There are three types of frames of reference: `bounded`, `unbounded`, and `stationary`.  A bounded experience is one in which the user will move around their physical environment to fully interact, but will not need to travel beyond a fixed boundary defined by the XR hardware.  An unbounded experience is one in which a user is able to freely move around their physical environment and travel significant distances.  A stationary experience is one which does not require the user to move around in space, and includes "seated" or "standing" experiences.  Examples of each of these types of experiences can be found in the detailed sections below.

It is worth noting that not all experiences will work on all XR hardware and not all XR hardware will support all experiences (see Appendix A: XRFrameOfReference Availability).  For example, it is not possible to build a experience which requires the user to walk around on a device like a GearVR.  In the spirit of [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), it is strongly recommended that developers select the least capable `XRFrameOfReference` that suffices for the experience they are building.  Requesting a more capable frame of reference will artificially restrict the set of XR devices their experience will otherwise be viewable from.

### Bounded Frame of Reference
A _bounded_ experience is one in which a user moves around their physical environment to fully interact, but will not need to travel beyond a pre-established boundary.  A _bounded_ experience is similar to a _unbounded_ experience in that both rely on XR hardware capable of tracking a users' locomotion.  However, _bounded_ experiences are explicitly focused on nearby content which allows them to target XR hardware that requires a pre-configured play area as well as XR hardware able to track location freely.

Some example use cases: 
* VR painting/sculpting tool
* Training simulators
* Dance games
* Previewing of 3D objects in the real world

The origin of this type will be initialized at a position on the floor for which a boundary can be provided to the app, defining an empty region where it is safe for the user to move around. The y value will be 0 at floor level, while the exact x, z, and orientation values will be initialized based on the conventions of the underlying platform for room-scale experiences. Platforms where the user defines a fixed room-scale origin and boundary may initialize the remaining values to match the room-scale origin. Users with fixed-origin systems are familiar with this behavior, however developers may choose to be extra resilient to this situation by building UI to guide users back to the origin if they are too far away. Platforms that generally allow for unbounded movement may display UI to the user during the asynchronous request, asking them to define or confirm such a floor-level boundary near the user's current location.

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference({ type:'bounded' })
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

The `XRBoundedFrameOfReference` also reports geometry within which the application should try to ensure that all content the user needs to interact with can be reached. This polygonal boundary represents a loop of points at the edges of the safe space. The points are given in a clockwise order as viewed from above, looking towards the negative end of the Y axis. The shape it describes is not guaranteed to be convex. The values reported are relative to the frame of reference origin, and must have a `y` value of `0` and a `w` value of `1`.

```js
// Demonstrated here using a fictional 3D library to simplify the example code.
function createBoundsMesh() {
  boundsMesh.clear();
  
  // Visualize the bounds geometry as 2 meter high quads
  let pointCount = xrFrameOfReference.boundsGeometry.length;
  for (let i = 0; i < pointCount - 1; ++i) {
    let pointA = xrFrameOfReference.boundsGeometry[i];
    let pointB = xrFrameOfReference.boundsGeometry[i+1];
    boundsMesh.addQuad(
        pointA.x, 0, pointA.z, // Quad Corner 1
        pointB.x, 2.0, pointB.z) // Quad Corner 2
  }
  // Close the loop
  let pointA = xrFrameOfReference.boundsGeometry[pointCount-1];
  let pointB = xrFrameOfReference.boundsGeometry[0];
  boundsMesh.addQuad(
        pointA.x, 0, pointA.z, // Quad Corner 1
        pointB.x, 2.0, pointB.z) // Quad Corner 2
  }
}
```

### Unbounded Frame of Reference
A _unbounded_ experience is one in which the user is able to freely move around their physical environment. These experiences explicitly require that the user be unbounded in their ability to walk around, and the unbounded frame of reference will adjust its origin as needed to maintain optimal stability for the user, even if the user walks many meters from the origin. In doing so, the origin may drift from its original physical location.

Some example use cases: 
* Campus tour
* Renovation preview

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference({ type:'unbounded' })
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

> **An aside regarding XRCoordinateSystem**
>
> When building an _unbounded_ experience, developers will likely need to "lock" content to a specific physical location to prevent it from drifting as users travel beyond a few meters; this functionality is known as _anchors_.  In addition to _anchors_, today's XR platforms offer other environment-related features such as _spatial meshes_, _point clouds_, _markers_, and more. While none of these features are yet part of the WebXR Device API, there are proposed designs under active development.
>
> The common property of these additional features and `XRFrameOfReference`, is that they all act as _spatial roots_ that are independently tracked by the underlying tracking systems. The concept of a _spatial roots_ is represented in the WebXR Device API as an `XRCoordinateSystem`.  Each instance of an `XRCoordinateSystem` does not have a fixed relationship with any other.  Instead, on a frame-by-frame basis, the tracking systems must attempt to locate them and compute their relative locations.  

### Stationary Frame of Reference
A _stationary_ experience is one which does not require the user to move around in space.  This includes several categories of experiences that developers are commonly building today.  "Standing" experiences can be created by passing the `floor-level` subtype.  "Seated" experiences can be created by passing the `eye-level` subtype.  Orientation-only experiences such as 360 photo/video viewers can be created by passing the `position-disabled` subtype.

It is important to note that `XRViewerPose` objects retrieved using the `floor-level` and `eye-level` subtypes may include position information as well as rotation information.  For example, hardware which does not support 6DOF tracking (ex: GearVR) may still use neck-modeling to improve user comfort. Similarly, a user may lean side-to-side on a device with 6DOF tracking (ex: HTC Vive).  It is important for user comfort that developers do not attempt to remove position data from these matrices and instead use the `position-disabled` subtype.  The result is that `floor-level` and `eye-level` experiences should be resilient to position changes despite not being dependent on receiving them.  

#### Floor-level Subtype

The origin of this subtype will be initialized at a position on the floor where it is safe for the user to engage in "standing-scale" experiences, with a `y` value of `0` at floor level. The exact `x`, `z`, and orientation values will be initialized based on the conventions of the underlying platform for standing-scale experiences. Some platforms may initialize these values to the user's exact position/orientation at the time of creation. Other platforms may place this standing-scale origin at the user's chosen floor-level origin for bounded experiences. It is also worth noting that some XR hardware will be unable to determine the actual floor level and will instead use an emulated or estimated floor.

Some example use cases: 
* VR chat "room"
* Fallback for Bounded experience that relies on teleportation instead

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference({ type:'stationary', subtype:'floor-level' })
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

#### Eye-level Subtype

Sometimes referred to as "seated", this subtype origin will be initialized at a position near the user's head at the time of creation. The exact `x`, `y`, `z`, and orientation values will be initialized based on the conventions of the underlying platform for stationary eye-level experiences. Some platforms may initialize these values to the user's exact position/orientation at the time of creation. Other platforms that allow users to reset a common eye-level origin shared across multiple apps may use that origin instead.

Some example use cases: 
* Immersive 2D video viewer
* Racing simulator
* Solar system explorer

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference({ type:'stationary' , subtype:'eye-level' })
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

#### Position-disabled Subtype

The origin of this subtype will be initialized at a position near the user's head at the time of creation.  `XRViewerPose` objects retrieved with this subtype will have varying orientation values but will always report `x`, `y`, `z` values to be `0`.

Some example use cases: 
* 360 photo/video viewer

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference({ type:'stationary', subtype:'position-disabled' })
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

## Practical Usage Guidelines

### Inline Sessions
Inline sessions, by definition, do not require a user gesture or user permission to create, and as a result there must be strong limitations on the pose data that can be reported for privacy and security reasons.  Requests for an `XRBoundedFrameOfReference` or an `XRUnboundedFrameOfReference` will always be rejected on inline sessions.  Requests for `XRStationaryFrameOfReference` may succeed, but may also be rejected if the UA is unable provide any tracking information such as for an inline session on a desktop PC or a 2D browser window in a headset.

Additionally, some inline experiences explicitly want tracking information disabled, such as a furniture viewer that will use pointer data to rotate the furniture.  Under both of these situations, there is no `XRFrameOfReference` needed.  Passing `null` as the `XRFrameOfReference` parameter to `getViewerPose()` or `getInputPose()` will return pose data whose values are based on the identity matrix.  Developers are then free to multiply in whatever transform they choose.

### Ensuring hardware compatibility
Immersive sessions will always be able to provide a `XRStationaryFrameOfReference`, but may not support other `XRFrameOfReference` types due to hardware limitations.  Developers are strongly encouraged to follow the spirit of [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) and provide a reasonable fallback behavior if their desired `XRBoundedFrameOfReference` or `XRUnboundedFrameOfReference` is unavailable.  In many cases it will be adequate for this fallback to behave similarly to an inline preview experience.

```js
let xrSession = null;
let xrFrameOfReference = null;

function onSessionStarted(session) {
  xrSession = session;
  xrSession.requestFrameOfReference([
    { type:'unbounded' }, 
    { type:'stationary', subtype:'eye-level' }
  ])
  .then((frameOfReference) => {
    xrFrameOfReference = frameOfReference;
    if (xrFrameOfReference instanceof XRUnboundedFrameOfReference) {
      // Set up unbounded experience
    } else if (xrFrameOfReference instanceof XRStationaryFrameOfReference) {
      // Build an appropriate fallback experience if needed; perhaps similar to the inline version
    }
  })
  .then(setupWebGLLayer)
  .then(() => {
    xrSession.requestAnimationFrame(onDrawFrame);
  });
}
```

While many sites will be able to provide this fallback, for some sites this will not be possible.  Under these circumstances, it is instead preferable for session creation to reject rather than spin up immersive display/tracking systems only to immediately exit the session.

```js
function beginImmersiveSession() {
  xrDevice.requestSession({ immersive: true,  requiredFrameOfReferenceType:'unbounded' })
      .then(onSessionStarted)
      .catch(err => {
        // Error will indicate required frame of reference type unavailable
      });
}
```

### Floor Alignment
Some XR hardware with inside-out tracking has users establish "known spaces" that can be used to easily provide `XRBoundedFrameOfReference` and the `floor-level` subtype of `XRStationaryFrameOfReference`.  On inside-out XR hardware which does not intrinsically provide these known spaces, the User Agent must still provide `XRStationaryFrameOfReference` of subtype `floor-level`.  It may do so by estimating a floor level, but may not present any UI at the time the frame of reference is requested.  

Additionally, XR hardware with orientation-only tracking may also provide an emulated value for the floor offset of an `XRStationaryFrameOfReference` with the `floor-level` subtype.  On these devices, it is recommended that the User Agent or underlying platform provide a setting for users to customize this value.

### Relating between XRFrameOfReferences
There are several circumstances in which developers may choose to relate content in different frames of reference.

#### Inline to Immersive
It is expected that developers will often choose to preview `immersive` experiences with a similar experience `inline`.  In this situation, users often expect to see the scene from the same perspective when they make the transition from `inline` to `immersive`. To accomplish this, developers should grab the `poseMatrix` of the last `XRViewerPose` retrieved using the `inline` session's `XRFrameOfReference` and apply this same transform content to be displayed in the `immersive` session's `XRFrameOfReference`.  The same logic applies in the reverse when exiting `immersive`.

#### Unbounded to Bounded 
When building an experience that is predominantly based on an `XRUnboundedFrameOfReference`, developers may occasionally choose to switch to an `XRBoundedFrameOfReference`.  For example, a whole-home renovation experience might choose to switch to a bounded frame of reference for reviewing a furniture selection library.  If necessary to continue displaying content belonging to the previous frame of reference, developers may use the `coordinateSystem.getTransformTo()` method to re-parent nearby virtual content to the new frame of reference.

### Reset Event
The `XRFrameOfReference` type has an event, `onreset`, that is fired when a discontinuity of the frame of reference's origin occurs.  This discontinuity may be caused for different reasons for each type, but the result is essentially the same, the perception of the user's location will have changed.  In response, pages may wish to reposition virtual elements in the scene or clear any additional transforms, such as teleportation transforms, that may no longer be needed.  The `onreset` event will fire prior to any poses being delivered with the new origin/direction, and all poses queried following the event must be relative to the reset origin/direction. 

```js
xrFrameOfReference.addEventListener('reset', xrFrameOfReferenceEvent => {
  // Check for the transformation between the previous origin and the current origin
  // This will not always be available, but if it is, developers may choose to use it
  let transformMatrix = xrFrameOfReferenceEvent.transformMatrix;

  // For an app that allows artificial Yaw rotation, this would be a perfect
  // time to reset that.
  resetYawTransform(transformMatrix);

  // For an app using the XRBoundedFrameOfReference, this would be a perfect time to
  // re-layout content intended to be reachable within the bounds
  createBoundsMesh(transformMatrix);
});
```

Example reasons `onreset` may fire:
* Some XR systems have a mechanism for allowing the user to reset which direction is "forward" or re-center the scene's origin at their current location.
* When a user steps outside the bounds of a "known" playspace and enters a different "known" playspace
* An inside-out based tracking system is temporarily unable to locate the user (ex: due to poor lighting conditions) and is unable to relate the new map fragment to the previous map fragment when it recovers
* When the user has travelled far enough from the origin of an `XRUnboundedFrameOfReference` that floating point error would become problematic

The `onreset` event will **NOT** fire as an `XRUnboundedFrameOfReference` makes small changes to its origin as part of maintaining coordinate system stability near the user; these are considered minor corrections rather than a discontinuity in the origin.

## Appendix A : Miscellaneous

### Tracking Systems Overview
In the context of XR, the term _tracking system_ refers to the technology by which an XR device is able to determine a user's motion in 3D space.  There is a wide variance in the capability of tracking systems.

**Orientation-only** tracking systems typically use accelerometers to determine the yaw, pitch, and roll of a user's head.  This is often paired with a technique known as _neck-modeling_ that adds simulated position changes based on an estimation of the orientation changes originating from a point aligned with a simulated neck position.

**Outside-in** tracking systems involve setting up external sensors (i.e. sensors not built into the HMD) to locate a user in 3D space.  These sensors form a bounded area in which the user can reasonably expect be tracked.

**Inside-out** tracking systems typically use cameras and computer vision technology to locate a user in 3D space.  This same technique is also used to "lock" virtual content at specific physical locations.

### Decision flow chart

How to pick a frame of reference:
![Flow chart](frame-of-reference-flow-chart.jpg)

### Frame of Reference Examples

| Type                           | Subtype             | Examples                                      |
| -------------------------------| ------------------- | --------------------------------------------- |
| `XRStationaryFrameOfReference` | `position-disabled` | - 360 photo/video viewer |
| `XRStationaryFrameOfReference` | `eye-level`         | - Immersive 2D video viewer<br>- Racing simulator<br>- Solar system explorer |
| `XRStationaryFrameOfReference` | `floor-level`       | - VR chat "room"<br>- Action game where you duck and dodge in place<br>- Fallback for Bounded experience that relies on teleportation instead |
| `XRBoundedFrameOfReference`    |                     | - VR painting/sculpting tool<br>- Training simulators<br>- Dance games<br>- Previewing of 3D objects in the real world |
| `XRUnboundedFrameOfReference`  |                     | - Campus tour<br>- Renovation preview |

### XRFrameOfReference Availability

**Guaranteed** The UA will always be able to provide this frame of reference 

**Hardware-dependent** The UA will only be able to supply this frame of reference if running on XR hardware that supports it

**Rejected** The UA will never provide this frame of reference

| Type                           | Subtype             | Inline             | Immersive |
| -------------------------------| ------------------- | ------------------ | ---------- |
| `XRStationaryFrameOfReference` | `position-disabled` | Hardware-dependent | Guaranteed |
| `XRStationaryFrameOfReference` | `eye-level`         | Hardware-dependent | Guaranteed |
| `XRStationaryFrameOfReference` | `floor-level`       | Hardware-dependent | Guaranteed |
| `XRBoundedFrameOfReference`    |                     | Rejected           | Hardware-dependent |
| `XRUnboundedFrameOfReference`  |                     | Rejected           | Hardware-dependent |

## Appendix B: Proposed partial IDL
This is a partial IDL and is considered additive to the core IDL found in the main [explainer](explainer.md).

```webidl
//
// Session
//

partial dictionary XRSessionCreationOptions {
  XRFrameOfReferenceType requiredFrameOfReferenceType;
};

partial interface XRSession {
  Promise<XRFrameOfReference> requestFrameOfReference(Array<XRFrameOfReferenceOptions> preferredOptions);
};

//
// Frames and Poses
//

partial interface XRFrame {
  // Also listed in the main explainer.md
  XRViewerPose? getViewerPose(optional XRFrameOfReference frameOfReference);

  // Also listed in input-explainer.md
  XRInputPose? getInputPose(XRInputSource inputSource, optional XRFrameOfReference frameOfReference);
};

[SecureContext, Exposed=Window]
interface XRInputPose {
  readonly attribute boolean emulatedPosition;
  readonly attribute XRRay targetRay;
  readonly attribute Float32Array? gripMatrix;
};

//
// Coordinate System
//

[SecureContext, Exposed=Window] interface XRCoordinateSystem {
  Float32Array? getTransformTo(XRCoordinateSystem other);
};

//
// Frame of Reference
//

enum XRFrameOfReferenceType {
  "stationary",
  "bounded",
  "unbounded"
};

dictionary XRFrameOfReferenceOptions {
  required XRFrameOfReferenceType type;
};

[SecureContext, Exposed=Window] interface XRFrameOfReference : EventTarget {
  readonly attribute XRCoordinateSystem coordinateSystem;
  
  attribute EventHandler onreset;
};

//
// Stationary Frame of Reference
//

enum XRStationaryFrameOfReferenceSubtype {
  "eye-level",
  "floor-level",
  "position-disabled"
}

dictionary XRStationaryFrameOfReferenceOptions : XRFrameOfReferenceOptions {
  required XRStationaryFrameOfReferenceSubtype subtype;
};

[SecureContext, Exposed=Window]
interface XRStationaryFrameOfReference : XRFrameOfReference {
  readonly attribute XRStationaryFrameOfReferenceSubtype subtype;
};

//
// Bounded Frame of Reference
//

[SecureContext, Exposed=Window]
interface XRBoundedFrameOfReference : XRFrameOfReference {
  readonly attribute FrozenArray<DOMPointReadOnly> boundsGeometry;
};

//
// Unbounded Frame of Reference
//

[SecureContext, Exposed=Window] 
interface XRUnboundedFrameOfReference : XRFrameOfReference {
};

//
// Events
//

[SecureContext, Exposed=Window,
 Constructor(DOMString type, XRFrameOfReferenceEventInit eventInitDict)]
interface XRFrameOfReferenceEvent : Event {
  readonly attribute XRFrameOfReference frameOfReference;
  readonly attribute Float32Array? transformMatrix;
};

dictionary XRFrameOfReferenceEventInit : EventInit {
  required XRFrameOfReference frameOfReference;
  Float32Array transformMatrix;
};
```