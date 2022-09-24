#!/usr/bin/env python3
"""Script for building and pushing the Boltz Docker images"""
import sys
from typing import List, Dict
from dataclasses import dataclass
from os import system, chdir, path
from argparse import ArgumentParser

@dataclass
class BuildArgument:
    """Argument of the "docker build" command"""

    name: str
    value: str

@dataclass
class Image:
    """The tags and build arguments of a Docker image"""

    tags: List[str]
    arguments: List[BuildArgument]

UBUNTU_VERSION = BuildArgument(
    name="UBUNTU_VERSION",
    value="20.04"
)

GOLANG_VERSION = BuildArgument(
    name="GOLANG_VERSION",
    value="1.19.1-buster"
)

BITCOIN_VERSION = "23.0"
LITECOIN_VERSION = "0.21.2.1"
ELEMENTS_VERSION = "0.21.0.2"
GETH_VERSION = "1.10.25"

C_LIGHTNING_VERSION = "0.12.1"
ECLAIR_VERSION = "0.7.0-patch-disconnect"
LND_VERSION = "0.15.1-beta"

BITCOIN_BUILD_ARG = BuildArgument(
    name="BITCOIN_VERSION",
    value=BITCOIN_VERSION,
)

IMAGES: Dict[str, Image] = {
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
        tags=["latest"],
        arguments=[],
    ),
    "regtest": Image(
        tags=["3.4.1"],
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
        ],
    )
}

def print_step(message: str):
    """Prints green text and is used to log the step of a process"""
    print("\033[0;32m{}\033[0;0m".format(message))

def print_error(message: str):
    """Prints red text and is used to report errors"""
    print("\033[1;31m{}\033[0;0m".format(message))

def change_working_directory():
    """Changes the working directory to the one this script is located in"""

    directory = path.dirname(path.abspath(__file__))
    chdir(directory)

def get_build_details(image: str) -> Image:
    """Gets the build details of an image or exits the script if they can't be found"""

    build_details = IMAGES.get(image)

    if not build_details:
        print_error("Could not find image {}".format(image))
        sys.exit(1)

    return build_details

def list_images(to_list: List[str]):
    """Lists the version and build arguments of either one or all images"""

    print("Images:")

    for image in to_list:
        build_details = get_build_details(image)

        print("  - {}".format(image))
        print("    Tags:")

        for tag in build_details.tags:
            print("      - {}".format(tag))

        print()

        if build_details.arguments:
            print("    Build arguments:")
        for argument in build_details.arguments:
            print("      - {name}:{value}".format(
                name=argument.name,
                value=argument.value
            ))

        print()

def build_images(to_build: List[str], organisation: str, no_cache: bool, buildx: bool, platform = ""):
    """Builds one or more images"""

    change_working_directory()

    for image in to_build:
        build_details = get_build_details(image)

        for tag in build_details.tags:
            build_args: List[str] = []

            # The regtest image doesn't need the version as a build flag
            if image != "regtest":
                build_args.append("VERSION={}".format(tag))

            for argument in build_details.arguments:
                build_args.append("{name}={value}".format(
                    name=argument.name,
                    value=argument.value,
                ))

            # Add the prefix "--build-arg " to every entry and join the array to a string
            build_args = " ".join(["--build-arg " + entry for entry in build_args])

            if buildx:
                command = "docker buildx build --push {args} --platform " + platform + " --file {dockerfile} --tag {name}:{tag} ."
            else:
                command = "docker build -t {name}:{tag} -f {dockerfile} {args} ."

            command = command.format(
                tag=tag,
                name="{}/{}".format(organisation, image),
                dockerfile="{}/Dockerfile".format(image),
                args=build_args,
            )

            if no_cache:
                command = command + " --no-cache"

            print()
            print_step("Building {image}:{tag}".format(image=image, tag=tag))

            print(command)
            print()

            if system(command) != 0:
                print_error("Could not build image {}".format(image))
                sys.exit(1)

    print()
    print_step("Built images: {}".format(", ".join(to_build)))

def parse_images(to_parse: List[str]) -> List[str]:
    """Returns all available images if none was specified"""

    if not to_parse:
        return list(IMAGES.keys())

    return to_parse

if __name__ == "__main__":
    PARSER = ArgumentParser(description="Build or push Docker images")

    # CLI commands
    SUB_PARSERS = PARSER.add_subparsers(dest='command')
    SUB_PARSERS.required = True

    LIST_PARSER = SUB_PARSERS.add_parser("list")
    BUILD_PARSER = SUB_PARSERS.add_parser("build")
    BUILDX_PARSER = SUB_PARSERS.add_parser("buildx")

    # CLI arguments
    LIST_PARSER.add_argument("images", type=str, nargs="*")

    BUILD_PARSER.add_argument("images", type=str, nargs="*")
    BUILD_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILD_PARSER.add_argument("--organisation", default="boltz", help="The organisation to use for the image names")

    BUILDX_PARSER.add_argument("images", type=str, nargs="*")
    BUILDX_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILDX_PARSER.add_argument("--platform",
        action="store_true",
        default="linux/amd64,linux/arm64",
        help="The platforms to build for",
    )
    BUILDX_PARSER.add_argument("--organisation", default="boltz", help="The organisation to use for the image names")

    ARGS = PARSER.parse_args()

    PARSED_IMAGES = parse_images(ARGS.images)

    if ARGS.command == "list":
        list_images(PARSED_IMAGES)
    elif ARGS.command == "build":
        build_images(PARSED_IMAGES, ARGS.organisation, ARGS.no_cache, False)
    elif ARGS.command == "buildx":
        build_images(PARSED_IMAGES, ARGS.organisation, ARGS.no_cache, True, ARGS.platform)
