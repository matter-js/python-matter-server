# Open Home Foundation Matter Server

![Matter Logo](docs/matter_logo.svg)

The Open Home Foundation Matter Server is an [officially certified](https://csa-iot.org/csa_product/open-home-foundation-matter-server/) Software Component to create a Matter controller. It serves as the foundation to provide Matter support to [Home Assistant](https://home-assistant.io) but its universal approach makes it suitable to be used in other projects too.

This project implements a Matter Controller Server over WebSockets using the
[official Matter (formerly CHIP) SDK](https://github.com/project-chip/connectedhomeip)
as a base and provides both a server and client implementation.

> [!IMPORTANT]
> We’re excited to share that the Matter Server is being rewritten on top of [matter.js](https://github.com/matter-js/matter.js)! 🎉
> This means that the current project has moved into **maintenance mode** — we’ll still fix important bugs if they come up, but all new features will land in the new project instead.
> We’ll post a link as soon as the first **alpha version** is ready for you to try out. 🚀

The Open Home Foundation Matter Server software component is funded by [Nabu Casa](https://www.nabucasa.com/) (a member of the CSA) and donated to [The Open Home Foundation](https://www.openhomefoundation.org/).

## Support

For developers, making use of this component or contributing to it, use the issue tracker within this repository and/or reach out on discord.

For users of Home Assistant, seek support in the official Home Assistant support channels.

- The Home Assistant [Community Forum](https://community.home-assistant.io/).
- The Home Assistant [Discord Chat Server](https://discord.gg/c5DvZ4e).
- Join [the Reddit subreddit in /r/homeassistant](https://reddit.com/r/homeassistant).

- If you experience issues using Matter with Home Assistant, please open an issue
  report in the [Home Assistant Core repository](https://github.com/home-assistant/core/issues/new/choose).

Please do not create Home Assistant enduser support issues in the issue tracker of this repository.

## Development

Want to help out with development, testing, and/or documentation? Great! As both this project and Matter keeps evolving there will be a lot to improve. Reach out to us on discord if you want to help out.

[Development documentation](DEVELOPMENT.md)

## Installation / Running the Matter Server

- Endusers of Home Assistant, refer to the [Home Assistant documentation](https://www.home-assistant.io/integrations/matter/) how to run Matter in Home Assistant using the official Matter Server add-on, which is based on this project.

- For running the server and/or client in your development environment, see the [Development documentation](DEVELOPMENT.md).

- For running the Matter Server as a standalone docker container, see our instructions [here](docs/docker.md).

> [!NOTE]
> Both Matter and this implementation are in an early state and features are probably missing or could be improved. See our [development notes](#development) how you can help out, with development and/or testing.
