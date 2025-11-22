# OS Requirements

Matter is based on IPv6 link-local multicast protocols and thus running the Matter Server (or developing it) is not as straightforward as any other application, mostly due to the bad shape of IPv6 support in various Linux distributions, let alone the IPv6 Neighbor
Discovery Protocol, which is required for Thread.

## Networking

Matter uses link-local multicast protocols which do not work across different LANs or VLANs so best to use either a complete flat network or ensure that the machine running Matter Server is on the same (v)LAN as the devices, any border routers and the phone/device used for commissioning.

The host network interface needs IPv6 support enabled.

Be aware of any (semi) professional networking gear such as Unifi or Omada which has options to filter multicast traffic, often called something like "Multicast optimizations" or something along those lines. Disable such features, they are helpful in a high density enterprise network, but they're killing domestic protocols that rely on multicast like Matter, Airplay etc.

Also do not enable any mdns forwarders on the network (the option is called mDNS on Unifi for example) as they tend to corrupt or severely hinder the Matter packets on the network.

In some cases it is known that IGMP/MLD snopping implementations on network gear may help or hinder Matter traffic. Play with these options if you have network equipment that offer it.

As a general rule of thumb, if you use standard, home user oriented network equipment, you have the highest rate of success with Matter.

## Operating system

The only supported operating systems for developing or running the Matter Server are (recent) versions of (64 bits) MacOS and a very recent distribution (including kernel) of Linux. Running it on non 64 bits architecture or another operating system (even WSL) is not supported.

For a MacOS (development) environment, things will work fine out of the box from MacOS 14 or higher (arm-based CPU). In combination with a python venv, it makes up for the recommended development environment for working on the Matter codebase.

For a Linux operating system, keep the following recommendations in mind:

> your host must process ICMPv6 Router Advertisements. See the [openthread.io
> Bidirectional IPv6 Connectivity code labs](https://openthread.io/codelabs/openthread-border-router#6)
> on how-to setup your host correctly. Note that NetworkManager has its own ICMPv6
> Router Advertisement processing. A recent version of NetworkManager is
> necessary, and there are still known issues (see NetworkManager issue
> [#1232](https://gitlab.freedesktop.org/NetworkManager/NetworkManager/-/issues/1232)).

The Home Assistant Operating System 10 and newer correctly processes ICMPv6 Router Advertisements. The Matter Server is provided as an add-on to that operating system, thus including all the required fixes.

### Requirements to communicate with Thread devices through Thread border routers

For communication through Thread border routers which are not running on the same
host as the Matter Controller server to work, IPv6 routing needs to be properly
working. IPv6 routing is largely setup automatically through the IPv6 Neighbor
Discovery Protocol, specifically the Route Information Options (RIO). However,
if IPv6 Neighbor Discovery RIO's are processed, and processed correctly depends on the network
management software your system is using. There may be bugs and caveats in
processing this Route Information Options.

In general, make sure the kernel option `CONFIG_IPV6_ROUTER_PREF` is enabled and
that IPv6 forwarding is disabled (sysctl variable `net.ipv6.conf.all.forwarding`).
If IPv6 forwarding is enabled, the Linux kernel doesn't employ reachability
probing (RFC 4191), which can lead to longer outages (up to 30min) until
network changes are detected.

If you are using NetworkManager, make sure to use at least NetworkManager 1.42.
Previous versions lose track of routes and stale routes can lead to unreachable
Thread devices. All current released NetworkManager versions can't handle
multiple routes to the same network properly. This means if you have multiple
Thread border routers, the fallback won't work immediately (see [NetworkManager
issue #1232](https://gitlab.freedesktop.org/NetworkManager/NetworkManager/-/issues/1232)).

We currently don't have experience with systemd-networkd. It seems to have its
own IPv6 Neighbor Discovery Protocol handling.

If you don't use NetworkManager or systemd-networkd, you can use the kernel's
IPv6 Neighbor Discovery Protocol handling.

Make sure the kernel options `CONFIG_IPV6_ROUTE_INFO` is enabled and the
following sysctl variables are set:

```sh
sysctl -w net.ipv6.conf.wlan0.accept_ra=1
sysctl -w net.ipv6.conf.wlan0.accept_ra_rt_info_max_plen=64
```

If your system has IPv6 forwarding enabled (not recommended, see above), you'll
have to use `2` for the accept_ra variable. See also the [Thread Border Router - Bidirectional IPv6 Connectivity and DNS-Based Service Discovery codelab](https://openthread.io/codelabs/openthread-border-router#6).
