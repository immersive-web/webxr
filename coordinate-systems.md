# WebXR - XRCoordinateSystems et al.

# Overview

In systems that deal with 3D spaces and the placement, rotation, and relationships between objects within those spaces, coordinate systems are a standard way of organizing those relationships. In WebXR, there are two main classes which handle this functionality - XRCoordinateSystem and XRFrameOfReference.

Currently, XRFrameOfReference refers to an enumerated set of standard coordinate systems relative to which all others must be able to be expressed. These include:



*   _eye-level_: the origin and rotation of this frame of reference are the orientation of the device at the start of session.
*   _stage_: the origin and rotation of this frame of reference are in the center of a known safe playing area like a VR room.
*   _head-model_: this frame of reference is like eye-level except the translation component of the device pose is basically identity with a neck model. This is for experiences which expect the user to not move and only look around.

These are basically different ways of expressing the transform of the device in 3D space. For example, virtual objects would have the same transform in _eye-level_, _stage_, and _head-model_ FORs, it's only the device that behaves differently (more on this later). _Stage_ basically allows for a virtual translation to be applied to the native device transform and _head-model_ always locks the device translation to (0, 0, 0).

Finally, XRCoordinateSystem was not designed to be dynamic. If we want to use XRCoordinateSystems to track moving objects or reference frames, we need to design a system/API to handle that dynamicism. If we want to be able to express things like hit-test input rays relative to a device or input-source, we need to be able to represent that relationship. We also need to know what coordinate system the results are in.


# Analysis


## XRFrameOfReference


### Basics

The current API for using XRFrameOfReference (FOR) is as follows:


```
const frameOfReference = await session.requestFrameOfReference('stage');
```


Now that we have the frame of reference we want, we convert any XRCoordinateSystem into 'stage-space' by transforming by that FOR. Most simply, if we want the current transform of the device, we say:


```
let devicePose = xrFrame.getDevicePose(frameOfReference);
```


This is the pose of the device in the given FOR. If you want to think in terms of 'absolute space', the origin of all 3 styles of FORs is the start-of-session pose of the device - that is the device pose when the AR system was first activated. In fact, the documentation around the method XRFrameOfReference::TransformBasePose(TransformationMatrix base_pose) explains this well: "Transforms a given pose from a "base" coordinate system used by the XR service to the frame of reference's coordinate system." What this means is pretty simple - the conceit is that most transforms will naturally be expressed in some native system that has its own reference frame - in most cases it is relative to the start-of-service of the underlying AR/VR runtime.


### Concrete Example

A sphere is at position (11, 0, 0) in the native start-of-service reference frame. the app uses the stage FOR in order to support a room-scale VR experience with teleportation. Teleportation is functionality the app uses to allow the user to relocate their stage/room within the virtual world - basically to let the user teleport their room through space. The user is currently standing at the origin and has never teleported.

The position of the sphere is also at (11, 0, 0) in the stage FOR.

Now, the user teleports forward ten meters to (10, 0, 0). The position of the sphere is now at (1, 0, 0) in the stage FOR and still at (11, 0, 0) in the native FOR. It is also important to note that the position of the sphere would also be at (11, 0, 0) in eye-level, as that FOR is essentially a noop FOR that matches the native representation.

How does the code for this look on the Javascript app side?

Luckily, the Javascript app doesn't really need to know about any of this. The common pattern for the app logic is to get a device pose as previously shown and then use it as the transform of the virtual camera. Here is some code from the official samples:


```
let pose = frame.getDevicePose(frameOfRef);
for (let view of frame.views) {
  let viewport = session.baseLayer.getViewport(view);
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
  scene.draw(view.projectionMatrix, pose.getViewMatrix(view));
}
```


This works because, once you set the camera to use the device pose expressed in the target FOR, you can have your app work natively in "absolute-space" and rely on the camera to be in the correct position to render objects as if they were in the target FOR. What this basically means is, given that eye-level corresponds to the native AR/VR tracking system's reference frame, it is implied that the app's native reference frame - the one used for all its virtual objects - corresponds to the native tracking system's reference frame.


### Analysis

In essence, an XRFrameOfReference represents the ultimate bedrock coordinate system of the app relative to which all objects should be expressed. After all, the transform of objects in my virtual world relative to the device is ultimately what determines where and at what rotation they are rendered. This is accomplished most easily by applying the device pose in the target FOR to the virtual camera and then use that to render objects that are expressed in "absolute" transforms.

