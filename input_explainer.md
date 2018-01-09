# WebVR Input Explained

## WARNING: UNSTABLE
The content in this explainer is undergoing rapid iteration and no part of it should be considered representative of a final API.

## What is WebVR?
See the [WebVR Explainer](https://github.com/w3c/webvr/blob/master/explainer.md).

## What is WebVR Input?
Whereas the WebVR explainer is primarily concerned with detecting headset movement and displaying imagery to the user, this explainer describes how developers can receive input from the various control mechanisms provided by VR/AR headsets, whether that's a one-button gaze-based input scheme for Cardboard devices, hand poses and finger presses for HoloLens hands, or a variety of pointing-capable 6DoF motion controllers.

### Goals
Define core input models for VR/AR applications on the web by providing the following:

* A high-level, ray-based input system that works with most VR/AR systems across multiple input sources.
* Access to raw pose, button, axis and haptic data of dedicated VR/AR input sources. (tracked controllers, hands, etc.)
* Enable sites to visualize VR/AR input devices.

**Future goals:**
* Full hand articulation.

### Non-goals
* A method for providing semantic descriptions of VR/AR scenes.
* Handle every possible VR/AR input/output device. (e.g. body tracking, treadmills)
* 2D DOM input with VR/AR input sources.

As a special note on that last item: We expect that most VR/AR systems will offer a way to browse traditional 2D web pages, which effectively necessitates emulating mouse and/or touch events with the controller. This should be handled invisibly to the page.

## Use cases
VR/AR applications may receive input from a variety of different sources. These are broken down into a few categories:

**Pointing-supported**

These input sources provide their own pointing ray when tracked, based on the 6DoF pose and specific shape of the source. VR/AR applications may choose to target with this per-source pointing ray or with the user's gaze ray.

  * VR/AR controller with sufficient tracking capability to provide a pointing ray (Daydream controller, Vive controller, Oculus Touch, Windows MR controller)

**Gaze-targeted**

These input sources let users take actions, but don't provide their own pointing ray. VR/AR applications target actions from these sources based on the user's gaze ray.

  * Touchpad on the headset (GearVR)
  * Single button on the headset (Cardboard)
  * Simple handheld Bluetooth clicker with no pointing ray (Cardboard, HoloLens clicker)
  * Optical hand tracking of varying levels of detail (HoloLens hand, Leap Motion)
  * System voice commands (HoloLens/Windows MR "Select" keyword)
  * Traditional [gamepads](https://www.w3.org/TR/gamepad/)
  * Mouse (in exclusive sessions)

**Screen-space input**

For non-exclusive sessions, users may interact directly with a Magic Window using standard 2D screen-space interactions. VR/AR applications target actions based on the user's 2D pointer position over the rendered scene.

  * Mouse (in non-exclusive sessions)
  * Touch
  * Stylus

Obviously these all represent wildly different styles of input, which can be very difficult for individual applications to make sense of in a consistent manner. The primary goal of the input API is to provide a high level abstraction of all these input sources. As with non-VR/AR WebGL content the application is responsible for all rendering and hit testing.

To accomplish this, each of these categories of inputs are surfaced by the input API in a couple of ways:

**Polling:** For rendering of cursors and tracked controllers each frame, an imperative model is provided that allows the application to poll a predicted controller pose. Polling also provides that frame's controller element states.

**Gesture Events:** To handle actions with the highest cross-device compatibility, the app can register event listeners for when the user performs common actions, such as "select". These events are treated as user gestures by the UA.

Aside from generating high level gestures, the input API does not attempt to describe the state of input sources that are already surfaced by the UA, such as mouse, keyboard, touch, stylus, or gamepad inputs.

## Basic WebVR Input usage

Whether the application is using an event or polling based input system, tracking the pose of any input source is handled the same way.

If an input source can be tracked the `VRInputPose` will provide a `gripPoseMatrix` to indicate its position and orientation. This will be `null` if the input source isn't trackable or has temporarily lost tracking. The `gripPoseMatrix` is a transform into a space where if the user was holding a straight rod in their hand it would be aligned with the negative Z axis (forward) and the origin rests at their palm. This enables developers to properly render a virtual object held in the user's hand. For example, a sword would be positioned so that the blade points directly down the negative Z axis and the center of the handle is at the origin.

An input source will also provide its own preferred pointing ray through `pointerPoseMatrix`:
* For pointing-supported input sources, this will be a ray that represents the source's preferred targeting ray, pointing down the negative Z axis.  The ray should follow platform-specific guidelines if there are any, for example emerging from the tip of the controller at an angle allowing a comfortable range of motion. In the absence of hardware-specific guidance, the pointer ray should most likely point in the same direction as the user's index finger if it was outstretched while holding the controller. If the source has lost tracking, this will be `null`.
* For gaze-targeted input sources, this will be the user's head ray.
* For Magic Window input sources, this will be the ray from the user's 2D pointer location projected into the scene.

### Gesture events
Applications that want to work on the widest variety of platforms and devices will want to rely heavily on gesture events. Gesture events communicate semantically significant actions performed in VR/AR, such as making a selection.

The exact inputs that trigger these events are controlled by the UA and dependent on the hardware that the user has. For example, to perform a "select" gesture on a variety of potential hardware:
* On Daydream, the user would click the controller touchpad.
* On HoloLens, the user would perform a tap with their index finger or say the system "Select" keyword.
* On a Vive controller, Oculus Touch or Windows MR controller, the user would pull the trigger.
* On Cardboard the user would press the headsets button.

```js
function onVrStart() {
  vrSession.addEventListener("select", onSelectGesture);
}

function onSelectGesture(event) {
  // Many apps will switch their cursor mode based on
  // the last input source to receive a gesture, such as "select".
  updateCursorMode(event.inputSource);

  // Hit-test and take action on the hit object.
  let inputPose = event.frame.getInputPose(event.inputSource, vrFrameOfRef);
  if (inputPose && inputPose.pointerPoseMatrix) {
    // Ray cast into scene with the pointer to determine if anything was hit.
    let selectedObject = scene.rayPick(inputPose.pointerPoseMatrix);
    if (selectedObject) {
      onSelection(selectedObject);
    }
  }
}
```

### Choosing a cursor mode
To give users confidence in their input actions, most VR/AR apps will render a cursor and possibly a ray to visualize what will be targeted if they perform a "select" gesture.

The application should take into consideration the most recently used input sources and choose an appropriate cursor mode:
* When the app is in "pointing" mode, it should render a ray originating from that controller, optionally with a cursor shown at the point of ray intersection with the scene.
* When the app is in "gaze" mode, it should render just a cursor, as a ray emitting from the user's head would be visually confusing.
* When the app is in "screen" mode, it should not render a visual here, as the Magic Window input will likely be coming from a touchscreen or mouse, and such a gaze cursor is nonsensical.

```js
let cursorMode = vrSession.exclusive ? "gaze" : "screen";

function updateCursorMode(inputSource)
  if (!vrSession.exclusive) { // Magic Window
    cursorMode = "screen";
  } else if (inputSource.supportsPointing) { // Pointing devices
    cursorMode = "pointing";
  } else { // Clicker devices
    cursorMode = "gaze";
  }
}

function onVRFrame(vrFrame) {
  // Update the transforms for any rendered controllers.
  updateControllers(vrFrame);

  // Draw the scene, including drawing any controller meshes at
  // their newly updated transforms.
  drawScene(vrFrame);

  // Draw the appropriate cursors and rays over the scene,
  // given the current cursor mode.
  drawCursors(vrFrame);
}

function drawCursors(vrFrame) {
  if (cursorMode == "pointing") {
    let controllers = vrFrame.session.getControllers();

    // When tracked controllers are present, draw a pointer for each of them.
    for (let controller of controllers) {
      let inputPose = vrFrame.getInputPose(controller, vrFrameOfRef);

      // If the controller is capable of supporting pointing and currently has a
      // valid pointer ray we should draw the ray and cursor.
      if (inputPose && inputPose.pointerPoseMatrix) {
        // Draw a representation of the controller's pick ray for each view.
        drawRay(vrFrame.views, inputPose.pointerPoseMatrix);
        drawCursor(vrFrame.views, inputPose.pointerPoseMatrix);
      }
    }
  } else if (cursorMode == "gaze") {
    // When in gaze mode, draw a gaze cursor.
    let devicePose = vrFrame.getDevicePose(vrFrameOfRef);
    if (devicePose) {
      // Draw the gaze cursor for each view.
      drawCursor(vrFrame.views, devicePose.poseModelMatrix);
    }
  }
}
```

### Controller rendering

When using tracked controllers users expect to be able to see a visual representation of the controller in VR/AR applications. The representation typically breaks down into one of two categories: In some cases the VR app has a contextually relevant visualization that it prefers to use, such as a sword, paint brush, hands, etc. that is well suited to the mechanics and artistic direction of the app. In all other cases it's typically preferable to show something that matches what the user is physically holding as closely as possible. For AR apps, the user can see the hands or controller they are using, and so the app should skip rendering the input source.

To achieve the latter effect, applications can query a mesh that represents a given controller using `VRController`'s `mesh` attribute. Calling the `mesh`'s `requestBuffer()` method returns a promise which resolves to an `ArrayBuffer` containing a [Binary glTF 2.0](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#binary-gltf-layout) asset that visually represents the controller. The glTF asset must not reference any external resources, but may contain embedded textures. The mesh data it provides must be properly sized such that it matches the phyical controller dimensions as closely as possible using a scale of 1 unit equaling 1 real-world meter.

Multiple `VRController`s may share the same `VRControllerMesh`, which allows them to be rendered as instances of a single resource.

If the UA cannot provide a mesh that accurately reflects the user's physical hardware it is allowed to provide a generic mesh instead to ensure the user has some sense of where their controllers are. This could be something like a hand or generic remote.

Some VR/AR systems allow the user to customize the virtual appearance of their controller. The UA is allowed and encouraged to provide the customized mesh when possible to provide stronger visual continuity between web content and the native system. It should be noted, however, that this is a potential source of high fidelity fingerprinting data and as such UAs should strongly consider gaining user permission before doing exposing custom meshes.

The glTF asset should represent the various movable elements (buttons, triggers, joysticks, etc) of the controller with different nodes in the scene hierarchy so that they can be transformed independently. The UA will then need to provide a way to map `VRController` `element` states to node transforms so that the rendered controller can visually reflect the user's interactions with it's elements. This document does not have a recommendation for how to accomplish that mapping at this time. (Suggestions welcome!)

```js
function onVrStart() {
  vrSession.addEventListener("controlleradded", onControllerAdded);
}

function onControllerAdded(event) {
  loadControllerMesh(event.inputSource);
}

// Loads and renders controller meshes using a fictional 3D rendering library.
function loadControllerMesh(controller) {
  controller.mesh.requestBuffer().then((gltfArrayBuffer) => {
    controller._meshNode = GLTF2Loader.parseBinary(gltfArrayBuffer);
    scene.addNode(controller._meshNode);
  });
}

function updateControllers(vrFrame)
{
  // Update the controller state.
  let controllers = vrSession.getControllers();

  for (let controller of controllers) {
    if (controller._meshNode) {
      let controllerPose = vrFrame.getInputPose(controller, vrFrameOfRef);
      controller._meshNode.setTransform(controllerPose.gripPoseMatrix);
      // TODO: Update element transforms to match controller state.
    }
  }
}
```

## Advanced WebVR Input usage

### Controller element states
Controller elements (joysticks, touchpads, triggers, and buttons) can be read at any point, not just within frame or event callbacks, but may not be updated more frequently than the frame loop. The `VRControllerElement` objects are "live", meaning that the same object gets updated over time with new values.

The elements are provided in a map, with each element's name serving as the key. This allows them to be easily iterated over or accessed directly by name:

```js
function printControllerStates() {
  let controllers = vrSession.getControllers();

  for (let controller of controllers) {
    // Can't get poses without a VRPresentationFrame, so ignore that for now.
    let controllerString = `Controller State (hand: ${controller.hand})\n`;

    for (let [name, element] of controller.elements) {
      controllerString += controllerElementString(name, element);
    }

    console.log(controllerString);
  }
}

function controllerElementString(name, element) {
  if (!input)
    return null;

  let stateString = `  ${name} - `;

  if (input.xAxis)
    stateString += `X: ${element.xAxis}, `;

  if (input.yAxis)
    stateString += `Y: ${element.yAxis}, `;

  stateString += `pressed: ${element.pressed}, `;
  stateString += `touched: ${element.touched}, `;
  stateString += `value: ${element.value}\n`;

  return stateString;
}
```

Elements should be given lowercase names that match the description given to them by the hardware manufacturer when possible. For example, if there are buttons on the controller labeled "A" and "B", they should be named "a" and "b". If the elements did not have any obvious name, they should be given numbered names according to their percieved order of importance, such as "button1", "trigger2", etc. In addition there are several "common" element names that must be used if the controller element fits the usage they describe, even if the manufacturer provides a slightly different name. These common elements are:

 - "touchpad"
 - "joystick"
 - "trigger"
 - "grip"

This enables applications to easily check for the presence of commonly used controller elements and access their values reliably.

```js
// Updates the position of an object in the scene based on the user's thumb
// motion on whatever controller element is available.
function updateMovement(controller) {
  if (controller.elements.joystick) {
    object.x += controller.elements.joystick.axisX;
    object.y += controller.elements.joystick.axisY;
  } else if (controller.elements.touchpad) {
    if (controller.elements.touchpad.touched) {
      object.x += controller.elements.touchpad.axisX;
      object.y += controller.elements.touchpad.axisY;
    }
  }
}
```

### Mousing along the geometry of the scene
In traditional 2D UI, mouse movement on the plane of the desk maps directly to the plane of the screen, and is generally independent of the content over which the cursor is moved.  In contrast, mouse movement in VR/AR must translate 2D physical mouse movements into 3D cursor changes, which often requires knowledge of the app's scene geometry.  For example, an app may wish to move its 3D mouse cursor at a slower angular velocity over distant content, or snap the cursor's movement to the XY axes of the plane under the cursor.

As 3D mouse cursors require such an app-driven feedback loop with scene content, tracking such a cursor based on mouse motion is out of scope for `pointerPoseMatrix` as currently defined.  Instead, mouse left-clicks cause `select` gestures with a gaze-targeted or Magic Window `pointerPoseMatrix`.  This matches all other contextless input sources described above, where the UA tosses a single natural pointing ray over the wall to the app without knowledge of the scene content, similar to traditional 2D mouse UI.  

Apps or middleware may then choose to implement a 3D mouse cursor by requesting pointer lock and then handling `mouseMove` events to accumulate a custom 3D cursor position over time, reacting to scene content as they see fit.

TODO: Rationalize with onvrdisplaypointerrestricted from WebVR 1.1.

## Appendix A: I don’t understand why this is a new API. Why can’t we use…

### Pointer events
Pointer events and their various sub-parts (mouse, touch, etc.) were created with the needs of a 2D web in mind, and serve that purpose well. Trying to bolt on an understanding of 3D space would both over-complicate the APIs with functionality that most applications don't need and make VR/AR input a second-class citizen within the larger pointer even model.

We do expect that many future VR/AR uses (such as interacting with 2D DOM rectangles in 3D space) will need to emulate 2D input methods, producing appropriately transformed pointer events in response to VR/AR input.

### The Gamepad API
This was actually the first thing that we tried, extending the API with the necessary pose data. It proved to be mechanically feasible, but provided a confusing, non-semantic view of VR/AR input that left developers guessing as to what each button meant based on the device name string. Obviously that's a fairly fragile model, and not one that can reasonably extend to a robust ecosystem of hundreds of different devices. It also lacks many of the higher level concepts that we feel developers will eventually need (events for user initiation, ray generation, action mapping across devices, controller visualization, etc.)

## Appendix B: Proposed IDL

```webidl
//
// Controllers
//

interface VRInputSource {
};

interface VRGamepadInputSource : VRInputSource {
  readonly attribute Gamepad gamepad;
};

enum VRHandedness {
  "",
  "left",
  "right"
};

interface VRController : VRInputSource {
  readonly attribute VRHandedness handedness;

  // TODO: Better names for these two properties.
  readonly attribute boolean supportsPointing; 
  readonly attribute boolean supportsGrabbing; 

  readonly attribute VRControllerElementMap elements;
  readonly attribute VRControllerMesh mesh;
};

interface VRControllerElementMap {
  readonly maplike<DOMString, VRControllerElement>;
};

interface VRControllerElement {
  readonly attribute boolean pressed;
  readonly attribute boolean touched;
  readonly attribute double  value;
  readonly attribute double? xAxis;
  readonly attribute double? yAxis;
};

interface VRControllerMesh {
  Promise<ArrayBuffer> requestBuffer();
};

//
// Frame
//

interface VRInputPose {
  readonly attribute Float32Array? gripPoseMatrix;
  readonly attribute Float32Array? pointerPoseMatrix;
  // velocity/acceleration here? v0.1+?
  // readonly attribute VRHandPose? handPose; // v0.1+?
};

partial interface VRPresentationFrame {
  VRInputPose? getInputPose(VRInputSource inputSource, VRCoordinateSystem coordinateSystem);
};

//
// Session
//

partial interface VRSession {
  attribute EventHandler onselect;

  attribute EventHandler oncontrolleradded;
  attribute EventHandler oncontrollerremoved;

  FrozenArray<VRController> getControllers();
};

//
// Events
//

[Constructor(DOMString type, VRControllerEventInit eventInitDict)]
interface VRInputSourceEvent : Event {
  readonly attribute VRPresentationFrame frame;
  readonly attribute VRInputSource inputSource;
};

dictionary VRInputSourceEventInit : EventInit {
  required VRPresentationFrame frame;
  required VRInputSource inputSource;
};

[Constructor(DOMString type, VRControllerInputStateEventInit eventInitDict)]
interface VRGestureEvent : Event {
  readonly attribute VRPresentationFrame frame;
  readonly attribute VRInputSource inputSource;
  readonly attribute DOMString element;
};

dictionary VRGestureEventInit : EventInit {
  required VRPresentationFrame frame;
  required VRInputSource inputSource;
  required DOMString element;
};
```
