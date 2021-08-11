# Accessibility considerations for the WebXR Device API

## Contents

  - [Participants in this document](#participants-in-this-document)
- [Introduction to WebXR](#introduction-to-webxr)
- [Mobility concerns](#mobility-concerns)
  - [App assumptions around user measurements beyond mobility](#app-assumptions-around-user-measurements-beyond-mobility)
  - [Audio](#audio)
  - [Attention concerns/Cognition](#attention-concerns-cognition)
  - [Blindness/Low Vision/Color Blindness](#xxxx)
  - [Photosensitivity (e.g. Epilepsy)](#xxxxx)
  - [Speech recognition](#speech-recognition)
  - [Speech synthesis](#speech-synthesis)
  - [Subtitles/Captioning](#subtitles-captioning)
- [Additional WebXR Modules](#additional-webxr-modules)
- [Resources](#resources)

## Participants in this document

- Ada Rose Cannon (Samsung)
- Alex Turner (Microsoft)
- Brandon Jones (Google
- Ayşegül Yönet (Microsoft)
- Jordan Higgins (MITRE)
- Dylan Fox (XR Access)

# Introduction to WebXR

WebXR is an Web API which exposes relatively low-level access to the input and output functionality of Virtual Reality and Augmented Reality devices. The primary input is the relative location of a number of tracked devices (such as a headset or controllers), and the primary output is a graphical representation of a virtual object or scene, rendered from the point of view of a viewer device with WebGL. WebGL is an imperative API, and as such the code that produces the graphical output is not structured in a way that allows the contents of the scene to be easily determined without some form of external markup.

Because of how scenes are created and presented to users with WebXR it is very difficult to enforce or automatically provide many accessibility features. There are a wide variety of best practices, libraries, and extensions that can be employed to make WebXR experiences more accessible, however.

# Mobility concerns

Because WebXR experiences make use of tracked objects to present a convincing virtual space, they are uniquely dependent on the user’s mobility and environment in order to function.

- User mobility requirements
  - WebXR experiences might require users to physically move around their space to interact with various virtual objects. Mobility-impared users might have a difficult time accessing virtual objects as a result. 
- Height requirements
  - WebXR experiences might require users to interact with objects placed out of their reach. 
- Input/hand mobility requirements
  - WebXR experiences might require use of two hands or a specific hand, assume a certain amount of hand dexterity, assume presence of specific fingers or assume a certain hand size.
- Space requirements
  - WebXR experiences might require more physical space than the user has available to them.
- Show tracked assistive devices in scene 
  - Some assistive devices might be bulky and impede user’s movement if they can otherwise move ~freely, but the user can’t see them.

WebXR provides a variety of input mechanisms, ranging from gaze-based to fully tracked controllers or hands, and encourages developers to unify their user interactions across that full range by making use of target rays and select events, which are common to all input styles. This makes point-and-click style actions easy to expose in an input-agnostic way. Additionally, using rays allows users to interact with objects that may otherwise be out of reach.

WebXR offers several different types of tracking volumes, referred to as “Reference Spaces” by the API, which range from assuming no mobility beyond the ability to rotate to being able to move around a room to being able to move around an unlimited space. Implementations and devices might not support all reference spaces, so developers are encouraged to fall back to more limited tracking if their ideal reference space isn’t available. Mobility impared users could potentially artificially restrict the available reference spaces via an extension to ensure that experiences limit themselves to a more accessible space.

When using room-scale reference spaces, referred to as “bounded-floor” by the API, a rough boundary polygon of the user’s accessible floor space (either manually set or automatically determined) is provided to the page. Developers are encouraged to ensure that all interactive elements are contained within this boundary. Some devices also incorporate the presence of real-world objects (such as a desk, couch, or keyboard) in this boundary, and can visualize them to the user. This is a function provided by the device or OS, and is not directly exposed to the WebXR page for privacy reasons.

Many XR experiences allow for artificial locomotion in order to move the virtual scene relative to the user’s physical space. Examples include teleportation or movement via a joystick. These not only allow exploration of a space larger than the user’s physical environment, but can provide mobility-impared users the ability to move freely as well.

Some XR devices have the ability to adjust the reported viewer pose to change the user's effective position without requiring any actual movement, for example [OVR Advanced Settings](https://store.steampowered.com/app/1009850/OVR_Advanced_Settings/)'s [Motion tool](https://github.com/OpenVR-Advanced-Settings/OpenVR-AdvancedSettings#--space-offset-page) supports space dragging and a height toggle. This can be used as a replacement for artificial locomotion in applications that don't directly support it.

Similarly, a device-side pose override for tracked controllers would be able to enhance accessibility, for example a button or slider that effectively lengthens the user's arm to extend the user's reach, or a virtual hand that can continue to grasp items without requiring ongoing input. 

Pose manipulation accessibility features could be implemented by the user agent or by applications, but would be most powerful and flexible at the XR device level. For privacy, it's generally preferable that applications don't need to be aware that accessibility features are in use.

## App assumptions around user measurements beyond mobility

- IPD being near the average
- Eye boxes having no Y or Z disparity
- Stereoscopic views mean experiences may be designed for two eyes

## Audio

- Spatial audio
  - Positioning information from the API can be integrated into WebAudio’s spatial audio support to position audio sources in the immersive experience.
  - Ability to control the location of spatialized audio for hearing impairments.
- Sound levels
- Screen reading capability
- Playback speed controls
  - Ability to adjust the speed of audio cues and captions to use preference for faster or slower playback.
- Haptic and visual feedback on interactions.
- Ability to reduce ambient noises.

## Attention concerns/Cognition

- Reduce motion/animations
  - Reduce peripheral vision motion?
- Reduce background audio

## Blindness/Low Vision/Color Blindness

- Minimum font size in degrees
- System colors to use (e.g. high contrast mode)
- Alternate cues for visual alerts
  - Haptic feedback
  - Audio feedback
- Speech interaction 
- Spatial awareness to describe scene/interactive objects…
- Spatial audio to guide the user.

## Photosensitivity (e.g. Epilepsy)

- Reduce contrast and animations
- Ability to stop the animations at any moment to stop sensitive visuals.
- Simpler scenes to avoid dropping frames
  - UA lowering of viewport size to hit a consistent rate?

## Speech recognition

## Speech synthesis

## Subtitles/Captioning

- See work done by W3C Immersive Captions group led by Christopher Patnoe - just reviewed at 2021 XR Access Symposium
- Captions should clearly indicate source, and not force user to whip their head back and forth
- Ideally for video content, user should be able to skip back and forth between captions

# Additional WebXR Modules

These aren’t covered by this document but some of the additional modules to hope to cover some of the a11y shortcomings of core WebXR.

- DOM Overlay - enable use of the platforms a11y tooling on HTML content provided by developers
- DOM Layers - same as DOM Overlay
- Media Layers - provides capabilities similar to video elements (Subtitles? captions?)

# Resources

- [XR A11y user requirements](https://www.w3.org/TR/xaur/)
- [React-Three Accessibility library](https://github.com/pmndrs/react-three-a11y)
- [https://xraccess.org/](https://xraccess.org/)
- [WebXR Emulator extension](https://blog.mozvr.com/webxr-emulator-extension/)
- [Captions and Beyond: Building XR software for all users | AltspaceVR (altvr.com)](https://account.altvr.com/events/1744595154754339221)
- [XRA Developer’s Guide - Accessibility](https://xra.org/research/xra-developers-guide-accessibility-and-inclusive-design/)
- [XR Access Symposium 2021 - Breakout Discussions](https://bit.ly/xraccess2021breakouts) (see #3 on captions, #6 on accessibility object model)
