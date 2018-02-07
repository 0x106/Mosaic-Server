import sys, os, math, time
import json
import cv2
import numpy as np

class Node(object):
    """docstring for Node."""

    def __init__(self, _arg, _key):

        super(Node, self).__init__()

        self.data = _arg
        self.key = _key
        self.name = self.data["nodeName"]
        self.value = self.data["nodeValue"]
        self.box = [int(self.data["nodeLayout"]["x"]), int(self.data["nodeLayout"]["y"]), int(self.data["nodeLayout"]["width"]), int(self.data["nodeLayout"]["height"])]
        try:
            self.__style = self.data["nodeStyle"]
            self.style = {}
        except Exception as e:
            self.__style = None
            self.style = None

        # if self.__style is not None:
        #     for item in self.__style:
        #
        #         if item["name"] == "background-color":
        #             item["value"] = self.parseColor(item["value"])
        #
        #         if item["name"] == "border-color":
        #             item["value"] = self.parseColor(item["value"])
        #
        #         if item["name"] == "color":
        #             item["value"] = self.parseColor(item["value"])
        #
        #         self.style[ item["name"] ] = item["value"]

    def __repr__(self):
        return self.key

    def children(self):
        return self.data['nodeChildren']

    def parseColor(self, value):
        if value[:4] == "rgba":
            value = [float(x) for x in value[5:-1].split(", ")]
        else:
            value = [float(x) for x in value[4:-1].split(", ")]
            value += [1.0]
        print(value)
        return value


def getNode(nodes, key):
    try:
        node = nodes[key]
        return node
    except Exception as e:
        pass
    return None


def constructRenderTree():

    with open("snapshot.json", 'r') as datafile:
        data = datafile.read()
    snapshot = json.loads(data)

    keys = [key for key in snapshot]
    nodes = {}
    for key in snapshot:
        print(key)
        nodes[key] = Node(snapshot[key], key)
    sys.exit()
    renderTree = [ nodes[keys[0]] ]

    for node in renderTree:

        # print(node.key)

        for childKey in node.children():

            childNode = getNode( nodes, childKey )

            if childNode is not None:
                renderTree.append( childNode )

    return renderTree, nodes, keys

def render(renderTree, __nodes, __keys):
    image = np.ones((1080, 1920, 3))
    # image = cv2.cvtColor(np.copy(image), cv2.COLOR_BGR2BGRA)
    # return
    for node in renderTree:
        if node.style is not None:
            # cv2.rectangle(image, (node.box[0], node.box[1]), (node.box[0] + node.box[2], node.box[1] + node.box[3]), node.style["border-color"], 1)
            cv2.rectangle(image, (node.box[0], node.box[1]), (node.box[0] + node.box[2], node.box[1] + node.box[3]), (255, 0, 0, 1), 1)
            cv2.circle(image, (node.box[0], node.box[1]), 2, (0,0,255))
            if node.name == "#text":
                # cv2.rectangle(image, (node.box[0], node.box[1]), (node.box[0] + node.box[2], node.box[1] + node.box[3]), node.style["color"], -1)
                cv2.rectangle(image, (node.box[0], node.box[1]), (node.box[0] + node.box[2], node.box[1] + node.box[3]), (0, 255, 0, 1), -1)

    image = cv2.resize(image, dsize=(0,0), fx=0.6, fy=0.6)
    cv2.namedWindow("Atlas")
    cv2.moveWindow("Atlas", 100,100)
    cv2.imshow("Atlas", image)
    cv2.imwrite("renderOutput.png", image)
    cv2.waitKey(0)
