import argparse
import sys, os, math, time
import json

def checkDefaults(args):
    if args.google:
        args.url = "http://google.co.nz/"
        args.outfile = "snapshot.json"

    if args.jordan:
        args.url = "https://murmuring-ocean-82758.herokuapp.com/"
        args.outfile = "snapshot.json"

    if args.local:
        args.url = "http://localhost:3000/"
        args.outfile = "snapshot.json"

    if args.atlas:
        args.url = "http://atlasreality.xyz/"
        args.outfile = "snapshot.json"

    args.jsdebug = 0;
    if args.debug:
        args.jsdebug = 1;

def initCMDParser():
    parser = argparse.ArgumentParser(description='Parse a specified URL and send to the Atlas Client.')

    parser.add_argument('--url', action = 'store', type = str, help = 'The url to parse.', default = "http://google.co.nz/")
    parser.add_argument('--outfile', action = 'store', type = str, help = 'Output file to save the render tree.', default="snapshot.json")
    parser.add_argument('--clientdir', action = 'store', type = str, help = 'Atlas Client dir', default="/Users/jordancampbell/helix/Atlas/Mosaic-Client/Bolt/Bolt/")
    parser.add_argument('--google', action = 'store_true', help = 'Google default option', default = False)
    parser.add_argument('--local', action = 'store_true', help = 'localhost default option', default = False)
    parser.add_argument('--atlas', action = 'store_true', help = 'atlasreality default option', default = False)
    parser.add_argument('--jordan', action = 'store_true', help = 'jordan default option', default = False)
    parser.add_argument('--debug', action = 'store_true', help = 'debug switch', default = False)
    parser.add_argument('--analyse', action = 'store_true', help = 'analyse results', default = False)
    parser.add_argument('--traverse', action = 'store_true', help = 'traverse DOM', default = False)

    args = parser.parse_args()

    checkDefaults(args)

    return args

def getParent(snapshot, _key):
    for key in snapshot:
        if key == _key:
            return snapshot[key]
    return -1

def getAttribute(data, name):
    for idx, item in enumerate(data):
        if item["name"] == name:
            return item["value"]
    return ""

def transparent(colour):
    if colour == "rgba(0, 0, 0, 0)":
        print(colour)
        return True

    return False

colours = [
    (255, 0, 0),
    (0, 255, 0),
    (0, 0, 255),
    (255, 255, 0),
    (255, 0, 255),
    (0, 255, 255),
    (255, 0, 0),
    (0,55, 0),
    (0, 0, 55),
    (55, 55, 0),
    (55, 0, 55),
    (0, 55, 55),
    (155, 0, 0),
    (0, 155, 0),
    (0, 0, 155),
    (155, 155, 0),
    (155, 0, 155),
    (0, 155, 155)
]

def traverseDOM():
    scale = 1.0
    import cv2
    import numpy as np

    image = np.ones((1080, 1920, 3))

    with open("snapshot.json", 'r') as datafile:
        data = datafile.read()
    snapshot = json.loads(data)

    index = 0

    for key in snapshot:
        print(key)

        nodeName = snapshot[key]["nodeName"]
        if nodeName != "HTML" or nodeName != "BODY":
            pkey = snapshot[key]["pkey"]
            parent = getParent(snapshot, pkey)
            children = snapshot[key]["nodeCildren"]

            for child in children:
                try:
                    childNode = snapshot[ child ]

                    nodeName = snapshot[ child ]["nodeName"]
                    pkey = snapshot[ child ]["pkey"]
                    parent = getParent(snapshot, pkey)
                    box = snapshot[ child ]["nodeLayout"]

                    if True:#nodeName != "HTML" and nodeName != "BODY" and nodeName != "#text":
                        print(nodeName)
                        x = int(scale * int(box["x"]))
                        y = int(scale * int(box["y"]))
                        w = int(scale * int(box["width"]))
                        h = int(scale * int(box["height"]))

                        cv2.rectangle(image, (x, y), (x + w, y + h), colours[index], -1)
                        index += 1
                        if index == len(colours):
                            index = 0
                        cv2.circle(image, (x, y), 2, (0,0,255))

                except Exception as e:
                    pass



    print("--------------")

    image = cv2.resize(image, dsize=(0,0), fx=0.5, fy=0.5)

    cv2.imshow("Atlas", image)
    cv2.waitKey(0)

        # box = snapshot[key]["nodeLayout"]
        #
        # display, bgcolour = "", ""
        # try:
        #     style = snapshot[key]["nodeStyle"]
        #     display = getAttribute(style, "display")
        #     bgcolour = getAttribute(style, "background-color")
        # except Exception as e:
        #     pass


    sys.exit()