What are the implications of XRFrameOfReference inheriting from XRCoordinateSystem? The only public API method on XRCoordinate system is this:


```
Float32Array? XRCoordinateSystem.getTransformTo(XRCoordinateSystem other);
```


Using this API, I can get the transform between stage and another coordinate system, say a local coordinate system of a virtual model solar system that expresses the position of the planets relative to the main coordinate system of the sun. 


```
const stage = await session.requestFrameOfReference('stage');
const solarSystemTransform = stage.getTransformTo(solarSystemTransform);
```


What would be the reason to do this? If you are already applying the FOR to the camera, then you just need your app's 3D engine to resolve the planets into absolute-space and they will be rendered in the correct location relative to the camera. If you want to know where they are relative to the device, you still get that answer by using a pose for the device that has the target FOR applied:


```
const devicePose = frame.getDevicePose(stage).poseModelMatrix;
const solarSystemTransform = solarSystem.poseModelMatrix;
```


I now have the poses for both of these objects in absolute space for comparison. I can get the absolute transform of any of the planets by applying the _solarSystemTransform_.

Using this API, I could also get the current transform between _eye-level_ and _stage_, for example:


```
const eyeLevel = await session.requestFrameOfReference('eye-level');
const stage = await session.requestFrameOfReference('stage');
const transformBetweenEyeLevelAndStage = eyeLevel.getTransformTo(stage);
```


What would be the reason to do this? If the camera already represents the FOR, then this is not necessary. The only system that would use something like this would be one that wants to apply the FOR transform to virtual objects instead of the camera and, while you could do that instead and get the same rendering effect, it would be very strange and require a lot of math that is already happening automatically in the rendering system anyway using the camera.

So is XRFrameOfReference (FOR) is really an XRCoordinateSystem? It doesn't share the same definition as a standard 3D coordinate system - it doesn't represent a transform in a shared space that can be used to track relationships between different objects in the world. Really, it just represents the current style of determining where the device is in 3D space. For example, objects would have the same transform in _eye-level_ and _head-model_ and _stage_, it is only the **device** transform that changes. If I get up and move around in _head-model_ mode, the position of the device doesn't change and thus my position relative to objects in the world does not change - only the relationship between my orientation and the orientation of objects changes. Similar for the stage FOR - if I am playing a VR game where I teleport around the world using my stage, the translation of my device is being manipulated in order to artificially change its position relative to teleportation behavior. This naturally changes my relationship to objects in the world, as, when I teleport, an object that was previously 10 meters away might now be right in front of me. What matters here is that while the transform of the device can be represented by an XRCoordinateSystem, it is merely the nature of the translation component of that coordinate system and thus the virtual camera that changes based on which FOR mode is being used.

Possible Proposal: Instead of a class that inherits from XRCoordinateSystem, XRFrameOfReference could simply be an enumeration of different styles of representing the device/input-source poses in 3D space:


```
const devicePose = xrFrame.getDevicePose('stage');
```


Possible Proposal: FOR could even be a configuration option on the XRSession or a parameter to the call to get the device transform:


```
device.requestSession({ frameOfReference: "stage", outputContext: ctx });
or
xrSession.setDevicePoseMode("stage");
and then
const devicePose = xrFrame.getDevicePose();
```


We wouldn't need methods that convert XRCoordinateSystems to different FORs, as the positions of all devices and input-sources are always expressed implicity in terms of the current FOR.

Note: Another important thing of note is that XRFrameOfReference currently contains the stage bounds and estimated height. These will need to be moved to another API for access, probably directly on the XRSession since they are not dynamic within a session. This change should probably happen regardless as it is weird having these properties tacked on to a class inheriting from XRCoordinateSystem anyway.


## XRFRames and Dynamic XRCoordinateSystems

