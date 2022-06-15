# WebXR Device API Specification

[![Build Status](https://travis-ci.org/immersive-web/webxr.svg?branch=master)](https://travis-ci.org/immersive-web/webxr)

The WebXR device API is for accessing virtual reality (VR) and augmented reality (AR) devices, including sensors and head-mounted displays on the Web. 

|    |             Headset Devices             | Handheld Device e.g. Phone |
|----|:---------------------------------------:|:--------------------------:|
| VR | VR Devices, previously handled by WebVR | Magic Window Behaviour     |
| AR | Mixed Reality Headsets                  | Phone AR                   |

The [WebXR Device API Specification][1] is the repository of the [Immersive Web Working Group][17].

## Taking Part

1. Read the [code of conduct][18]
2. See if your issue is being discussed in the [issues][8], or if your idea is being discussed in the [proposals repo][19].
3. We will be publishing the minutes from the bi-weekly calls.
4. You can also join the working group to participate in these discussions.

## Specifications

* [WebXR Device API Specification][1]: Main specification for JavaScript API for accessing VR and AR devices, including sensors and head-mounted displays.
* [Explainer][21]
* [Input Explainer][22]
* [Privacy & Security Explainer][23]
* [Spatial Tracking Explainer][24]

See also [list of all specifications with detailed status in Working Group and Community Group](https://www.w3.org/immersive-web/list_spec.html). 

### Related Specifications

* [Gamepad API Specification][5]: Introduces a low-level JS API interface for accessing gamepad devices.

### Legacy
* [Legacy WebVR API Specification][2]: Legacy WebVR API 1.1 specification for JavaScript API for accessing VR displays. Development of the WebVR API has halted in favor of being replaced the WebXR Device API. Several browsers will continue to support this version of the API in the meantime.
* [Legacy Gamepad Extensions API Specification][6]: Extends the Gamepad API to enable access to more advanced device capabilities.

## Relevant Links

* [Immersive Web Community Group][3]
* [WebXR Device API Specification][1]
* [WebXR on MDN][16]
* [Immersive Web Working Group Charter][4]
* [WebXR Input Profiles][29]: WebXR Gamepad assets, source library, and schema to enable the correct display of XR input hardware in the virtual scene

## Communication

* [Immersive Web Working Group][17]
* [Immersive Web Community Group][3]
* [GitHub issues list: `webxr`][8]
* [`public-immersive-web` mailing list][20]
* [Legacy `public-webvr` mailing list archive][7]

## Maintainers

To generate the spec document (`index.html`) from the `index.bs` [Bikeshed][10] document:

```sh
make
```


## Tests

For normative changes, a corresponding
[web-platform-tests][11] PR is highly appreciated. Typically,
both PRs will be merged at the same time. Note that a test change that contradicts the spec should
not be merged before the corresponding spec change. If testing is not practical, please explain why
and if appropriate [file a web-platform-tests issue][12]
to follow up later. Add the `type:untestable` or `type:missing-coverage` label as appropriate.


## License

Per the [`LICENSE.md`](LICENSE.md) file:

> All documents in this Repository are licensed by contributors under the  [W3C Software and Document License](https://www.w3.org/Consortium/Legal/copyright-software).

<!-- Links -->
[1]: https://immersive-web.github.io/webxr/
[2]: https://immersive-web.github.io/webvr/
[3]: https://www.w3.org/community/webvr/
[4]: https://www.w3.org/2020/05/immersive-web-wg-charter.html
[5]: https://w3c.github.io/gamepad/
[6]: https://w3c.github.io/gamepad/extensions.html
[7]: https://lists.w3.org/Archives/Public/public-webvr/
[8]: https://github.com/immersive-web/webxr/issues
[10]: https://github.com/tabatkins/bikeshed
[11]: https://github.com/web-platform-tests/wpt
[12]: https://github.com/web-platform-tests/wpt/issues/new
[13]: http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
[14]: https://www.w3.org/community/about/agreements/cla/
[15]: https://www.w3.org/Consortium/Legal/2008/03-bsd-license.html
[16]: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
[17]: https://w3.org/immersive-web
[18]: https://immersive-web.github.io/homepage/code-of-conduct.html
[19]: https://github.com/immersive-web/proposals
[20]: https://lists.w3.org/Archives/Public/public-immersive-web-wg/
[21]:https://immersive-web.github.io/webxr/explainer.html
[22]:https://immersive-web.github.io/webxr/input-explainer.html
[23]:https://immersive-web.github.io/webxr/privacy-security-explainer.html
[24]:https://immersive-web.github.io/webxr/spatial-tracking-explainer.html
[25]:https://github.com/immersive-web/webxr-gamepads-module
[26]:https://github.com/immersive-web/webxr-ar-module
[27]:https://github.com/immersive-web/dom-overlays
[28]:https://github.com/immersive-web/hit-test
[29]:https://github.com/immersive-web/webxr-input-profiles
[30]:https://github.com/immersive-web/layers
[31]:https://github.com/immersive-web/webxr-hands-input
[32]:https://github.com/immersive-web/anchors
[33]:https://github.com/immersive-web/computer-vision
[34]:https://github.com/immersive-web/geo-alignment
[35]:https://github.com/immersive-web/lighting-estimation
[36]:https://github.com/immersive-web/navigation
[37]:https://github.com/immersive-web/performance-improvements
[38]:https://github.com/immersive-web/real-world-geometry
[39]:https://github.com/immersive-web/spatial-favicons
[40]:https://github.com/immersive-web/depth-sensing
[41]:https://github.com/immersive-web/WebXR-WebGPU-Binding
