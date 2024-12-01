import { Component, Element, Events } from '../WebApp/WebApp.js';
import SwitchInput from './basic.components/SwitchInput.js';
import TextInput from './basic.components/TextInput.js';

export class Socket extends Events<Socket.EventMao> {
    private socket: WebSocket;
    public constructor(url: string) { super();
        this.socket = new WebSocket(url);
        this.socket.addEventListener('open', () => this.dispatch('open'));
        this.socket.addEventListener('close', () => this.dispatch('close'));
        this.socket.addEventListener('message', (event) => this.dispatch('message', event));
    }
    /**
     * send data to the server using WebSocket
     * @param data data to send
     * @throws Error if the socket is not open
    */
    public send(data: Socket.Document): void {
        this.socket.send(JSON.stringify(data));
    }
    /**
     * close the WebSocket connection
    */
    public close(): void {
        this.socket.close();
    }
}

export namespace Socket {
    export interface Document {
        [key: string]: any;
    }
    export type EventMao = {
        open: () => void;
        close: () => void;
        message: (event: MessageEvent) => void;
    };
}

export class Channel extends Events<Channel.EventMao> {
    private dataChannel: RTCDataChannel;
    public constructor(dataChannel: RTCDataChannel) { super();
        this.dataChannel = dataChannel;
        this.dataChannel.addEventListener('open', () => this.dispatch('open'));
        this.dataChannel.addEventListener('close', () => this.dispatch('close'));
        this.dataChannel.addEventListener('message', (event) => this.dispatch('message', event));
    }
    public get label(): string {
        return this.dataChannel.label;
    }
    public get readyState(): RTCDataChannelState {
        return this.dataChannel.readyState;
    }
    public get bufferedAmount(): number {
        return this.dataChannel.bufferedAmount;
    }
    public replaceInstance(dataChannel: RTCDataChannel): void {
        if (this.dataChannel.readyState !== 'closed') this.dataChannel.close();
        this.dataChannel = dataChannel;
        this.dataChannel.addEventListener('open', () => this.dispatch('open'));
        this.dataChannel.addEventListener('close', () => this.dispatch('close'));
        this.dataChannel.addEventListener('message', (event) => this.dispatch('message', event));

    }
    public send(data: string): void {
        this.dataChannel.send(data);
    }
    public close(): void {
        this.dataChannel.close();
    }
}

export namespace Channel {
    export type EventMao = {
        open: () => void;
        close: () => void;
        message: (event: MessageEvent) => void;
    };
}

export class P2P extends Events<P2P.EventMao> {
    private socket: Socket;
    private peerConnection: RTCPeerConnection;
    private dataChannels: Map<string, Channel>;

    public constructor(rom: string) { super();
        console.log('Initializing P2P connection');
        this.socket = new Socket(`wss://localhost:3000/RTC/${rom}`);
        this.dataChannels = new Map();
        this.peerConnection = new RTCPeerConnection();
        this.setupSocket();
        this.setupPeerConnection();
    }

    public get connection(): RTCPeerConnection {
        return this.peerConnection;
    }

