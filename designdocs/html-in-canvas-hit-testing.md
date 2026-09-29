# HTML-in-Canvas Hit Testing in WebXR

## Status

This document is a design proposal for integrating
[HTML-in-Canvas](https://github.com/WICG/html-in-canvas/) hit testing with
immersive WebXR sessions. It is intended to guide future specification work.

## Summary

HTML-in-Canvas allows DOM elements to be rendered into a canvas while retaining
their DOM semantics for accessibility and hit testing. For ordinary 2D canvas
content, authors keep the DOM hit-test location synchronized with the rendered
location by applying the corresponding transform to the source element.

WebXR should extend this model to controller and other target-ray input. When an
eligible HTML-in-Canvas element is displayed as a rectangle in an immersive
scene, its used CSS transform can describe that rectangle in the session's local
coordinate system. The user agent can intersect WebXR target rays with the
transformed element, map the intersection back to CSS pixel coordinates, run
normal DOM hit testing, and dispatch trusted DOM input events.

No `XRDOMSurface` registration object is required. The element is the identity
of the interactive surface, `layoutsubtree` provides the author opt-in, and the
canvas graphics context associates the element with an `XRSession`.

## Goals

- Allow HTML rendered into a WebXR scene to receive controller and other
  target-ray input as normal DOM input.
- Preserve HTML focus, form controls, scrolling, accessibility, and default
  actions.
- Let authors use the same model transform for rendering and XR hit testing.
- Route input through normal DOM hit testing and event dispatch.
- Avoid requiring WebXR composition layers or a new surface-registration API.

## Non-goals

- Inferring arbitrary mesh geometry or texture-coordinate mappings.
- Determining whether application-rendered geometry occludes an HTML surface.
- Supporting multiple interactive placements of the same DOM element.
- Exposing cross-origin content omitted by HTML-in-Canvas's read-back-allowed
  rendering rules.

## Why a Transform Is Sufficient

The interactive surface is restricted to the element's rectangular border box.
A finite, invertible affine transform can fully describe the rectangle's
position, orientation, and size in three-dimensional space. The transform maps
element-local CSS pixel coordinates to coordinates measured in meters in the
immersive session's local coordinate system.

The transform is a model transform. It MUST NOT contain an `XRView`'s view or
projection transform. View and projection transforms differ between eyes and
are not needed to intersect an input source's target ray with the surface.

The application remains responsible for rendering the HTML-in-Canvas image at
the location described by the element's transform. This is consistent with the
2D HTML-in-Canvas model, where the application is responsible for keeping the
drawn content and DOM hit-test geometry synchronized.

## Proposed WebXR Changes

### Feature descriptor

Introduce a provisional `"html-in-canvas"` feature descriptor for immersive
sessions. The name can be revised during standardization.

```js
const session = await navigator.xr.requestSession("immersive-vr", {
  requiredFeatures: ["html-in-canvas"]
});
```

The feature is supported when the user agent can route WebXR target-ray input to
eligible HTML-in-Canvas content. It MUST NOT be granted to inline sessions.

Without the feature, HTML-in-Canvas rendering continues to work, but WebXR input
is not automatically routed to the DOM content.

### Eligible elements

Define an element as an **XR canvas hit-test root** when all of the following are
true:

- It is a direct child of an `HTMLCanvasElement` with `layoutsubtree` enabled.
- The canvas owns a graphics context used to render the active immersive
  `XRSession`.
- The session was granted the `"html-in-canvas"` feature.
- The element has a generated border box.
- The element and its relevant ancestors allow pointer hit testing.

Descendants of an XR canvas hit-test root participate in normal DOM hit testing.
Properties such as `pointer-events`, clipping, visibility, stacking order, and
disabled form-control state continue to apply.

An element has at most one interactive XR placement. If an author draws the
same element at multiple locations, only the location represented by its used
transform participates in XR hit testing. Authors can clone content when they
need multiple independently interactive placements.

### Local-space transform

For XR hit testing, the used CSS transform of an XR canvas hit-test root,
including `transform-origin`, MUST be interpreted as mapping the element's local
border-box coordinate system into the immersive session's local coordinate
system.

- The untransformed element lies on `z = 0`.
- Local `x` and `y` coordinates are measured in CSS pixels.
- Transformed coordinates are measured in meters.
- The transform MUST be finite, invertible, and affine.
- The element's transformed front face is the interactive face.

The session-local coordinate system should be defined as the native coordinate
system represented by an un-offset `"local"` reference space. Immersive sessions
already require support for local reference spaces.

This gives the transform's scale component a precise role: it converts CSS
pixels into meters. For example, a 400 CSS pixel wide element rendered as a
one-meter-wide rectangle would include a horizontal scale of `1 / 400`.

### Transform snapshot timing

The user agent MUST use a transform and border-box snapshot that corresponds to
the content used for the most recently presented XR frame. This avoids routing
input to the new location of an element while the user is still seeing its old
location.

The exact synchronization point needs to be coordinated with HTML-in-Canvas's
`paint` event and rendering snapshot. A likely model is:

1. Capture eligible element geometry during the HTML-in-Canvas rendering update.
2. Associate that geometry with the XR frame that consumes the resulting canvas
   or texture content.
3. Continue using the geometry associated with the most recently presented
   frame until a newer frame is presented.

If an implementation cannot associate a transform update with a presented XR
frame, it SHOULD use the most recently completed HTML-in-Canvas rendering
snapshot.

### XR input routing

Before processing a primary action for an `XRInputSource` with a target ray, the
user agent should perform the following steps:

1. Obtain the target ray's pose in the session's local coordinate system at the
   input event timestamp.
2. For each eligible XR canvas hit-test root, apply the inverse of its transform
   to the target ray.
3. Intersect the transformed ray with the element's `z = 0` plane.
4. Discard intersections behind the ray origin, outside the element's border
   box, or on the element's back face.
5. Select the nearest remaining intersection. CSS painting order breaks ties
   between coplanar surfaces.
6. Use the intersection's element-local `x` and `y` coordinates to run normal
   DOM hit testing within the hit-test root.
7. Route platform-appropriate trusted pointer events and default actions to the
   resulting DOM target.

The same process can generate pointer movement, enter, leave, hover, button,
click, focus, scrolling, and pointer-capture behavior where supported by the
input device and platform.

DOM events generated from the input source's primary action should carry normal
user-activation semantics. This allows controls such as text inputs to focus and
invoke the system keyboard.

### Interaction with WebXR input events

The hit-test result should be used directly as the DOM hit-test target. Pointer
and click events are dispatched to the topmost descendant at the element-local
intersection point, not to the canvas or the fallback root unless normal DOM
hit testing selects one of those elements.

No new event is needed. DOM event routing is independent of the existing WebXR
`selectstart`, `selectend`, and `select` events and does not suppress them.

### Occlusion

The user agent is not required to inspect application-rendered color or depth
buffers to determine whether another object occludes an XR canvas hit-test root.
Authors are responsible for keeping element transforms and hit-test eligibility
consistent with what they render.

An author can temporarily remove a surface from hit testing with existing CSS,
for example by setting `pointer-events: none` or removing its generated box.
This matches the existing HTML-in-Canvas model, where drawing and DOM hit-test
geometry are synchronized by the application.

### Security and privacy

Only content included in HTML-in-Canvas's read-back-allowed rendering should be
eligible for XR hit testing. Content omitted from the rendered snapshot MUST NOT
receive invisible XR input.

In particular, cross-origin embedded content excluded from HTML-in-Canvas
rendering must also be excluded from hit testing. If HTML-in-Canvas later permits
interactive cross-origin rendering, WebXR should apply the protections from the
DOM Overlays Module, including pose limiting and suppression of gamepad state
while the user interacts with that content.

## Required Specification Work

The proposal requires coordinated changes across specifications:

1. **WebXR Device API:** Define the feature descriptor, session-local transform
   interpretation, target-ray intersection algorithm, and integration with
   primary-action processing.
2. **HTML-in-Canvas:** Define how its rendering snapshot exposes the used border
   box, transform, clipping, and hit-test tree to WebXR input processing.
3. **Pointer Events and HTML:** Confirm trusted event, pointer identity, focus,
   default-action, pointer-capture, and user-activation behavior.

## Open Questions

- Should the feature descriptor be named `"html-in-canvas"`,
  `"html-in-canvas-input"`, or something more general such as
  `"dom-surface-input"`?
- Should transforms persist until changed, or must they be refreshed for every
  XR frame?
- How should hit testing behave when the document does not receive a rendering
  opportunity during an immersive session?
- Should continuous pointer movement be required or only primary-action event
  routing?
- Should cylindrical or other non-planar mappings be addressed by a future API?
- Is CSS painting order the correct tie-breaker for intersecting coplanar
  elements from different canvas subtrees?
