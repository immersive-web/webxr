# Privacy and security

The WebXR Device API enables developers to build content for AR and VR hardware that uses one or more sensors to infer information about the real world, and may then present information about the real world either to developers or directly to the end user. In such systems there are a wide range of input sensor types used (cameras, accelerometers, etc), and a variety of real-world data generated. This data is what allows web developers to author WebXR-based experiences. It also enables developers to infer information about users such as profiling them, fingerprinting their device, and input sniffing. Due to the nature of the Web, WebXR has a higher responsibility to protect users from malicious data usage than XR experiences delivered through closed ecosystem app stores.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Contents

  - [Concepts](#concepts)
    - [Sensitive information](#sensitive-information)
    - [Device Fingerprinting](#device-fingerprinting)
    - [User Profiling](#user-profiling)
    - [Private Browsing modes](#private-browsing-modes)
- [Protection types](#protection-types)
  - [Trustworthy documents and origins](#trustworthy-documents-and-origins)
    - [Focus and visibility](#focus-and-visibility)
    - [Feature policy](#feature-policy)
      - [Underlying sensors feature policy](#underlying-sensors-feature-policy)
  - [Trusted UI](#trusted-ui)
  - [User intention](#user-intention)
    - [User activation](#user-activation)
    - [Implied consent](#implied-consent)
    - [Explicit consent](#explicit-consent)
    - [Duration of consent](#duration-of-consent)
    - [Querying consent status](#querying-consent-status)
  - [Data adjustments](#data-adjustments)
    - [Throttling](#throttling)
    - [Rounding, quantization, and fuzzing](#rounding-quantization-and-fuzzing)
    - [Limiting](#limiting)
- [Protected functionality](#protected-functionality)
  - [Immersiveness](#immersiveness)
  - [Poses](#poses)
    - [XRPose](#xrpose)
    - [XRViewerPose](#xrviewerpose)
  - [Reference spaces](#reference-spaces)
    - [Unbounded reference spaces](#unbounded-reference-spaces)
    - [Bounded reference spaces](#bounded-reference-spaces)
    - [Local-floor spaces](#local-floor-spaces)
    - [Local reference spaces](#local-reference-spaces)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Concepts

### Sensitive information
In the context of XR, sensitive information includes, but is not limited to, user configurable data such as interpupillary distance (IPD) and sensor-based data such as poses. All `immersive` sessions will expose some amount of sensitive data, due to the user's pose being necessary to render anything. However, in some cases, the same sensitive information will also be exposed via `inline` sessions.

### Device Fingerprinting
The user agent must take steps (where possible) to prevent exposing data that is unique to the device. This is true even if consent has been obtained for other reasons. For example, while it is recommended to obtain user consent to mitigate [user profiling](#user-profiling) based on IPD data, it is also recommended that the exposed IPD data be anonymized to in order to mitigate fingerprinting.

Some raw sensor data might be fingerprinted (e.g. IMU data) and thus on some user agents access to that raw sensor data outside of WebXR requires user consent. In cases where the same sensor fingerprinting risk exists for WebXR data, [explicit consent](#explicit-consent) is strongly recommended if the user agent does not anonymize the data sufficiently to mitigate the risk.

Specific approaches to mitigating device fingerprinting are up to the user agent, which is best equipped to evaluate the actual threat on a given platform.

### User Profiling
This explainer prioritizes highly the protection of user demographic characteristics such as race, gender, or age. If there is a reasonable possibility that a reliable signal for such characteristics exists for some population of users, then [explicit consent](#explicit-consent) is strongly recommended.

Such consent is strongly recommended even if only _some_ users could be profiled. For example, [user-configured IPD data might allow a site to determine the race, gender, or age of some users](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.62.6181&rep=rep1&type=pdf), so  [explicit consent](#explicit-consent) is strongly recommended for all users (even though a strong signal might only be available for a small proportion of the total population).

This recommendation is _not_ made in cases where data provides only a weak signal for all users, or where the information inferred is not particularly sensitive. For example, while the size of a user's room could (in theory) indicate a user's wealth, it might just as easily indicate that a user is at work; this ambiguity suggests the signal is unreliable and thus [explicit consent](#explicit-consent) is not strongly recommended.

### Private Browsing modes
User agents may support a mode (e.g., private browsing) of operation intended to preserve user anonymity and/or ensure records of browsing activity are not persisted on the client.

There is no persistent data or unique user identifier data generated by the WebXR Device API. As such, there are no additional requirements for such modes.

# Protection types
WebXR must be structured to ensure end users are protected from developers gathering and using sensitive information inappropriately. The necessary protections will vary based on the sensitive data being guarded, and, in some cases, more than one protection is necessary to adequately address the potential threats exposed by specific sensitive information.

## Trustworthy documents and origins
When sensitive information can be exposed, the requesting document must be:
* [Responsible](https://html.spec.whatwg.org/multipage/webappapis.html#responsible-document)
* Of a [secure context](https://w3c.github.io/webappsec-secure-contexts/#secure-contexts)
* The [currently focused area](https://html.spec.whatwg.org/multipage/interaction.html#currently-focused-area-of-a-top-level-browsing-context)
* Of the [same origin-domain](https://html.spec.whatwg.org/multipage/origin.html#same-origin-domain) as the [active document](https://html.spec.whatwg.org/multipage/browsers.html#active-document)
* Of an origin not blocked by [feature policy](#feature-policy)
* **TODO** Address the outcome of [#732](https://github.com/immersive-web/webxr/issues/732)

### Focus and visibility
XRSessions may have one of three visibility states: visible, visible-blurred, and hidden. When the user is interacting with a potentially sensitive UI from the UA (like URL entry), XRSessions must have their [visibility state set to hidden or visible-blurred](https://github.com/immersive-web/webxr/issues/724). If the visibility state is set to visible-blurred in this situation, the following restrictions must be placed on data delivered to sessions:
-**TODO** fill in with what's agreed upon in [#743](https://github.com/immersive-web/webxr/issues/743)

In this situation, WebXR must be structured to protect users from 'input sniffing,' for example, using pose data to infer what keyboard input a user has typed during password entry. For this reason, pose data should only be available to a session that is visible and same-origin to the currently focused area while a Trusted UI is displayed to the user.

However, visible-blurred should not be viewed as a substitute for TrustedUI and applications should not infer that 'visible-blurred' state indicates that the user is performing a sensitive task.


### Feature policy
**TODO** Fill this in with what is agreed upon in [#308](https://github.com/immersive-web/webxr/issues/308), [#729](https://github.com/immersive-web/webxr/issues/729), [#730](https://github.com/immersive-web/webxr/issues/730), and [#731](https://github.com/immersive-web/webxr/issues/731).

#### Underlying sensors feature policy
In addition to the WebXR specific feature policy, feature policies for underlying sensors must also be respected if a site could isolate and extract sensor data that would otherwise be blocked by those feature policies. WebXR must not be a 'back door' for accessing data that is otherwise prevented.

## Trusted UI
The concept of [“Trusted UI”](https://github.com/immersive-web/webxr/issues/719) is what allows User Agents to display a UI to end users on which sensitive information can be displayed and interacted with such that a website cannot snoop on it and cannot spoof it. Some features which use Trusted UI are user consent prompts, URL bars, navigation controls, favorite/bookmarks, and many more.

In 2D browsers, Trusted UI is presented either exclusively around the outside of a web page’s visual container or overlapping with it partially. In the context of an immersive experience, the definition of a [“Trusted Immersive UI”](https://github.com/immersive-web/webxr/issues/718) is a bit more complex due to the fact there is no “outside” of immersive content; all pixels the user sees are rendered by the immersive content.

User agents must support a Trusted UI with the following properties:
- non-spoofable
- indicates where the request/content displayed originates from
- if it relies on a shared secret with the user, the shared secret must be unobservable by an MR capture
- it is consistent between immersive experiences in the same UA
- avoid spamming/overloading the user with prompts
- easy to intentionally grant consent (e.g. the UI should be easily discovered)
- hard to unintentionally grant user consent (e.g. the UI should prevent clickjacking)
- provides clear methods for the user to revoke consent and verify the current state of consent

A Trusted UI may be immersive or non-immersive, provided it conforms to the above properties. A Trusted Immersive UI does not exit immersive mode. UAs are not required to provide a Trusted Immersive UI and may instead temporarily pause/exit immersive mode and provide a non-immersive Trusted UI.

Examples of Trusted UIs are:
- the default 2D mode browser in non-immersive mode
- a prompt shown within immersive mode which can only be interacted with via a reserved hardware button
- pausing the immersive session to show a form of non-spoofable native system environment

## User intention
It is often necessary to be sure of user intent before exposing sensitive information or allowing actions with a significant effect on the user's experience. This intent may be communicated or observed in a number of ways.

### User activation
[User activation](https://html.spec.whatwg.org/multipage/interaction.html#activation) is defined within the HTML spec as an action the user can take which can result in certain types of HTML elements becoming activated. For example, a button becomes activated when a user clicks it with a mouse. The concept of user activation differentiates user-caused events from injected events to prevent pages from spoofing user actions. Within a WebXR session, `XRInputSource.select`is also considered to be triggered by user activation.  For more information, see [Input events](input-explainer.md#input-events).

### Implied consent
A User Agent may use implied consent based, for example, on the install status of a web application or frequency and recency of visits. Given the sensitivity of XR data, caution is strongly advised when relying on implicit signals. 

### Explicit consent
It is often useful to get explicit consent from the user before exposing sensitive information. When gathering explicit user consent, User Agents present an explanation of what is being requested and provide users the option to decline. Requests for user consent can be presented in many visual forms based on the features being protected and User Agent choice. While often associated with the [Permissions API](https://www.w3.org/TR/permissions/), the concept of user consent does not have exact overlap. If sensitive data is protected by explicit consent and will be used during an `XRSession`, and consent has not already been obtained, it is strongly recommended that User Agents display the associated consent prompt prior to the session being created.

### Duration of consent
It is recommended that once explicit consent is granted for a specific [origin](https://html.spec.whatwg.org/multipage/origin.html) that this consent persist until the [browsing context](https://html.spec.whatwg.org/multipage/browsers.html#browsing-context) has ended. User agents may choose to lengthen or shorten this consent duration based upon implicit or explicit signals of user intent, but implementations are advised to exercise caution when deviating from this recommendation, particularly when relying on implicit signals.

## Data adjustments
In some cases, security and privacy threats can be mitigated through throttling, quantizing, rounding, limiting, or otherwise adjusting the data reported from the WebXR APIs. This may sometimes be necessary to avoid fingerprinting, even in situations when user intent has been established.  However, data adjustment mitigations can only be used in situations which would not result in user discomfort.

### Throttling
Throttling is when sensitive data is reported at a lower frequency than otherwise possible. This mitigation has the potential to reduce a site's ability to infer user intent, location, or perform user profiling. However, when not used appropriately throttling runs a significant risk of causing user discomfort. In addition, under many circumstances it may be inadequate to provide a complete mitigation.  For example, 2D touch input data snooping has been proven possible at frequencies as [low as 20Hz](https://arxiv.org/pdf/1602.04115.pdf) via accelerometer data.

### Rounding, quantization, and fuzzing
Rounding, quantization, and fuzzing are three categories of mitigations that modify the raw data that would otherwise be returned to the developer. Rounding decreases the precision of data by reducing the number of digits used to express it. Quantization constrains continuous data to instead report a discrete subset of values. Fuzzing is the introduction of slight, random errors into the the data. Collectively, these mitigations are useful in WebXR to avoid fingerprinting, and are especially useful when doing so does not cause noticeable impact on user comfort.

### Limiting
Limiting is when data is reported only when it is within a specific range. For example, it is possible to comfortably limit reporting positional pose data when a user has moved beyond a specific distance away from an approved location. Care should be taken to ensure that the user experience is not negatively affected when employing this mitigation. It is often desireable to avoid a 'hard stop' at the at the end of a range as this may cause disruptive user experiences.

# Protected functionality
The sensitive information exposed via WebXR can be divided into categories that share threat profiles and necessary protections against those threats.

## Immersiveness
Users must be in control of when immersive sessions are created because the creation causes invasive changes on a user's machine. For example, starting an immersive session will engage the XR device sensors, take over access to the device's display, and begin presentation which may terminate another application's access to the XR hardware. It may also incur significant power or performance overhead on some systems or trigger the launching of a status tray or storefront.

Developers indicate the desire to create an immersive session by passing `immersive-vr` into `xr.requestSession()`. 

```js
// VR button click handler
function onVRClick() {
  xr.requestSession('immersive-vr').then(onVRSessionCreated);
}
```

In response, the UA must ensure that:
* The function was invoked in response to a [user activation](#user-activation) event
* The request originates from a [trustworthy document and origin](#trustworthy-documents-and-origins)
* The request originates from a document that is [visible and has focus](#visibility-and-focus)
* The request originates from a document allowed to use the WebXR [feature policy](#feature-policy) as well as the [underlying sensors' feature policies](#underlying-sensors-feature-policies)
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)

If these requirements are not met, the promise returned from `requestSession()` must reject.

## Poses
### XRPose
When based on sensor data, calls to `XRFrame.getPose()` will expose sensitive information that may be misused in a number of ways, including input sniffing, gaze tracking, or fingerprinting.

Developers indicate the desire for `XRPose` data by calling `XRFrame.getPose()`.

```js
function onSessionRafCallback(XRFrame frame) {
    let motionControllerPose = frame.getPose(xrSession.inputSources[0], xrReferenceSpace);
}
```

For every call to `XRFrame.getPose()`, the UA must ensure that:
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent); alternatively, in cases where the user experience is not negatively affected, [data adjustments](#data-adjustments) may be applied to prevent the fingerprinting of underlying sensor data
* The request originates from the document which owns the `XRFrame`'s `XRSession`
* The document is [visible and has focus](#visibility-and-focus)
* The `XRSession.visibility` is set to `visible` 
* **TODO** address issues [#696](https://github.com/immersive-web/webxr/issues/696) and [#724](https://github.com/immersive-web/webxr/issues/724)

> Note: On some systems it is possible that XRPose data may allow a site to fingerprint a device through sensor calibration data (ref: [1](https://www.ieee-security.org/TC/SP2019/papers/405.pdf), [2](https://arxiv.org/pdf/1605.08763.pdf), [3](https://arxiv.org/pdf/1503.01874.pdf)). This risk may vary depending upon hardware, operating system, and the methods used to generate pose data from sensors. User agents must either mitigate such fingerprinting risk, or be sure of user intent before exposing such data.

### XRViewerPose
The primary difference between `XRViewerPose` and `XRPose` is the inclusion of `XRView` information. More than one view may be present for a number of reasons. One example is a headset, which will generally have two views, but may have more to accommodate greater than 180 degree field of views. Another example is a CAVE system. In all cases, when more than one view is present and the physical relationship between these views is configurable by the user, the relationship between these views is considered sensitive information as it can be used to fingerprint or profile the user.

Developers indicate the desire for `XRViewerPose` data by calling `XRFrame.getViewerPose()`.

```js
function onSessionRafCallback(XRFrame frame) {
    let viewerPose = frame.getViewerPose(xrReferenceSpace);
}
```

In addition to meeting the [`XRPose`](#xrpose) requirements, every call to `XRFrame.getViewerPose()` which will return more than one `XRView` must additionally ensure that:
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)
* If `XRView` data is affected by settings that may vary from device to device, such as static interpupillary distance, variations in screen geometry, or user-configured interpupillary distance, then the XRView data must be anonymized to prevent fingerprinting. Specific approaches to this are at the discretion of the user agent.
* If `XRView` data is affected by a user-configured interpupillary distance, then it is strongly recommended that the UA require [explicit consent](#explicit-consent) prior to the creation of the `XRReferenceSpace` passed into `XRFrame.getViewerPose()`.

> Note: Interpupillary distance may allow a site to reliably determine sensitive user characteristics such as [age, race and gender](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.62.6181&rep=rep1&type=pdf). It is strongly recommended that user agents seek [explicit consent](#explicit-consent) before exposing data where a site could learn the user's actual interpupillary distance. Given the sensitivity of this data, caution is advised when relying upon [implicit signals](#implied-consent).

## Reference spaces
### Unbounded reference spaces
Unbounded reference spaces reveal the largest amount of spatial data and may result in user profiling and fingerprinting. For example, this data may enable determining user’s specific geographic location or to perform gait analysis.

Developers indicate the desire for unbounded viewer tracking at the time of session creation by adding `unbounded` to either `XRSessionInit.requiredFeatures` or `XRSessionInit.optionalFeatures`. 

```js
function onXRClick() {
  xr.requestSession('immersive-vr', { requiredFeatures: ['unbounded'] } )
  .then(onARSessionCreated);
}
```

In response the UA must ensure that:
* The document is allowed to use all the policy-controlled features associated with the sensor types used to track the native origin of an unbounded reference space
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)
* The XR device is capable of unbounded tracking

If these requirements are not met and `unbounded` is listed in `XRSessionInit.requiredFeatures` then the promise returned from `requestSession()` must be rejected. Otherwise, the promise may be fulfilled but future calls to `XRSession.requestReferenceSpace()` must fail when passed `unbounded`.

Once a session is created, developers may attempt to create an unbounded reference space by passing `unbounded` into `XRSession.requestReferenceSpace()`.

```js
let xrReferenceSpace;
function onSessionCreated(session) {
  session.requestReferenceSpace('unbounded')
  .then((referenceSpace) => { xrReferenceSpace = referenceSpace; })
  .catch( (e) => { /* handle gracefully */ } );
}
```
> Note: Unbounded coordinate systems may allow a site to determine the user's geographic location, for example by matching [trajectory data with known patterns such as roadways or paths](https://ieeexplore.ieee.org/document/8406600). It is strongly recommended that user agents seek [explicit consent](#explicit-consent) with an explanation that the user's location may be determined. Given the sensitivity of this data, caution is advised when relying upon [implicit signals](#implied-consent).

### Bounded reference spaces
Bounded reference spaces, when sufficiently constrained in size, do not enable developers to determine geographic location. However, because the floor level is established and users are able to walk around, it may be possible for a site to infer the user’s height or perform gait analysis, allowing user profiling and fingerprinting. In addition, it may be possible perform fingerprinting using the bounds reported by a bounded reference space.

Developers indicate the desire for bounded viewer tracking at the time of session creation by adding `bounded-floor` to either `XRSessionInit.requiredFeatures` or `XRSessionInit.optionalFeatures`. 

```js
function onVRClick() {
  xr.requestSession('immersive-vr', { requiredFeatures: ['bounded-floor'] } )
  .then(onVRSessionCreated);
}

xr.requestSession('inline', { optionalFeatures: ['bounded-floor'] } )
  .then(onInlineSessionCreated);
}
```

In response, the UA must ensure that:
* The document is allowed to use all the policy-controlled features associated with the sensor types used to track the native origin of a bounded reference space
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)
* The device is capable of bounded tracking

If these requirements are not met and `bounded-floor` is listed in `XRSessionInit.requiredFeatures` then the promise returned from `requestSession()` must be rejected. Otherwise, the promise may be fulfilled but future calls to `XRSession.requestReferenceSpace()` must fail when passed `bounded-floor`.

Once a session is created, developers may attempt to create a bounded reference space by passing `bounded-floor` into `XRSession.requestReferenceSpace()`.

```js
let xrReferenceSpace;
function onSessionCreated(session) {
  session.requestReferenceSpace('bounded-floor')
  .then((referenceSpace) => { xrReferenceSpace = referenceSpace; })
  .catch( (e) => { /* handle gracefully */ } );
}
```

In response, the UA must ensure that: 
* Bounded reference spaces are allowed to be created based on the restrictions above
* Any group of `local`, `local-floor`, and `bounded-floor` reference spaces that are capable of being related to one another must share a common native origin; this restriction does not apply when `unbounded` reference spaces are also able to be created
* `XRBoundedReferenceSpace.boundsGeometry` must be [limited](#limiting) to a reasonable distance from the reference space's native origin; the suggested default distance is 15 meters in each direction
* Each point in the `XRBoundedReferenceSpace.boundsGeometry` must be [rounded](#rounding) sufficiently to prevent fingerprinting while still ensuring the rounded bounds geometry fits inside the original shape. Rounding to the nearest 5cm is suggested.
* If the floor level is based on sensor data or is set to a non-default emulated value, the `y` value of the native origin must be [rounded](#rounding) sufficiently to prevent fingerprinting of lower-order bits; rounding to the nearest 1cm is suggested
* All `XRPose` and `XRViewerPose` 6DoF pose data computed using a `bounded-floor` reference space must be [limited](#limiting) to a reasonable distance beyond the `boundsGeometry` in all directions; the suggested distance is 1 meter beyond the bounds in all directions

If these requirements are not met, the promise returned from `XRSession.requestReferenceSpace()` must be rejected.

> Note: Viewer height may allow a site to reliably determine sensitive user characteristics such as age. It is strongly recommended that user agents seek [explicit consent](#explicit-consent) while warning the user that their height may be determined. Given the sensitivity of this data, caution is advised when relying upon [implicit signals](#implied-consent).

### Local-floor spaces
On devices which support 6DoF tracking, `local-floor` reference spaces may be used to perform gait analysis, allowing user profiling and fingerprinting. In addition, because the `local-floor` reference spaces provide an established floor level, it may be possible for a site to infer the user’s height, allowing user profiling and fingerprinting.  

Developers indicate the desire for `local-floor` viewer tracking at the time of session creation by adding `local-floor` to either `XRSessionInit.requiredFeatures` or `XRSessionInit.optionalFeatures`.

```js
function onVRClick() {
  xr.requestSession('immersive-vr', { requiredFeatures: ['local-floor'] } )
  .then(onVRSessionCreated);
}
```

In response, the UA must ensure that:
* The document is allowed to use all the policy-controlled features associated with the sensor types used to track the native origin of a `local-floor` reference space
* User intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)
* The device is capable of `local-floor` tracking

If these requirements are not met and `local-floor` is listed in `XRSessionInit.requiredFeatures` then the promise returned from `requestSession()` must be rejected. Otherwise, the promise may be fulfilled but future calls to `XRSession.requestReferenceSpace()` must fail when passed `local-floor`.

Once a session is created, developers may attempt to create `local-floor` reference spaces by passing `local-floor` into `XRSession.requestReferenceSpace()`.

```js
let xrReferenceSpace;
function onSessionCreated(session) {
  session.requestReferenceSpace('local-floor')
  .then((referenceSpace) => { xrReferenceSpace = referenceSpace; })
  .catch( (e) => { /* handle gracefully */ } );
}
```

In response, the UA must ensure that: 
* `local-floor` reference spaces are allowed to be created based on the restrictions above
* Any group of `local`, `local-floor`, and `bounded-floor` reference spaces that are capable of being related to one another must share a common native origin; this restriction does not apply when `unbounded` reference spaces are also permitted to be created
* If the floor level is based on sensor data or is set to a non-default emulated value, the `y` value of the native origin must be [rounded](#rounding) sufficiently to prevent fingerprinting of lower-order bits; rounding to the nearest 1cm is suggested
* All `XRPose` and `XRViewerPose` 6DoF pose data computed using a `local-floor` reference space is [limited](#limiting) to a reasonable distance from the reference space's native origin; the suggested default distance is 15 meters in each direction

If these requirements are not met, the promise returned from `XRSession.requestReferenceSpace()` must be rejected.

> Note: Viewer height may allow a site to reliably determine sensitive user characteristics such as age. It is strongly recommended that user agents seek [explicit consent](#explicit-consent) while warning the user that their height may be determined. Given the sensitivity of this data, caution is advised when relying upon [implicit signals](#implied-consent).

### Local reference spaces
On devices which support 6DoF tracking, `local` reference spaces may be used to perform gait analysis, allowing user profiling and fingerprinting.

When creating an immersive session, developers do not need to explicitly request the desire for `local` viewer tracking. However, this desire must be indicated when creating an `inline` session by adding `local` to either `XRSessionInit.requiredFeatures` or `XRSessionInit.optionalFeatures`. 

```js
xr.requestSession('inline', { optionalFeatures: ['local'] } )
  .then(onInlineSessionCreated);
}

function onVRClick() {
  xr.requestSession('immersive-vr')
  .then(onVRSessionCreated);
}
```

In response, the UA must ensure that:
* The document is allowed to use all the policy-controlled features associated with the sensor types used to track the native origin of a `local` reference space
* If the session mode is `inline`, user intention is well understood, either via [explicit consent](#explicit-consent) or [implied consent](#implied-consent)
* The device is capable of `local` tracking

If the session is immersive and these requirements are not met then the promise returned from `requestSession()` must be rejected.  If the session is `inline` and has `local` listed in `XRSessionInit.requiredFeatures` then the promise returned from `requestSession()` must also be rejected. Otherwise, the promise may be fulfilled but future calls to `XRSession.requestReferenceSpace()` must fail when passed `local`.

Once a session is created, developers may attempt to create local reference spaces by passing either `local` into `XRSession.requestReferenceSpace()`.

```js
let xrReferenceSpace;
function onSessionCreated(session) {
  session.requestReferenceSpace('local')
  .then((referenceSpace) => { xrReferenceSpace = referenceSpace; })
  .catch( (e) => { /* handle gracefully */ } );
}
```

In response, the UA must ensure that: 
* `local` reference spaces are allowed to be created based on the restrictions above
* Any group of `local`, `local-floor`, and `bounded-floor` reference spaces that are capable of being related to one another must share a common native origin; this restriction does not apply when `unbounded` reference spaces are also permitted to be created
* All `XRPose` and `XRViewerPose` 6DoF pose data computed using a `local` reference space is [limited](#limiting) to a reasonable distance from the reference space's native origin; the suggested default distance is 15 meters in each direction

If these requirements are not met, the promise returned from `XRSession.requestReferenceSpace()` must be rejected.
