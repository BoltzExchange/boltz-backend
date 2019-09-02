#!/usr/bin/env python3
"""This module allows listening to Server-Send events via the CLI"""
from argparse import ArgumentParser
from sseclient import SSEClient

def stream_server_side_events(url: str):
    """Listens to a stream of events and prints them to the console"""

    print("Listening to: {}".format(url))

    try:
        client = SSEClient(url)

        for message in client:
            print(message)

    except Exception as exception: # pylint: disable=broad-except
        print("Could not listen to {url}: {exception}".format(
            url=url,
            exception=exception
        ))
    except KeyboardInterrupt:
        print("Cancelling stream")

if __name__ == '__main__':
    PARSER = ArgumentParser(description="Stream Server-Sent events")

    # CLI arguments
    PARSER.add_argument("url", help="URL of the Server-Sent event stream", type=str, nargs=1)

    ARGS = PARSER.parse_args()

    stream_server_side_events(ARGS.url[0])
