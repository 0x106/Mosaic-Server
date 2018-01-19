import argparse
import sys, os, math, time

def checkDefaults(args):
    if args.google:
        args.url = "http://google.co.nz/"
        args.outfile = "snapshot-google.json"

    if args.jordan:
        args.url = "https://murmuring-ocean-82758.herokuapp.com/"
        args.outfile = "snapshot-82758.json"

    if args.google:
        args.url = "http://localhost:3000/"
        args.outfile = "snapshot-localhost.json"

def initParser():
    parser = argparse.ArgumentParser(description='Parse a specified URL and send to the Atlas Client.')

    parser.add_argument('--url', action = 'store', type = str, help = 'The url to parse.', default = "http://google.co.nz/")
    parser.add_argument('--outfile', action = 'store', type = str, help = 'Output file to save the render tree.', default="snapshot.json")
    parser.add_argument('--google', action = 'store_true', help = 'Google default option', default = False)
    parser.add_argument('--localhost', action = 'store_true', help = 'localhost default option', default = False)
    parser.add_argument('--jordan', action = 'store_true', help = 'jordan default option', default = False)
    parser.add_argument('--debug', action = 'store_true', help = 'debug switch', default = False)

    args = parser.parse_args()

    checkDefaults(args)

    return args

if __name__ == '__main__':
    args = initParser()

    # ensure that the output file exists
    os.system("touch " + args.outfile)

    # run the parsing engine
    os.system("node dev.js --url " + args.url + " --outfile " + args.outfile)

    # show the results
    if args.debug:
        os.system("open " + args.outfile)

    print("Complete. Goodbye")
