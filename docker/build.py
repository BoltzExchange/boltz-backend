#!/usr/bin/env python3
from dataclasses import dataclass
from os import system, chdir, path
from argparse import ArgumentParser
from typing import List, Tuple, Dict

@dataclass
class BuildArgument:
  name: str
  value: str

@dataclass
class Image:
  version: str
  arguments: List[BuildArgument]

ALPINE_VERSION = BuildArgument(
  name = "ALPINE_VERSION",
  value = "3.10.1"
)

BERKELEY_VERSION = BuildArgument(
  name = "BERKELEY_VERSION",
  value = "4.8.30"
)

BITCOIN_VERSION = "0.18.1"
LITECOIN_VERSION = "0.17.1"

LND_VERSION = "0.7.1-beta"

IMAGES: Dict[str, Image] = {
  "berkeley-db": Image(
    version = BERKELEY_VERSION.value,
    arguments = [
      ALPINE_VERSION
    ]
  ),
  "bitcoin-core": Image(
    version = BITCOIN_VERSION,
    arguments = [
      ALPINE_VERSION,
      BERKELEY_VERSION
    ]
  ),
  "litecoin-core": Image(
    version = LITECOIN_VERSION,
    arguments = [
      ALPINE_VERSION,
      BERKELEY_VERSION
    ]
  ),
  "lnd": Image(
    version = LND_VERSION,
    arguments = [
      ALPINE_VERSION,
      BuildArgument(
        name = "GOLANG_VERSION",
        value = "1.12.9-alpine"
      )
    ]
  ),
  "regtest": Image(
    version = "1.0.0",
    arguments = [
      ALPINE_VERSION,
      BuildArgument(
        name = "BITCOIN_VERSION",
        value = BITCOIN_VERSION
      ),
      BuildArgument(
        name = "LITECOIN_VERSION",
        value = LITECOIN_VERSION
      ),
      BuildArgument(
        name = "LND_VERSION",
        value = LND_VERSION
      )
    ]
  )
}

def print_step(message: str):
  print("\033[0;32m{}\033[0;0m".format(message))

def print_error(message: str):
  print("\033[1;31m{}\033[0;0m".format(message))

# Change the working directory to the one this script is located in
def change_working_directory():
  directory = path.dirname(path.abspath(__file__))
  chdir(directory)

def get_build_details(image: str) -> Image:
  build_details = IMAGES.get(image)

  if build_details:
    return build_details
  else:
    print_error("Could not find image {}".format(image))
    exit(1)

def list_images(images: List[str]):
  print("Images:")
  
  for image in images:
    build_details = get_build_details(image)

    print(" - {name}:{tag}".format(
      name = image,
      tag = build_details.version
    ))

    if len(build_details.arguments) > 0:
      print("   Build arguments:")
      for argument in build_details.arguments:
        print("     - {name}:{value}".format(
          name = argument.name,
          value = argument.value
        ))

    print()

def push_images(images: List[str]):
  for image in images:
    build_details = get_build_details(image)
    
    command = "docker push {name}:{tag}".format(
      name = "boltz/{}".format(image),
      tag = build_details.version
    )

    print_step("Pushing {}".format(image))

    print(command)
    print()

    if system(command) != 0:
      print_error("Could not push image {}".format(image))
      exit(1)

  print_step("Pushed images: {}".format(", ".join(images)))

def build_images(images: List[str], no_cache: bool):
  change_working_directory()
  
  for image in images:
    build_details = get_build_details(image)
    args: List[str] = []

    # The regtest image doesn't need the version as a build flag
    if image != "regtest":
      args.append("VERSION={}".format(build_details.version))

    for argument in build_details.arguments:
      args.append("{name}={value}".format(
        name=argument.name,
        value=argument.value,
      ))

    command = "docker build -t {name}:{tag} -f {dockerfile} {args} .".format(
      name = "boltz/{}".format(image),
      tag = build_details.version,
      dockerfile = "{}/Dockerfile".format(image),
      # Add the prefix "--build-arg " to every entry and join the array to a string
      args = " ".join(["--build-arg " + entry for entry in args])
    )

    if no_cache:
      command = command + " --no-cache"

    print_step("Building {}".format(image))

    print(command)
    print()

    if system(command) != 0:
      print_error("Could not build image {}".format(image))
      exit(1)

  print_step("Built images: {}".format(", ".join(images)))


def parse_images(images: List[str]) -> List[str]:
  if len(images) == 0:
    return list(IMAGES.keys())

  return images

if __name__ == "__main__":
  parser = ArgumentParser(description = "Build or push Docker images")

  # CLI commands
  sub_parsers = parser.add_subparsers(dest = 'command')
  sub_parsers.required = True

  list_parser = sub_parsers.add_parser("list")
  push_parser = sub_parsers.add_parser("push")
  build_parser = sub_parsers.add_parser("build")

  # CLI arguments
  list_parser.add_argument("images", type = str, nargs = "*")
  
  push_parser.add_argument("images", type = str, nargs = "*")

  build_parser.add_argument("--no-cache", dest = "no_cache", action = "store_true")
  build_parser.add_argument("images", type = str, nargs = "*")

  args = parser.parse_args()

  images = parse_images(args.images)

  if args.command == "list":
    list_images(images)
  elif args.command == "push":
    push_images(images)
  elif args.command == "build":
    build_images(images, args.no_cache)