    /**
     * initialize the WebSocket events
     */
    private setupSocket(): void {
        this.socket.on('close', () => {
            console.log('[WebSocket]: Connection closed');
        });
        this.socket.on('open', () => {
            console.log('[WebSocket]: Connection established');
        });
        this.socket.on('message', (event) => {
            console.log('[WebSocket]: Message received:', event.data);
            this.commandExecutor(event.data);
        });
    }
    /**
     * initialize the PeerConnection events
     */
    private setupPeerConnection(): void {
        this.peerConnection.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                this.sendCandidate(event.candidate);
            }
        });
        this.peerConnection.addEventListener('connectionstatechange', () => {
            console.log('[PeerConnection]: State changed to', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.dispatch('connected');
            } else if (this.peerConnection.connectionState === 'disconnected') {
                this.dispatch('disconnected');
            }
        });
        this.peerConnection.addEventListener('datachannel', (event) => {
            const dataChannel = event.channel;
            console.log(this.dataChannels);
            let channel: Channel | undefined = this.dataChannels.get(dataChannel.label);
            if (!channel) {
                console.log('[PeerConnection]: Creating new DataChannel instance:', dataChannel.label); // Debug log
                channel = this.createChannel(dataChannel);
                this.dataChannels.set(dataChannel.label, channel);
            } else {
                console.log('[PeerConnection]: DataChannel already exists, replacing instance:', dataChannel.label); // Debug log
                channel.replaceInstance(dataChannel);
            }
        });
    }
    /**
     * handle/parse the received data from the server and execute the corresponding command
     * @param data data to parse and execute
    */
    private commandExecutor(data: string): void {
        const { command, ...body } = JSON.parse(data);
        switch (command) {
            case 'rtc_new_client': {
                this.sendOffer(); break;
            }
            case 'rtc_offer': {
                const offer = body.offer;
                if (!offer) { console.log('[RTC]: Offer received is null'); return; }
                this.sendAnswer(body.offer); break;
            }
            case 'rtc_answer': {
                const answer = body.answer;
                if (!answer) { console.log('[RTC]: Answer received is null'); return; }
                this.handleAnswer(body.answer); break;
            }
            case 'rtc_candidate': {
                const candidate = body.candidate;
                if (!candidate) { console.log('[RTC]: Candidate received is null'); return; }
                this.handleCandidate(body.candidate); break;
            }
            case 'rtc_leave': {
                console.log('[RTC]: Peer left the room');
                break;
            }
            default: {
                console.log('[RTC]: Unknown command:', command);
            }
        }
    }
    /**
     * send the offer to the server to start the P2P connection
    */
    private async sendOffer(): Promise<void> {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log('[RTC]: Sending offer', offer); // Debug log
        this.socket.send({ command: 'rtc_offer', offer });
    }
    /**
     * send the answer to the server to start the P2P connection
     * @param offer offer to send
    */
    private async sendAnswer(offer: RTCSessionDescriptionInit): Promise<void> {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        console.log('[RTC]: Sending answer', answer); // Debug log
        this.socket.send({ command: 'rtc_answer', answer });
    }
    /**
     * handle the answer from the server to start the P2P connection
     * @param answer answer to handle
    */
    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        console.log('[RTC]: Handling answer', answer); // Debug log
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
    /**
     * send the candidate to the server
     * @param candidate candidate to send
    */
    private async sendCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        console.log('[RTC]: Sending candidate', candidate); // Debug log
        this.socket.send({ command: 'rtc_candidate', candidate });
    }
    /**
     * handle the candidate from the server and add it to the P2P connection
     * @param candidate candidate to handle
    */
    private async handleCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        console.log('[RTC]: Handling candidate', candidate); // Debug log
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    /**
     * close the P2P connection
    */
    public close(): void {
        this.peerConnection.close();
        this.socket.close();
    }
    /**
     * create a new channel (dataChannel) in the P2P connection
     * @param label Label for the DataChannel
     */
    private createChannel(dataChannel: RTCDataChannel): Channel {
        const channel = new Channel(dataChannel);
        channel.on('open', () => {
            console.log('[Channel]: Open');
        });
        channel.on('close', () => {
            console.log('[Channel]: Closed');
        });
        channel.on('message', (event) => {
            console.log('[Channel]: Message received:', event.data);
        });
        return channel;
    }
    /**
     * get an channel (dataChannel) from the P2P connection
     * @param label Label for the DataChannel
     */
    public getChannel(label: string): Channel {
        let channel: Channel | undefined = this.dataChannels.get(label);
        if (!channel) {
            console.log('[PeerConnection]: Creating new DataChannel instance:', label); // Debug log
            const dataChannel = this.peerConnection.createDataChannel(label);
            channel = this.createChannel(dataChannel);
            this.dataChannels.set(label, channel);
        }
        return channel;
    }
}

export namespace P2P {
    export type EventMao = {
        connected: () => void;
        disconnected: () => void;
    };
}

export class RTC extends Component<'div'> {
    protected component: Element<'div'>;
    protected isClient: SwitchInput;
    protected video: Element<'video'>;
    protected input: TextInput;
    private p2p: P2P;
    private dataChannel: Channel;
    private stream?: MediaStream;

    public constructor() { super();
        this.isClient = new SwitchInput(true, 'Client mode');
        this.video = Element.new('video').setAttributes({ autoplay: 'true', controls: 'true'});
        this.input = new TextInput({ placeholder: 'message', button: 'send' });
        this.component = Element.new('div');
        this.p2p = new P2P('test');
        this.dataChannel = this.p2p.getChannel('chat');

        this.setupMessageSender();

        this.setMode();
        this.isClient.on('change', () => this.setMode());
    }

    private async setMode() {
        if (this.isClient.getState()) {
            this.p2p.connection.addEventListener('track', (event) => {
                console.log('received track:', event.track); // Debug log-
                this.video.HTMLElement.srcObject = event.streams[0];
            });
            this.component.append(this.isClient, this.video, this.input);
            if (this.stream) {
                this.stream.clone();
            }
        } else {
            if (this.stream) this.stream.clone();
            const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true });
            stream.getTracks().forEach((track) => {
                this.p2p.connection.addTrack(track, stream);
            });
            this.stream = stream;
            this.component.clean();
            this.component.append(this.isClient, this.input);
        }
    }

    private setupMessageSender() {
        this.input.on('send', () => {
            const message = this.input.getText();
            if (!message) return;
            console.log('sending message:', message); // Debug log
            this.dataChannel.send(message);
            this.input.clear();
        });
    }

    public disconnect() {
        this.p2p.close();
    }
}

export default RTC;