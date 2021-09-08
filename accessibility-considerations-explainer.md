# Accessibility considerations for the WebXR Device API

## Contents

  - [Participants in this document](#participants-in-this-document)
- [Introduction to WebXR](#introduction-to-webxr)
- [Mobility concerns](#mobility-concerns)
  - [App assumptions around user measurements beyond mobility](#app-assumptions-around-user-measurements-beyond-mobility)
  - [Audio](#audio)
  - [Attention concerns/Cognition](#attention-concernscognition)
  - [Blindness/Low Vision/Color Blindness](#blindnesslow-visioncolor-blindness)
  - [Photosensitivity (e.g. Epilepsy)](#photosensitivity-eg-epilepsy)
  - [Speech recognition](#speech-recognition)
  - [Speech synthesis](#speech-synthesis)
  - [Subtitles/Captioning](#subtitlescaptioning)
- [Additional WebXR Modules](#additional-webxr-modules)
- [Resources](#resources)

## Participants in this document

- Ada Rose Cannon (Samsung)
- Alex Turner (Microsoft)
- Brandon Jones (Google)
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

In order for WebXR experiences to be presented with a convincing 3D effect, multiple views of a scene must be rendered from the point of view of the user's eyes. This can lead to a negative experience if the page makes assumptions about metrics like:

- User's IPD being near the average
- User's eye boxes having no Y or Z disparity
- User has two eyes

Some basic measurements or approximations of the position of the user's eyes needs to be made available to the page in order for a convincing stereo effect to be displayed. The accuracy of these positions will depend on the hardware's capabilities and in many cases the correctness of the user's manual configuration. In order to prevent assumptions about the above measurements WebXR does not provide IPD or similar measurements directly, but instead makes them part of an array of view transforms provided to the page. These transforms take into account not only the position of the user's eyes, but also the position and orientation of their head in space and are intended to be used for placement of virtual cameras within the scene. While the user's IPD could potentially be reverse engineered from these values and replaced with atrifical averages, doing so would be significantly more work than simply using the transforms as-is. As a result, the current system creates a 'pit of success' where the easiest way to use the values returned by the API is also the most widely accessible.

In term of the number of eyes a user posesses, current hardware has no way of detecting and reporting that, and even if it did we would not want to surface that to the web for privacy reasons. It's expected that wih every few exceptions (a virtual eye test, for example) stereo content should not be unusable for users that lack one eye. Content rendered for stereo presentation will generally show a similar view to both eyes, since experiences that show conflicting information to each eye will be uncofortable to nearly all users. Also, while stereo depth does aid in our perception of a 3 dimensional world it is not the only depth hint our brains process, and other cues such as parallax movement can also be accurately reproduced by most XR systems as a natural consequence of their tracking systems.

## Audio

- Spatial audio
  - Positioning information from the API can be integrated into WebAudio’s spatial audio support to position audio sources in the immersive experience.
  - Ability to control the location of spatialized audio for hearing impairments.
- Screen reading capability
- Playback speed controls
  - Ability to adjust the speed of audio cues and captions to use preference for faster or slower playback.
- Haptic and visual feedback on interactions.
- Sound levels
- Ability to reduce ambient noises.

WebXR has no explicit APIs for handling audio, but the positional data that it generates can be easily relayed to the WebAudio API's [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode), or libraries built on top of it such as [Resonance Audio](https://resonance-audio.github.io/resonance-audio/), to generate convicing spatial audio. The WebXR Samples repo has a [Positional Audio Sample](https://github.com/immersive-web/webxr-samples/blob/main/positional-audio.html) that demonstrates one way this can be done.

By providing the necessary primitives to communicate between WebXR and WebAudio developers are free to create whatever type of sound processing best meets the needs of their application. It also creates an environment, however, where standards around how spatialized audio should be handled are difficult to establish and will naturally tend to exist at an application/library level rather than within the APIs or OS/hardware itself. The APIs cannot force good spatial audio to be included in every applications, nor can they guarantee that any audio that is played by the application is well aligned with and representative of the visual scene. Similarly, support for accessibility aids such as haptic and visual feedback will most frequently fall to individual libraries that have more context around how the audio is being used than the low-level browser APIs.

Some functionality, such as controlling overall sound volume, will commonly be handled at a system level. Those volume controlls will usually not have the ability to separate out different sound sources, such as dialog or ambient noise, as the low-level sound systems have no way of distinguising the purpose of a given audio stream and multiple audio sources are frequently mixed together prior to being set to the system for playback. As such individual control over the volume of those elements would usually fall to an application or library.

## Attention concerns/Cognition

- Reduce motion/animations
  - Reduce peripheral vision motion? For example, SteamVR offers a platform-level [Field of View override](https://steamcommunity.com/games/250820/announcements/detail/3021332002084697042)
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
- Color blindness settings 
    - [playcanvas support](https://playcanvas.com/project/827671/overview/accessibility-fx) based on guidlines from Electronic Arts.
    - example: ![](https://i.imgur.com/HWKyzZG.png)

- 

## Photosensitivity (e.g. Epilepsy)

- Reduce contrast and animations
- Ability to stop the animations at any moment to stop sensitive visuals.
  - If the platform provides a System/Home button, that should dim and/or pause the scene's visual content sufficiently to meet this goal. (TODO: how is this currently implemented across platforms, and does the spec define behavior?)
- Simpler scenes to avoid dropping frames
  - UA lowering of viewport size to hit a consistent rate?

## Speech recognition

Speech Recognition is used to interact with the scene without needing to use any input device. Since there is no universal control scheme for interacting with scenes this would need to be implemented by developers on a per-experience level. They could use commands like "turn left", "move forward" & "press button". This creates issues with internationalisation as it will need to be supported in multiple languages. 

The speech recognition API is unfortunately experimental and has very limited support, this could be an important use case for other browsers to support it.

## Speech synthesis

There are multiple uses for Speech Synthesis which may require different kinds of voice over. Voice overs which are describing the environment or what the user is currently seeing and the status of objects would probably be best presented through the user's existing assistive technology if it is being used. Using APIs like WebXR DOM Overlay will allow accessible text and interactive elements. Unfortunately DOM Overlay itself has limited use outside of Augmented Reality on handheld devices preventing this from being used for headmounted VR and AR.

The other method is using the [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) to manually trigger read outs. This API has pretty good support. If the user is using assitive voice over technology this will sound different and probably be read out a lot slower than they are accustomed to but if the developer wanted to provide an description of what is currently happening this would be a good method to get started with.

Neither of these methods of Speech Synthesis are not exposed via Web Audio so cannot be spatialised. Using stereo audio to indicate the source of the sound would provide many benefits for helping navigate an environment. Having a method of speech synthesis which is exposed to Web Audio would be very beneficial and worth raising to the group in charge of SpeechSynthesis.

3rd path, machine learning voices...

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
