"""Generate device types from matter-devices.xml."""

import pathlib
import urllib.request

import black
import xmltodict

REPO_ROOT = pathlib.Path(__file__).parent.parent

DEVICE_XML = (
    "https://raw.githubusercontent.com/project-chip/connectedhomeip"
    "/master/src/app/zap-templates/zcl/data-model/chip/matter-devices.xml"
)

OUTPUT_PYTHON = REPO_ROOT / "matter_server/client/models/device_types.py"


def gen_cls_name(name: str):
    """Generate a class name from a cluster name."""
    # Convert uppercase words to title case
    name = "".join(
        # Don't mess up wifi name
        part if part == "WiFi" else part[0].upper() + part[1:].lower()
        for part in name.split(" ")
    )

    new_name = []

    next_upper = False
    for char in name:
        if char in ("-", "/"):
            next_upper = True
            continue
        elif char == ".":
            continue
        elif next_upper:
            char = char.upper()
            next_upper = False

        new_name.append(char)

    return "".join(new_name)


def main():
    """Generate device types from matter-devices.xml."""
    with urllib.request.urlopen(DEVICE_XML) as response:  # noqa: S310
        xml_data = response.read().decode("utf-8")
    data = xmltodict.parse(xml_data)
    output = [
        '''
"""
Definitions for all known Device types.

This file is auto generated from `zcl/data-model/chip/matter-devices.xml`
Do not override!
"""
from __future__ import annotations

import typing

from chip.clusters import Objects as all_clusters

ALL_TYPES: dict[int, type["DeviceType"]] = {}



class DeviceType:
    """Base class for Matter device types."""

    device_type: int
    clusters: set[type[all_clusters.Cluster]]

    def __init_subclass__(cls, *, device_type: int, **kwargs: typing.Any) -> None:
        """Register a subclass."""
        super().__init_subclass__(**kwargs)
        cls.device_type = device_type
        ALL_TYPES[device_type] = cls

    def __hash__(self) -> int:
        """Return unique hash for this object."""
        return self.device_type

'''
    ]

    for device in data["configurator"]["deviceType"]:
        name = device["typeName"]

        print(name, device["deviceId"]["#text"])

        clusters = device["clusters"]["include"]
        if not isinstance(clusters, list):
            clusters = [clusters]

        for cluster in clusters:
            print(cluster["@cluster"])

        print()

        if not clusters:
            output_clusters = "set()"
        else:
            output_clusters = (
                "{"
                + ",".join(
                    f"all_clusters.{gen_cls_name(cluster['@cluster'])}"
                    for cluster in clusters
                    if (
                        # It's a server cluster
                        cluster["@server"] == "true"
                        # It's optional server cluster
                        or cluster["@serverLocked"] == "false"
                    )
                )
                + ",}"  # extra comma to force black to do a cluster per line
            )

        output.append(
            """

class {cls_name}(DeviceType, device_type={device_id}):
    \"""{device_name}.\"""

    clusters = {output_clusters}


""".format(
                device_name=name,
                cls_name=gen_cls_name(name),
                device_id=device["deviceId"]["#text"],
                output_clusters=output_clusters,
            )
        )

    formatted = black.format_str("\n\n".join(output), mode=black.Mode())
    OUTPUT_PYTHON.write_text(formatted)


if __name__ == "__main__":
    main()