def analyse():

    scale = 1.0
    import cv2
    from PIL import Image, ImageFont, ImageDraw, ImageEnhance
    import PIL
    import numpy as np

    image = np.ones((1080, 1920, 3))
    # image = Image.new('RGB', (1920, 1080))
    # draw = ImageDraw.Draw(image)

    with open("snapshot.json", 'r') as datafile:
        data = datafile.read()
    snapshot = json.loads(data)

    x1 = [snapshot[key]["nodeLayout"]["x"] for key in snapshot]
    x2 = [snapshot[key]["nodeLayout"]["x"] + snapshot[key]["nodeLayout"]["width"] for key in snapshot]
    y1 = [snapshot[key]["nodeLayout"]["y"] for key in snapshot]
    y2 = [snapshot[key]["nodeLayout"]["y"] + snapshot[key]["nodeLayout"]["height"] for key in snapshot]

    # draw.rectangle([0,0,1920, 1080], fill="white")

    for key in snapshot:
        nodeName = snapshot[key]["nodeName"]
        pkey = snapshot[key]["pkey"]
        parent = getParent(snapshot, pkey)

        box = snapshot[key]["nodeLayout"]

        display, bgcolour = "", ""
        try:
            style = snapshot[key]["nodeStyle"]
            display = getAttribute(style, "display")
            bgcolour = getAttribute(style, "background-color")
        except Exception as e:
            pass

        # if nodeName != "DIV" and nodeName != "#text" and display != "none":
        # if display == "none":
        if True:
            x = int(scale * int(box["x"]))
            y = int(scale * int(box["y"]))
            w = int(scale * int(box["width"]))
            h = int(scale * int(box["height"]))

            # draw.rectangle([x, y, x+w, y+h], outline="green")

            # text = str(snapshot[key]["nodeValue"]).encode('latin-1', 'ignore')
            # font = ImageFont.truetype("Lato-regular.ttf", 40)
            # draw.text((x, y), text, fill="black")

            cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 1)
            cv2.circle(image, (x, y), 2, (0,0,255))
            if parent != -1:
                pbox = parent["nodeLayout"]
                x = int(scale * int(pbox["x"]))
                y = int(scale * int(pbox["y"]))
                w = int(scale * int(pbox["width"]))
                h = int(scale * int(pbox["height"]))
            #     draw.rectangle([x, y, x+w, y+h], outline="blue")
                # cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 1)
                # cv2.circle(image, (x, y), 2, (0,0,255))



    # image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    image = cv2.resize(image, dsize=(0,0), fx=0.5, fy=0.5)

    cv2.imshow("Atlas", image)
    cv2.waitKey(0)
    sys.exit()

if __name__ == '__main__':
    args = initCMDParser()

    if args.debug:
        print(args)

    if args.analyse:
        analyse()

    if args.traverse:
        traverseDOM()

    # use the latest version of node
    # os.system("nvm use lts/carbon") # currently getting error: 'sh: nvm: command not found'

    # ensure that the output file exists
    os.system("touch " + args.outfile)

    # run the parsing engine
    os.system("node dev.js --url " + args.url + " --outfile " + args.outfile + " --debug " + str(args.jsdebug))

    # move the output file to the client
    os.system("cp " + args.outfile + " " + args.clientdir + args.outfile)

    # show the results
    if args.debug:
        os.system("open " + args.outfile)

    print("Complete. Goodbye")