One consequence of the discussion above and of [#384](https://github.com/immersive-web/webxr/issues/384) is that XRCoordinateSystems must be able to be dynamic. If we have an XRCoordinateSystem that represents the device, then it MUST be actively updated each frame as the device pose changes. Alternatively, the device could always be considered at the identity and all other systems could be updated every frame, but that is obviously a huge waste of matrix math and we should just calculate absolute transforms on-demand when we need to resolve a coordinate system for some purpose.

If XRCoordinateSystems are dynamic, it means that their transforms can change each frame. This is very important if we want XRCoordinateSystem to be able to represent things like the device, controllers, moving objects, and potentially other systems like anchors that might want to have their own local coordinate systems and little clusters of objects whose relationship to each other is more important than their relationship to other objects in the world. The important question becomes how do we update these coordinate systems and how do we ensure that the timing is strict such that an outdated transform is never produced or used.

This is historically the role of XRFrame. Each XRFrame object represents the state of the world at a given time - basically they are objects that avoid the use of timestamps. To be more specific, an XRFrame instance is issued to every callback that needs to have context about which frame it is operating on - basically anything that needs to be able to calculate the positions of devices, virtual objects, or real objects in the scene.

The core problem that XRFrame is trying to solve is one from the WebVR days, which allowed you to query the "current frame's" data at any time. The issue with that was that various UA/device implementations had a difficult time with the idea of there always being a "current frame", The XRFrame concept was conceived of as being tightly scoped to a relevant callback as a way of explicitly limiting when information could be queried to ensure consistent behavior between browsers and devices so that all the browsers are aligned on when frame data is updated.

Many proposals for these dynamic representations of the world involve using XRFrame as the nexus from which all absolute transforms must be calculated. This leads to API shapes like `XRFrame.getTransform(XRCoordinateSystem)` or the reverse `XRCoordianteSystem.getTransform(XRFrame)`. If you want to get the transform between two coordinate systems, you would have to do `XRCoordinateSystem.getTransformTo(XRCoordinateSystem, XRFrame)`.

We have several options for how XRFrames could work in this world of dynamic coordinate systems:



1.  Store state or ensure we can reconstruct historic state so that any XRFrame object can be used at any time, even seconds or minutes in the future
1.  Mark XRFrame objects as invalid when the frame they represent is no longer the current frame. Return or throw errors if an XRFrame object is used after it has expired.
1.  Have one global XRFrame object that is automatically updated to the new frame when it is advanced.
1.  Get rid of XRFrame objects entirely and just put any timing-related API directly on XRSession since there is only one valid state of the world anyway

It would be good to explore the pros and cons of these different options. 

Brandon has stated that only one XRFrame object is ever valid at a given time. This is to avoid issues where XRFrame objects can be stored and reused later on which opens a can of worms of having to be able to track historic states of the world and/or reconstruct older states of the world at any time in the future. This rejects option (1).

Option (2) is designed to most closely reflect the reality of how the frame timing model works across various platforms. One issue with (2) is what happens if a developer stores the XRFrame object and tries to use it outside of the callback? Presumably this is invalid, but how do we respond if this happens - presumably we throw an exception from any XRFrame method that is used outside of the callback? It is slightly awkward to even allow the mistake of storing an XRFrame object and then trying to use it in an invalid context.

Option (3) solves the problem stated above because the XRFrame object is always valid and always up to date. The API shape could be that the XRFrame object is still provided to callbacks, however it is the global XRFrame object and is kept up-to-date so if you store it and try to call functions on it, they always work on the most current frame. This is a workable API shape, however it begs the question if there is only ever one XRFrame and it is always updated globally, why do we even have this type/object in the first place? As stated above, the XRFrame exists primarily to ensure that the scope of when certain calls are valid to make is well understood. If frame objects are only ever provided/valid within certain callbacks it's clearer, from an API ergonomics standpoint, when the functions related to it can be called. That said, we could consider just remove XRFrame from all these APIs and always implicitly use the current state of the world.

Option (4) does exactly that - removes XRFrame and just assumes we are always talking about the current frame. All APIs are simplified, for example:


```
xrSession.setDevicePoseMode("stage");
const devicePose = xrSession.getDevicePose();
```


Options (2), (3), and (4) all appear to be valid. Option (2) and (3) mainly differ in whether old XRFrame objects are invalidated or not. Option (3) removes some of the "don't do that" edge-case concerns, however it re-introduces the problem that XRFrame is meant to solve - that different platforms might not be able to handle calls dealing with world state between frames gracefully. Option (4) seems strictly better than (3) in that it at least simplifies the API surface greatly. So the question is really between (2) and (4) - 


## Relative Hit-test API

The problem of how to do pixel-perfect reticle functionality is a major use case of these APIs. The problem statement can be found [here](https://docs.google.com/document/d/1cGLkmihH4yZy5UlwyBSszWk0GGb8JJ4OGGI-INBX3YM/edit).

In order to do a hit-test with a relative ray, we did an exploration of API shape given the current definitions/relationships of XRFrame, XRFOR, and XRCoordinateSystem. This is what we came up with:


```
XRSession.requestHitTest(XRRay ray, XRCoordinateSystem cs, (bool success, XRFrame frame, Array<XRHitResult> results) => {});
XRHitResult.getMatrix(XRFrame, XRCoordinateSystem);
```


Let's go through each parameter and how it is used:

*   input
    *   ray: the ray to cast into the world and collect hits
    *   coordinate system: represents the coordinate system to which the ray is relative. This is needed in order to be able to pass in a ray that is device-relative and get an accurate result for the future frame in which the calculation was made.
*   callback
    *   success: a boolean saying whether there was an error in the request. This is needed since we can no longer use a promise if we return an XRFrame, as XRFrames are not valid except within the callback where they are issued and thus, do to the ability to store a promise for later use, would be invalid in a late-bound promise.
    *   frame: the frame for which the results are valid. This is needed as the current API shape requires XRFrame objects to resolve transforms of hits and the device
    *   coordinate system: represents the coordinate system to which the hits are relative. This is needed as hit-results are most likely expressed in native _eye-level_ space and this parameter gives the app the information it needs to convert them into other coordinate systems.

This API shape is extremely complicated. If we are always applying the device pose in the target FOR to the camera, why do we need to know where hit-results are in anything other than absolute space? We can always calculate vectors from the device to the hit in absolute space by using the device pose we get from `xrFrame.getDevicePose('stage');` or equivalent. If we want to render a reticle, we should similarly be placing our virtual reticle object in the app's absolute space as the camera is already accounting for the target reference frame. Furthermore, the underlying AR tracking system expresses hits in its native space, equivalent to eye-level, and thus those hit-results already match the implicit connection described above between the app's absolute space and the native tracking system's absolute space.

If we assume the XRFrameOfReference and XRFrame API changes proposed above, we can re-simplify the hit-test API (and use a promise again!):


```
Promise<FrozenArray<XRHitResult>> requestHitTest(XRRay ray, XRCoordinateSystem coordinateSystem);
const hitTransform = XRHitResult.hitMatrix;
```


We still need an API for getting a dynamic XRCoordinateSystem for the device, and we definitely need to have the transform of the target FOR baked in so that we get a ray relative to the right device pose. For example, we need the ray to be transformed 10 meters forward if we are in _stage_ and have transported as in the example used previously.

In order to do that we could change the API for device pose to look like this:


```
XRCoordinateSystem XRSession.getDevicePose('stage');
```


Hold on - let's review the public API on XRCoordinateSystem:

Float32Array XRCoordinateSystem::getTransformTo(XRCoordinateSystem* other);

This isn't actually what we need for the hit-test API at all. We really just want something like XRDevicePose, which just has a poseModelMatrix property and it would be implied that the matrix would represent a transform in the current FOR mode. Under the hood, the hit-test logic would update the device pose for the new frame, compose the ray with the updated poseModelMatrix for the device, and then perform the hit-test calculation and return the results in absolute space. The API shape would then be:


```
Promise<FrozenArray<XRHitResult>> requestHitTest(XRRay ray, XRDevicePose devicePose);
```


This assumes that XRDevicePose can both be used to represent both XRDevice and XRInputSource objects and that it gets automatically updated each frame. The XRHitResults would be expressed in effectively the app's native absolute space, which is the most useful, and any other math needed to transform those results into some other reference frame would be up to the app to manage. This gives us the simplest API shape and underlying implementation and gives the app the flexibility to manage its own space.


# Conclusion

There are lots of considerations here and many different shapes these APIs could take. We need to balance flexibility with simplicity and also consider where we place the burden of managing concerns about reference frames and coordinate systems. None of these APIs are finalized and none of the proposals in this document are set in stone - they are simply for framing the conversation. Hopefully, this document has helped shed light on these concepts and the relevant use-cases and we can finalize our approach in a way that works in both VR and AR and doesn't cause complexity to leak between them.
