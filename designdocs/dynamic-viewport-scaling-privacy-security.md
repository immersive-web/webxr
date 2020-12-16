# Security and Privacy Questionnaire

This document answers the [W3C Security and Privacy
Questionnaire](https://www.w3.org/TR/security-privacy-questionnaire/) for the
dynamic viewport scaling feature that is part of the WebXR API. Note that the dynamic viewport scaling feature is only exposed during an active WebXR session.

**What information might this feature expose to Web sites or other parties, and for what purposes is that exposure necessary?**

The API can expose a value that is correlated with current GPU utilization through the recommendedViewportScale attribute. 

**Is this specification exposing the minimum amount of information necessary to power the feature?**

The intention is for the attribute to be quantized, this is proposed in https://github.com/immersive-web/webxr/pull/1151 (pending at the time of writing this.)

**How does this specification deal with personal information or personally-identifiable information or information derived thereof?**

The API does not provide access to personal or personally-identifiable information.

**How does this specification deal with sensitive information?**

I don't think that any data involved with this API involves sensitive information.

**Does this specification introduce new state for an origin that persists across browsing sessions?**

No. The API is only available during a WebXR session, and does not store any data that persists across sessions.

**What information from the underlying platform, e.g. configuration data, is exposed by this specification to an origin?**

The API can provide an optional recommendedViewportScale that can correlate with GPU performance.

**Does this specification allow an origin access to sensors on a user’s device**

No.

**What data does this specification expose to an origin? Please also document what data is identical to data exposed by other features, in the same or different contexts.**

The optional recommendedViewportScale is intended to be based on a heuristic involving GPU utilization and overall system performance, 
with the goal being to help an application reach a target frame rate. Applications could also obtain similar information by manually scaling their render target
and measuring frame times via rAF timestamps. 

**Does this specification enable new script execution/loading mechanisms?**

No.

**Does this specification allow an origin to access other devices?**

No.

**Does this specification allow an origin some measure of control over a user agent’s native UI?**

No.

**What temporary identifiers might this this specification create or expose to the web?**

None.

**How does this specification distinguish between behavior in first-party and third-party contexts?**

No new aspects. (The underlying WebXR API does distinguish them through the 
["xr-spatial-tracking"](https://immersive-web.github.io/webxr/#permissions-policy) permissions policy.)

**How does this specification work in the context of a user agent’s Private Browsing or "incognito" mode?**

No new aspects.

**Does this specification have a "Security Considerations" and "Privacy Considerations" section?**

Not on its own, but the overall WebXR specification does.

**Does this specification allow downgrading default security characteristics?**

No.

**What should this questionnaire have asked?**

Not specifically, but I think it can be a bit confusing to answer these questions for modifications to
a pre-existing API or specification. Would it be useful if there were a variant TAG review questionnaire
or guidance specifically for cases like this?
