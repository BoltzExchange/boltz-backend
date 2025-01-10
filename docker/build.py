#!/usr/bin/env python3
"""Script for building and pushing the Boltz Docker images."""

import json
import sys
from argparse import ArgumentParser
from dataclasses import dataclass
from os import chdir, system
from pathlib import Path


@dataclass
class BuildArgument:
    """Argument of the "docker build" command."""

    name: str
    value: str


@dataclass
class Image:
    """The tags and build arguments of a Docker image."""

    tag: str
    arguments: list[BuildArgument]


UBUNTU_VERSION = BuildArgument(
    name="UBUNTU_VERSION",
    value="22.04",
)

NODE_VERSION = BuildArgument(
    name="NODE_VERSION",
    value="lts-bookworm-slim",
)

GOLANG_VERSION = BuildArgument(
    name="GOLANG_VERSION",
    value="1.23.4-bullseye",
)

BITCOIN_VERSION = "28.1"
LITECOIN_VERSION = "0.21.4"
ELEMENTS_VERSION = "23.2.4"
GETH_VERSION = "1.14.12"

C_LIGHTNING_VERSION = "24.11.1"
ECLAIR_VERSION = "0.11.0"
LND_VERSION = "0.18.4-beta"

BITCOIN_BUILD_ARG = BuildArgument(
    name="BITCOIN_VERSION",
    value=BITCOIN_VERSION,
)

