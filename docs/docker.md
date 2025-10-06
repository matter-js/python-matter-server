# Running Matter Server in Docker

For testing/evaluation purposes or as a guideline towards other application developers that want to run the Matter Server, we do provide an [official Docker container image](https://github.com/home-assistant-libs/python-matter-server/pkgs/container/python-matter-server). Just make sure that the underlying operating system on which you intend to run the docker container matches the [requirements needed for Matter and Thread](os_requirements.md) so better not attempt to run it on a specific purpose operating system such as a NAS.

> [!NOTE] **Attention Home Assistant users:** The docker image is provided as-is and without official support (due to all the complex requirements to the underlying host/OS). Use it at your own risk if you know what you're doing.

We strongly recommend using Home Assistant OS along with the official Matter
Server add-on to use Matter with Home Assistant. The Matter integration
automatically installs the Matter Server as an add-on. Please refer to the
[Home Assistant documentation](https://www.home-assistant.io/integrations/matter/).

Home Assistant OS has been tested and tuned to be used with Matter and Thread,
which makes this combination the best tested and largely worry free
environment.

If you still prefer a self-managed container installation, you might experience
communication issues with Matter devices, especially Thread based devices.
This is mostly because the container installation uses host networking, and
relies on the networking managed by your operating system.

## Running the Matter Server using container image

With the following command you can run the Matter Server in a container using
Docker. The Matter network data (fabric information) are stored in a newly
created directory `data` in the current directory. Adjust the command to
choose another location instead.

```
mkdir data
docker run -d \
  --name matter-server \
  --restart=unless-stopped \
  --security-opt apparmor=unconfined \
  -v $(pwd)/data:/data \
  --network=host \
  ghcr.io/matter-js/python-matter-server:stable
```

> [!NOTE]
> The container has a default command line set (see Dockerfile). If you intend to pass additional arguments, you have to pass the default command line as well.

To use local commissioning with Bluetooth, make sure to pass the D-Bus socket as well:

```sh
docker run -d \
  --name matter-server \
  --restart=unless-stopped \
  --security-opt apparmor=unconfined \
  -v $(pwd)/data:/data \
  -v /run/dbus:/run/dbus:ro \
  --network=host \
  ghcr.io/matter-js/python-matter-server:stable --storage-path /data --paa-root-cert-dir /data/credentials --bluetooth-adapter 0
```

## Running using Docker compose

```yaml
services:
  # python-matter-server
  matter-server:
    image: ghcr.io/matter-js/python-matter-server:stable
    container_name: matter-server
    restart: unless-stopped
    # Required for mDNS to work correctly
    network_mode: host
    security_opt:
      # Needed for Bluetooth via dbus
      - apparmor:unconfined
    volumes:
      # Create an .env file that sets the USERDIR environment variable.
      - ${USERDIR:-$HOME}/docker/matter-server/data:/data/
      # Required for Bluetooth via D-Bus
      - /run/dbus:/run/dbus:ro
    # If you adjust command line, make sure to pass the default CMD arguments too:
    #command: --storage-path /data --paa-root-cert-dir /data/credentials --bluetooth-adapter 0
```
