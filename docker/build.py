#!/usr/bin/env python3
"""Script for building and pushing the Boltz Docker images."""
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

    tags: list[str]
    arguments: list[BuildArgument]


UBUNTU_VERSION = BuildArgument(
    name="UBUNTU_VERSION",
    value="22.04",
)

NODE_VERSION = BuildArgument(
    name="NODE_VERSION",
    value="lts-bullseye-slim",
)

GOLANG_VERSION = BuildArgument(
    name="GOLANG_VERSION",
    value="1.20.7-bullseye",
)

BITCOIN_VERSION = "25.0"
LITECOIN_VERSION = "0.21.2.2"
ELEMENTS_VERSION = "22.1.1"
GETH_VERSION = "1.12.1"

C_LIGHTNING_VERSION = "23.05.2"
ECLAIR_VERSION = "0.9.0"
LND_VERSION = "0.16.4-beta"

BITCOIN_BUILD_ARG = BuildArgument(
    name="BITCOIN_VERSION",
    value=BITCOIN_VERSION,
)

IMAGES: dict[str, Image] = {
    "bitcoin-core": Image(
        tags=[BITCOIN_VERSION],
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "litecoin-core": Image(
        tags=[LITECOIN_VERSION],
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "geth": Image(
        tags=[GETH_VERSION],
        arguments=[
            UBUNTU_VERSION,
            GOLANG_VERSION,
        ],
    ),
    "eclair": Image(
        tags=[ECLAIR_VERSION],
        arguments=[
            UBUNTU_VERSION,
        ],
    ),
    "c-lightning": Image(
        tags=[C_LIGHTNING_VERSION],
        arguments=[
            UBUNTU_VERSION,
            BITCOIN_BUILD_ARG,
        ],
    ),
    "lnd": Image(
        tags=[LND_VERSION],
        arguments=[
            UBUNTU_VERSION,
            GOLANG_VERSION,
        ],
    ),
    "boltz": Image(
        tags=["3.2.1"],
        arguments=[
            NODE_VERSION,
        ],
    ),
    "regtest": Image(
        tags=["4.0.0"],
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
        print("    Tags:")

        for tag in build_details.tags:
            print(f"      - {tag}")

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
    buildx: bool,
    platform: str = "",
) -> None:
    """Build one or more images."""
    change_working_directory()

    for image in to_build:
        build_details = get_build_details(image)

        for tag in build_details.tags:
            build_args = [f"{arg.name}={arg.value}" for arg in build_details.arguments]

            # The regtest image doesn't need the version as a build flag
            if image != "regtest":
                build_args.append(f"VERSION={tag}")

            # Add the prefix "--build-arg " to every entry and
            # join the array to a string
            args = " ".join(["--build-arg " + entry for entry in build_args])

            if buildx:
                command = (
                    "docker buildx build --push {args} --platform "
                    + platform
                    + " --file {dockerfile} --tag {name}:{tag} ."
                )
            else:
                command = "docker build -t {name}:{tag} -f {dockerfile} {args} ."

            command = command.format(
                tag=tag,
                args=args,
                name=f"{organisation}/{image}",
                dockerfile=f"{image}/Dockerfile",
            )

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
    BUILD_PARSER.add_argument(
        "--organisation",
        default="boltz",
        help="The organisation to use for the image names",
    )

    BUILDX_PARSER.add_argument("images", type=str, nargs="*")
    BUILDX_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILDX_PARSER.add_argument(
        "--platform",
        action="store_true",
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
        build_images(PARSED_IMAGES, ARGS.organisation, ARGS.no_cache, False)
    elif ARGS.command == "buildx":
        build_images(
            PARSED_IMAGES,
            ARGS.organisation,
            ARGS.no_cache,
            True,
            ARGS.platform,
        )