IMAGES: dict[str, Image] = {
    "bitcoin-core": Image(
        tag=BITCOIN_VERSION,
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "elements": Image(
        tag=ELEMENTS_VERSION,
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "litecoin-core": Image(
        tag=LITECOIN_VERSION,
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "geth": Image(
        tag=GETH_VERSION,
        arguments=[
            UBUNTU_VERSION,
            GOLANG_VERSION,
        ],
    ),
    "eclair": Image(
        tag=ECLAIR_VERSION,
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "c-lightning": Image(
        tag=C_LIGHTNING_VERSION,
        arguments=[
            UBUNTU_VERSION,
            BITCOIN_BUILD_ARG,
        ],
    ),
    "lnd": Image(
        tag=LND_VERSION,
        arguments=[
            UBUNTU_VERSION,
            GOLANG_VERSION,
        ],
    ),
    "boltz": Image(
        # Is read from the package.json file
        tag="",
        arguments=[
            NODE_VERSION,
        ],
    ),
    "regtest": Image(
        tag="4.6.3",
        arguments=[
            UBUNTU_VERSION,
            BITCOIN_BUILD_ARG,
            BuildArgument(
                name="ELEMENTS_VERSION",
                value=ELEMENTS_VERSION,
            ),
            BuildArgument(
                name="LND_VERSION",
                value=LND_VERSION,
            ),
            BuildArgument(
                name="C_LIGHTNING_VERSION",
                value=C_LIGHTNING_VERSION,
            ),
        ],
    ),
}


def print_step(message: str) -> None:
    """Print green text and is used to log the step of a process."""
    print(f"\033[0;32m{message}\033[0;0m")


def print_error(message: str) -> None:
    """Print red text and is used to report errors."""
    print(f"\033[1;31m{message}\033[0;0m")


def change_working_directory() -> None:
    """Change the working directory to the one this script is located in."""
    directory = Path(__file__).parent
    chdir(directory)


def get_build_details(image: str) -> Image:
    """Get the build details of an image or exits the script if they can't be found."""
    build_details = IMAGES.get(image)

    if not build_details:
        print_error(f"Could not find image {image}")
        sys.exit(1)

    return build_details


def list_images(to_list: list[str]) -> None:
    """List the version and build arguments of either one or all images."""
    print("Images:")

    for image in to_list:
        build_details = get_build_details(image)

        print(f"  - {image}")
        print(f"    Tag: {build_details.tag}")

        print()

        if build_details.arguments:
            print("    Build arguments:")
        for argument in build_details.arguments:
            print(f"      - {argument.name}:{argument.value}")

        print()


def build_images(
    to_build: list[str],
    organisation: str,
    no_cache: bool,
    no_latest: bool,
    branch: str,
    buildx: bool,
    platform: str = "",
) -> None:
    """Build one or more images."""
    change_working_directory()

    for image in to_build:
        build_details = get_build_details(image)
        tag = build_details.tag

        if branch in ["master", "main"]:
            tag = "latest"
        elif branch != "":
            tag = branch

        build_args = [f"{arg.name}={arg.value}" for arg in build_details.arguments]

        # The regtest image doesn't need the version as a build flag
        if image != "regtest":
            build_args.append(f"VERSION={tag if tag != 'latest' else branch}")

        # Add the prefix "--build-arg " to every entry and
        # join the array to a string
        args = " ".join(["--build-arg " + entry for entry in build_args])

        name = f"{organisation}/{image}"
        dockerfile = f"{image}/Dockerfile"

        if buildx:
            extra_tag = "" if no_latest else f"--tag {name}:latest"
            command = (
                f"docker buildx build --push {args} --platform {platform} "
                f"--file {dockerfile} --tag {name}:{tag} {extra_tag} ."
            )
        else:
            extra_tag = "" if no_latest else f"-t {name}:latest"
            command = f"docker build -t {name}:{tag} {extra_tag} -f {dockerfile} {args} ."

        if no_cache:
            command = command + " --no-cache"

        print()
        print_step(f"Building {image}:{tag}")

        print(command)
        print()

        if system(command) != 0:
            print_error(f"Could not build image {image}")
            sys.exit(1)

    print()
    print_step("Built images: {}".format(", ".join(to_build)))


def parse_images(to_parse: list[str]) -> list[str]:
    """Return all available images if none was specified."""
    if not to_parse:
        return list(IMAGES.keys())

    return to_parse


if __name__ == "__main__":
    with Path.open(
        Path(__file__).parent.parent.absolute().joinpath("package.json")
    ) as package_json:
        IMAGES["boltz"].tag = f"v{json.load(package_json)['version']}"

    PARSER = ArgumentParser(description="Build or push Docker images")

    # CLI commands
    SUB_PARSERS = PARSER.add_subparsers(dest="command")
    SUB_PARSERS.required = True

    LIST_PARSER = SUB_PARSERS.add_parser("list")
    BUILD_PARSER = SUB_PARSERS.add_parser("build")
    BUILDX_PARSER = SUB_PARSERS.add_parser("buildx")

    # CLI arguments
    LIST_PARSER.add_argument("images", type=str, nargs="*")

    BUILD_PARSER.add_argument("images", type=str, nargs="*")
    BUILD_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILD_PARSER.add_argument("--no-latest", dest="no_latest", action="store_true")
    BUILD_PARSER.add_argument("--branch", default="", help="Branch to build")
    BUILD_PARSER.add_argument(
        "--organisation",
        default="boltz",
        help="The organisation to use for the image names",
    )

    BUILDX_PARSER.add_argument("images", type=str, nargs="*")
    BUILDX_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILDX_PARSER.add_argument("--no-latest", dest="no_latest", action="store_true")
    BUILDX_PARSER.add_argument("--branch", default="", help="Branch to build")
    BUILDX_PARSER.add_argument(
        "--platform",
        default="linux/amd64,linux/arm64",
        help="The platforms to build for",
    )
    BUILDX_PARSER.add_argument(
        "--organisation",
        default="boltz",
        help="The organisation to use for the image names",
    )

    ARGS = PARSER.parse_args()

    PARSED_IMAGES = parse_images(ARGS.images)

    if ARGS.command == "list":
        list_images(PARSED_IMAGES)
    elif ARGS.command == "build":
        build_images(
            PARSED_IMAGES,
            ARGS.organisation,
            ARGS.no_cache,
            ARGS.no_latest,
            ARGS.branch,
            False,
        )
    elif ARGS.command == "buildx":
        build_images(
            PARSED_IMAGES,
            ARGS.organisation,
            ARGS.no_cache,
            ARGS.no_latest,
            ARGS.branch,
            True,
            ARGS.platform,
        )
