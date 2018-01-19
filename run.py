import argparse


def convertFile(fname):
    with open(fname, 'r') as file_:
        text = file_.read()

        text = text.replace("nodeName", "\"nodeName\"")
        text = text.replace("nodeValue", "\"nodeValue\"")
        text = text.replace("nodeLayout", "\"nodeLayout\"")
        text = text.replace("x:", "\"x\":")
        text = text.replace("y:", "\"y\":")
        text = text.replace("width:", "\"width\":")
        text = text.replace("height:", "\"height\":")
        text = text.replace("\'", "\"")

    with open(fname, 'w') as file_:
        file_.write(text)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Modify JSON output so it\'s suitable for ingestion by the Atlas client.')

    parser.add_argument('url', action = 'store', type = str, help = 'The text to parse.' )
    parser.add_argument('outname', action = 'store', type = str, help = 'The text to parse.' )

    args = parser.parse_args()

    

    outname = args.fname
    convertFile(outname)
