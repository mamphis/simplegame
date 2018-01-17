import * as nodeStatic from 'node-static';
import * as http from 'http';
import * as socketIO from 'socket.io';
import { IncomingMessage, ServerResponse } from 'http';


export class MainServer {
    private sio: SocketIO.Server;
    private fileServer: nodeStatic.Server;
    private httpServer: http.Server;
    private listeningPort: number;

    private connectedClients: Array<{ name: string, id: string }>;


    constructor(port: number) {
        this.listeningPort = port;

        this.connectedClients = new Array();

        this.fileServer = new nodeStatic.Server('www', {
            cache: 0
        });

        this.httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
            request.addListener('end', () => {
                this.fileServer.serve(request, response);
            });

            request.resume();
        });

        this.httpServer.listen(this.listeningPort);

        this.sio = socketIO();
        this.sio.serveClient(true);
        this.sio.attach(this.httpServer);

        this.sio.on('connection', (socket: SocketIO.Socket) => {
            console.log("Client connected: " + socket.id);
            let socketId: string = socket.id;

            socket.on('disconnect', () => {
                console.log("Client disconnected: " + socketId);
                for (let i = this.connectedClients.length - 1; i >= 0; i--) {
                    if (this.connectedClients[i].id == socketId) {
                        this.connectedClients.splice(i, 1);
                    }
                }
            });

            socket.on('connected', (msg) => {
                console.log("Got client connected message:");
                console.log(msg);
                let errorMessage: string | undefined = undefined;
                if (!msg.name) {
                    errorMessage = "No name provided in welcome message.";
                } else if (this.connectedClients.some((val) => { return val.name == msg.name })) {
                    errorMessage = "The username you chosed is allready in use.";
                }

                if (errorMessage) {
                    socket.emit('servererror', { message: errorMessage });
                    socket.disconnect(true);
                } else {
                    this.connectedClients.push({ name: msg.name, id: socketId });
                    socket.emit('login', {
                        name: msg.name,
                        id: socketId
                    });
                }
            });

            socket.on('clientMessage', (message: any): void => {
                console.log(message);
                socket.broadcast.emit('clientMessage', message);
            })
        });
    }
}