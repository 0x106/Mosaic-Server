//
//  ViewController.swift
//  SocketDemo
//
//  Created by Jordan Campbell on 8/02/18.
//  Copyright © 2018 Atlas Innovation. All rights reserved.
//

import UIKit
import SceneKit
import ARKit
import SocketIO

class AtlasSocket {
    
    var manager: SocketManager
    var socket: SocketIOClient
    var connected: Bool = false
    
    init() {
        manager = SocketManager(socketURL: URL(string: "http://localhost:3000")!, config: [.log(false), .compress])
        socket = manager.defaultSocket
        
        socket.on(clientEvent: .connect) {[weak self] data, ack in
            print("socket connected")
            self?.connected = true
        }
        
        socket.onAny {
            print("Got event: \($0.event), with items: \($0.items!)")
        }
        
        socket.on("response") { data, ack in
            print("message received")

            self.send_msg("Neuromancer")
            self.send_url("http://atlasreality.xyz")
        }
        
        socket.connect()
    }
    
    func send_msg(_ message: String) {
        print("Sending message: \(message)")
        socket.emit("msg", message)
    }
    
    func send_url(_ url: String) {
        print("Sending URL: \(url)")
        socket.emit("url", url)
    }
}

class ViewController: UIViewController, ARSCNViewDelegate {

    @IBOutlet var sceneView: ARSCNView!
    let atlas = AtlasSocket()
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Create a session configuration
        let configuration = ARWorldTrackingConfiguration()

        // Run the view's session
//        sceneView.session.run(configuration)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        
        // Pause the view's session
        sceneView.session.pause()
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Release any cached data, images, etc that aren't in use.
    }

    // MARK: - ARSCNViewDelegate
    
/*
    // Override to create and configure nodes for anchors added to the view's session.
    func renderer(_ renderer: SCNSceneRenderer, nodeFor anchor: ARAnchor) -> SCNNode? {
        let node = SCNNode()
     
        return node
    }
*/
    
    func session(_ session: ARSession, didFailWithError error: Error) {
        // Present an error message to the user
        
    }
    
    func sessionWasInterrupted(_ session: ARSession) {
        // Inform the user that the session has been interrupted, for example, by presenting an overlay
        
    }
    
    func sessionInterruptionEnded(_ session: ARSession) {
        // Reset tracking and/or remove existing anchors if consistent tracking is required
        
    }
}
