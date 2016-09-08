# Migrating to the latest WebVR spec

The WebVR spec has recently changed to enable wider hardware compatibility. If you have a WebVR application that was built in September 2016 or earlier you may need to update the code to ensure that your application continues to work correctly with the widest range of WebVR enabled devices.

## Do I need to do this?

* Do you call the WebVR API directly and your code calls `VRDisplay.getPose` instead of `VRDisplay.getFrameData`?
* Do you use Three.js r80 or earlier?

If you answered yes to any of those question you should update your code. For libraries not listed above you'll need to consult with the library documentation or support. In general, though, assume that any code built in September 2016 or earlier should be updated.

## What will happen if I don't update my code?

For the moment not much, but code that relies on deprecated APIs like `VRDisplay.getPose` will probably not run correctly (if at all) on new devices that add WebVR support. Eventually support for the deprecated APIs will be removed entirely, and your app won't function anywhere.

## How do I update my code?

If you are using the WebVR API directly you'll want to do the following:

### Get a shim to support older browsers.

There will be a short period of time where browsers won't have implemented the new version of the API. To support migration in the meantime include the "[WebVR 1.1 shim](js/webvr-1-1.js)" script on your page, which will wrap calls from the previous version of the API and expose them as the new API.

### Replace any uses of `VRDisplay.getPose` with `VRDisplay.getFrameData`

At bare minimum you should do a simple function swap. Since the frame data contains a VRPose you can change your call site from:

``` javascript
var pose = vrDisplay.getPose();
if (pose) {
  // Draw frame
}
```

to

``` javascript
var frameData = new VRFrameData(); // It's recommended that you create this once and reuse it for each frame.
if (vrDisplay.getFrameData(frameData)) {
  var pose = frameData.pose;
  // Draw frame
}
```

You'll probably want to change how your code is using the pose, however, which we'll cover below.

### Use the projection matrices from `VRFrameData` instead of computing them from the `VREyeParameters.fieldOfView`

This is important for ensuring that your WebVR content displays well aligned and without distortion on all hardware. Fortunately this actually means *less* work for your app! Where your code previously did something like:

``` javascript
var leftEye = vrDisplay.getEyeParameters("left");
var leftProjectionMatrix = ComputeProjectionMatrixFromFieldOfView(leftEye.fieldOfView);
gl.uniformMatrix4fv(projectionUniformLocation, false, leftProjectionMatrix);

// Draw left eye, Repeat for right eye
```

Now you'll use the projection matrix provided by the `VRFrameData` directly, like so:

``` javascript
vrDisplay.getFrameData(frameData);
gl.uniformMatrix4fv(projectionUniformLocation, false, frameData.leftProjectionMatrix);

// Draw left eye, Repeat for right eye
```

Your application should not transform the projection matrices in any way. Doing so will lead to an uncomfortable user experience.

### Use the view matrices from `VRFrameData` instead of computing your own from the pose + eye offests

`VRFrameData` also provides view matrices for each eye, which should be used instead of computing your own for the best experience. So where your code previously did something like:

``` javascript
var pose = vrDisplay.getPose();
var leftEye = vrDisplay.getEyeParameters("left");
var leftViewMatrix = ComputeViewMatrixFromPoseAndOffset(pose, leftEye.offset);
gl.uniformMatrix4fv(viewUniformLocation, false, leftViewMatrix);

// Draw left eye, Repeat for right eye
```

Now you'll want to do:

``` javascript
vrDisplay.getFrameData(frameData);
gl.uniformMatrix4fv(viewUniformLocation, false, frameData.leftViewMatrix);

// Draw left eye, Repeat for right eye
```

The view matrices CAN be transformed as needed by your application for things like artifical movement or transforming to standing space. For example, to get a standing space view matrix you would do something like this:

``` javascript
vrDisplay.getFrameData(frameData);
var inverseStandingMatrix = matrixInvert(vrDisplay.stageParameters.sittingToStandingTransform);
var leftStandingViewMatrix = matrixMultiply(frameData.leftViewMatrix, inverseStandingMatrix);
gl.uniformMatrix4fv(viewUniformLocation, false, leftStandingViewMatrix);

// Draw left eye, Repeat for right eye
```

### Don't pass a pose into `VRDisplay.submitFrame`

It's unlikely that your app was relying on this behavior anyway, but `VRDisplay.submitFrame` no longer accepts a pose. Instead it's assumed that any frame you are presenting was produced with the values returned by the last call to `VRDisplay.getFrameData` (or `VRDisplay.getPose`, but that's deprecated.)

## I use Three.js! What do I do!

Update your code to use r81 or higher. Done! No WebVR-specific code changes needed!