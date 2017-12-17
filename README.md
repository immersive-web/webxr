# WebXR Device API Specification

WebXR is driving support for accessing virtual reality (VR) and augmented reality (AR) devices, including sensors and head-mounted displays on the Web.

This is currently the repository for the [WebVR Community Group](https://www.w3.org/community/webvr/) and the [WebXR Device API Specification](https://immersive-web.github.io/webxr/). We have a [charter](https://immersive-web.github.io/webxr/charter/) (in progress).

The specification has recently undergone a name change, so expect to see multiple references to "WebVR" sprinkled throughout.


## Specifications

* [WebXR Device API Specification](https://immersive-web.github.io/webxr/): Main specification for JavaScript API for accessing VR and AR devices, including sensors and head-mounted displays.
* [Legacy WebVR API Specification](https://immersive-web.github.io/webvr/): Legacy WebVR API 1.1 specification for JavaScript API for accessing VR displays. Development of the WebVR API has halted in favor of being replaced the WebXR Device API. Several browsers will continue to support this version of the API in the meantime.
* [Gamepad API Specification](https://w3c.github.io/gamepad/): Introduces a low-level JS API interface for accessing gamepad devices.
* [Gamepad Extensions API Specification](https://w3c.github.io/gamepad/extensions.html): Extends the Gamepad API to enable access to more advanced device capabilities.


## Relevant Links

* [WebVR Community Group](https://www.w3.org/community/webvr/)
* [WebXR Device API Specification](https://immersive-web.github.io/webxr/)
* [Legacy WebVR API Specification](https://immersive-web.github.io/webvr/)
* [WebXR Charter](https://immersive-web.github.io/webxr/charter/)


## Communication

* [WebVR Community Group](http://www.w3.org/community/webvr/)
* [`public-webvr` mailing list](http://lists.w3.org/Archives/Public/public-webvr/)
* [GitHub issues list: `webxr`](https://github.com/immersive-web/webxr/issues)
* [WebVR Slack chat](https://webvr-slack.herokuapp.com/)


## Maintainers

To generate the spec document (`index.html`) from the `index.bs` [Bikeshed](https://github.com/tabatkins/bikeshed) document:

```sh
make
```


## Tests

For normative changes, a corresponding
[web-platform-tests](https://github.com/w3c/web-platform-tests) PR is highly appreciated. Typically,
both PRs will be merged at the same time. Note that a test change that contradicts the spec should
not be merged before the corresponding spec change. If testing is not practical, please explain why
and if appropriate [file a web-platform-tests issue](https://github.com/w3c/web-platform-tests/issues/new)
to follow up later. Add the `type:untestable` or `type:missing-coverage` label as appropriate.


## License

Per the [`LICENSE.md`](LICENSE.md) file:

> All Reports in this Repository are licensed by Contributors under the [W3C Software and Document License](http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).
>
> Contributions to Specifications are made under the [W3C CLA](https://www.w3.org/community/about/agreements/cla/).
