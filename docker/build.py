#!/usr/bin/env python3
"""Script for building and pushing the Boltz Docker images"""
from dataclasses import dataclass
from os import system, chdir, path
from argparse import ArgumentParser
from typing import List, Dict

@dataclass
class BuildArgument:
    """Argument of the "docker build" command"""

    name: str
    value: str

@dataclass
class Image:
    """The version and and build arguments of a Docker image"""

    version: str
    arguments: List[BuildArgument]

ALPINE_VERSION = BuildArgument(
    name="ALPINE_VERSION",
    value="3.10.1"
)

BERKELEY_VERSION = BuildArgument(
    name="BERKELEY_VERSION",
    value="4.8.30"
)

BITCOIN_VERSION = "0.18.1"
LITECOIN_VERSION = "0.17.1"

LND_VERSION = "0.7.1-beta"

IMAGES: Dict[str, Image] = {
    "berkeley-db": Image(
        version=BERKELEY_VERSION.value,
        arguments=[
            ALPINE_VERSION
        ]
    ),
    "bitcoin-core": Image(
        version=BITCOIN_VERSION,
        arguments=[
            ALPINE_VERSION,
            BERKELEY_VERSION
        ]
    ),
    "litecoin-core": Image(
        version=LITECOIN_VERSION,
        arguments=[
            ALPINE_VERSION,
            BERKELEY_VERSION
        ]
    ),
    "lnd": Image(
        version=LND_VERSION,
        arguments=[
            ALPINE_VERSION,
            BuildArgument(
                name="GOLANG_VERSION",
                value="1.12.9-alpine"
            )
        ]
    ),
    "regtest": Image(
        version="1.0.0",
        arguments=[
            ALPINE_VERSION,
            BuildArgument(
                name="BITCOIN_VERSION",
                value=BITCOIN_VERSION
            ),
            BuildArgument(
                name="LITECOIN_VERSION",
                value=LITECOIN_VERSION
            ),
            BuildArgument(
                name="LND_VERSION",
                value=LND_VERSION
            )
        ]
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
        exit(1)

    return build_details

def list_images(to_list: List[str]):
    """Lists the version and build arguments of either one or all images"""

    print("Images:")

    for image in to_list:
        build_details = get_build_details(image)

        print(" - {name}:{tag}".format(
            name=image,
            tag=build_details.version
        ))

        if build_details.arguments:
            print("   Build arguments:")
        for argument in build_details.arguments:
            print("     - {name}:{value}".format(
                name=argument.name,
                value=argument.value
            ))

        print()

def push_images(to_push: List[str]):
    """Pushes one or more images to the Docker Hub"""

    for image in to_push:
        build_details = get_build_details(image)

        command = "docker push {name}:{tag}".format(
            name="boltz/{}".format(image),
            tag=build_details.version
        )

        print_step("Pushing {}".format(image))

        print(command)
        print()

        if system(command) != 0:
            print_error("Could not push image {}".format(image))
            exit(1)

    print_step("Pushed images: {}".format(", ".join(to_push)))

def build_images(to_build: List[str], no_cache: bool):
    """Builds one or more images"""

    change_working_directory()

    for image in to_build:
        build_details = get_build_details(image)
        build_args: List[str] = []

        # The regtest image doesn't need the version as a build flag
        if image != "regtest":
            build_args.append("VERSION={}".format(build_details.version))

        for argument in build_details.arguments:
            build_args.append("{name}={value}".format(
                name=argument.name,
                value=argument.value,
            ))

            command = "docker build -t {name}:{tag} -f {dockerfile} {args} .".format(
                name="boltz/{}".format(image),
                tag=build_details.version,
                dockerfile="{}/Dockerfile".format(image),
                # Add the prefix "--build-arg " to every entry and join the array to a string
                args=" ".join(["--build-arg " + entry for entry in build_args])
            )

            if no_cache:
                command = command + " --no-cache"

        print_step("Building {}".format(image))

        print(command)
        print()

        if system(command) != 0:
            print_error("Could not build image {}".format(image))
            exit(1)

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
    PUSH_PARSER = SUB_PARSERS.add_parser("push")
    BUILD_PARSER = SUB_PARSERS.add_parser("build")

    # CLI arguments
    LIST_PARSER.add_argument("images", type=str, nargs="*")

    PUSH_PARSER.add_argument("images", type=str, nargs="*")

    BUILD_PARSER.add_argument("--no-cache", dest="no_cache", action="store_true")
    BUILD_PARSER.add_argument("images", type=str, nargs="*")

    ARGS = PARSER.parse_args()

    PARSED_IMAGES = parse_images(ARGS.images)

    if ARGS.command == "list":
        list_images(PARSED_IMAGES)
    elif ARGS.command == "push":
        push_images(PARSED_IMAGES)
    elif ARGS.command == "build":
        build_images(PARSED_IMAGES, ARGS.no_cache)
