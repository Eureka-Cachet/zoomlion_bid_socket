var app = require('http').createServer(handler);

const _ = require('lodash');

var io = require('socket.io')(app);

const Hotel = require('socket.io-hotel');

var hotel = new Hotel(io.sockets.adapter);

const deviceDisconnected = "DEVICE:DISCONNECTED";

const dashboardDevices = "DASHBOARD:DEVICES";
const dashboardClockingDay = "DASHBOARD:CLOCKING_DAY";
const dashboardClockingMonth = "DASHBOARD:CLOCKING_MONTH";
const dashboardBeneficiary = "DASHBOARD:BENEFICIARY";

const connectedDevicesEvent = "devices:connected";


let devices = [];
const room = "DEVICES";

function update_list({type, deviceId, connId}) {
    switch(type){
        case "BROWSER":
            return devices;
        case "CREDENCE":
            console.log('updating....');
            devices = _.reject(devices, {deviceId});
            return [...devices, {deviceId, connId}];
        default:
            return devices;
    }
}

var enrolment = io.of('/enrolment');
enrolment.on('connection', function(socket){

    console.log('client connected to enrolment socket');

    socket.on('enrolment', function(payload){
        console.log('***********from enrolment*************');
        console.log(payload.channel);
        socket.broadcast.emit(payload.channel, JSON.stringify(payload.data));
        console.log('**************************************');
    });

    socket.on('disconnect', function(){
        console.log('client disconnected from enrolment socket');
    })
});











var Redis = require('ioredis');
var redis = new Redis(6379, 'redis');

function handler(req, res){
    res.writeHead(200);
    res.end('');
}

redis.psubscribe('*', function(error, count){
    console.log("subscribe to " + count + " channel");
});

function removeFromOnlineList(onlineList, connId) {
    console.log("++++++++++++++++++ removeFromOnlineList +++++++++++++++");
    const device = _.find(onlineList, {connId});
    if(! device ) return onlineList;

    console.log("device to be disconnected -> ", device);
    var left = _.reject(onlineList, {"deviceId": device.deviceId});
    console.log("left => ", left);
    console.log("++++++++++++++++++ removeFromOnlineList +++++++++++++++");
    return left;
}

io.on('connection', function(socket){
    console.log("+++++++++++++++new public connection++++++++++++++++++");
    console.log(socket.id);
    console.log("+++++++++++++++ -------------------- ++++++++++++++++++");
    socket.emit(room, {connId: socket.id});

    socket.emit(connectedDevicesEvent, devices);
    socket.emit(dashboardDevices, devices);

    socket.on(room, data => {
        console.log("---------------- --------------------- --------------------");
        console.log(data);
        devices = update_list(data);
        console.log(devices);
        socket.broadcast.emit(connectedDevicesEvent, devices);
        socket.broadcast.emit(dashboardDevices, devices);
        console.log("---------------- --------------------- --------------------");
    });

    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");

    socket.on('message', msg => {
        console.log("*************Client Public Broadcast***********");
        socket.broadcast.emit("DEVICES:ONLINE", devices);
        socket.broadcast.emit(dashboardDevices, devices);
        console.log(msg);
        socket.broadcast.emit("testing", msg);
        console.log("************************************************");
    });

    socket.on('enrolment', payload =>{
        console.log('***********public from enrolment*************');
        console.log(payload);
        socket.broadcast.emit(payload.channel, JSON.stringify(payload.data));
        console.log('********************');
    });

    socket.on('disconnect', function(any){
        let current = [];
        console.log("---------------- devices disconnection --------------------");
        console.log(`${socket.id} public disconnection`, any);
        current = removeFromOnlineList(devices, socket.id);
        devices = current;
        console.log("currently online", current);
        socket.broadcast.emit(connectedDevicesEvent, devices);
        socket.broadcast.emit(dashboardDevices, devices);
        console.log("---------------- --------------------- --------------------");
    })
});

redis.on('pmessage', function(pattern, channel, message){
    channelHandler(channel, message);
});

function channelHandler(channel, message){
    console.log("*********Server Broadcast************");
    var msg = JSON.parse(message);
    var channel_event = channel+":"+msg.event;
    console.log(channel_event, JSON.stringify(msg.data));
    io.emit(channel_event, JSON.stringify(msg.data));
    io.emit("testing", msg.event);
    console.log("**************************************");
}

app.listen(6001, function(){
    console.log('new server started :>( ');
});