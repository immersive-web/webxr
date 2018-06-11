# WebXR Device API Specification

WebXR is driving support for accessing virtual reality (VR) and augmented reality (AR) devices, including sensors and head-mounted displays on the Web.

This is currently the repository for the [WebVR Community Group][3] and the [WebXR Device API Specification][1]. We have a [charter][4] (in progress).

The specification has recently undergone a name change, so expect to see multiple references to "WebVR" sprinkled throughout.


## Specifications

* [WebXR Device API Specification][1]: Main specification for JavaScript API for accessing VR and AR devices, including sensors and head-mounted displays.
* [Legacy WebVR API Specification][2]: Legacy WebVR API 1.1 specification for JavaScript API for accessing VR displays. Development of the WebVR API has halted in favor of being replaced the WebXR Device API. Several browsers will continue to support this version of the API in the meantime.
* [Gamepad API Specification][5]: Introduces a low-level JS API interface for accessing gamepad devices.
* [Gamepad Extensions API Specification][6]: Extends the Gamepad API to enable access to more advanced device capabilities.


## Relevant Links

* [WebVR Community Group][3]
* [WebXR Device API Specification][1]
* [Immersive Web Early Adopters Guide][16]
* [Legacy WebVR API Specification][2]
* [WebXR Charter][4]


## Communication

* [WebVR Community Group][3]
* [`public-webvr` mailing list][7]
* [GitHub issues list: `webxr`][8]
* [WebVR Slack chat][9]


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

> All Reports in this Repository are licensed by Contributors under the [W3C Software and Document License][13].
>
> Contributions to Specifications are made under the [W3C CLA][14].
>
> Contributions to Test Suites are made under the [W3C 3-clause BSD License][15]

<!-- Links -->
[1]: https://immersive-web.github.io/webxr/
[2]: https://immersive-web.github.io/webvr/
[3]: https://www.w3.org/community/webvr/
[4]: https://immersive-web.github.io/webxr/charter/
[5]: https://w3c.github.io/gamepad/
[6]: https://w3c.github.io/gamepad/extensions.html
[7]: https://lists.w3.org/Archives/Public/public-webvr/
[8]: https://github.com/immersive-web/webxr/issues
[9]: https://webvr-slack.herokuapp.com/
[10]: https://github.com/tabatkins/bikeshed
[11]: https://github.com/web-platform-tests/wpt
[12]: https://github.com/web-platform-tests/wpt/issues/new
[13]: http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
[14]: https://www.w3.org/community/about/agreements/cla/
[15]: https://www.w3.org/Consortium/Legal/2008/03-bsd-license.html
[16]: https://immersive-web.github.io/webxr-reference/
